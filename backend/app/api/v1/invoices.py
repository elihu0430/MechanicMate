from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date, timedelta
import uuid

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.models.invoice import Invoice, Payment
from app.models.job import RepairOrder
from app.schemas.invoice import InvoiceCreate, InvoiceRead, PaymentCreate, PaymentRead
from app.schemas.job import RepairOrderItemRead

router = APIRouter(prefix="/invoices", tags=["Invoices & Billing"])


async def enrich_invoice(db: AsyncSession, inv: Invoice) -> InvoiceRead:
    data = InvoiceRead.model_validate(inv)
    if not inv.repair_order_id:
        return data

    ro_res = await db.execute(
        select(RepairOrder)
        .options(
            selectinload(RepairOrder.items),
            selectinload(RepairOrder.customer),
            selectinload(RepairOrder.vehicle),
        )
        .where(RepairOrder.id == inv.repair_order_id)
    )
    ro = ro_res.scalars().first()
    if ro:
        data.ro_number = ro.ro_number
        data.public_token = ro.public_token
        data.customer_concern = ro.customer_concern
        data.recommended_work = ro.recommended_work or ro.diagnosis
        if ro.customer:
            data.customer_name = f"{ro.customer.first_name} {ro.customer.last_name}".strip()
            data.customer_phone = ro.customer.phone
            data.customer_email = ro.customer.email
        if ro.vehicle:
            data.vehicle_name = f"{ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}".strip()
            data.license_plate = ro.vehicle.license_plate
            data.vehicle_vin = ro.vehicle.vin
            data.vehicle_mileage_km = ro.vehicle.mileage_km
        data.items = [RepairOrderItemRead.model_validate(it) for it in (ro.items or [])]
    return data


async def ensure_invoice_for_ro(db: AsyncSession, ro: RepairOrder) -> Invoice:
    existing_res = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(
            and_(
                Invoice.repair_order_id == ro.id,
                Invoice.workshop_id == ro.workshop_id,
            )
        )
    )
    existing_inv = existing_res.scalars().first()
    if existing_inv:
        if existing_inv.status != "paid":
            existing_inv.subtotal = float(ro.subtotal_parts or 0) + float(ro.subtotal_labour or 0)
            existing_inv.tax_amount = float(ro.tax_amount or 0)
            existing_inv.total_amount = float(ro.total_amount or 0)
            await db.flush()
        return existing_inv

    count_res = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.workshop_id == ro.workshop_id)
    )
    total_inv = count_res.scalar_one() or 0
    inv_number = f"INV-{1001 + total_inv}"

    inv = Invoice(
        workshop_id=ro.workshop_id,
        repair_order_id=ro.id,
        invoice_number=inv_number,
        status="sent",
        due_date=date.today() + timedelta(days=14),
        subtotal=float(ro.subtotal_parts or 0) + float(ro.subtotal_labour or 0),
        tax_rate_percent=15.00,
        tax_amount=float(ro.tax_amount or 0),
        total_amount=float(ro.total_amount or 0),
        paid_amount=0.00,
    )
    db.add(inv)
    await db.flush()

    created_res = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(Invoice.id == inv.id)
    )
    return created_res.scalar_one()


@router.get("", response_model=List[InvoiceRead])
async def list_invoices(
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(Invoice.workshop_id == workshop_uuid)
        .order_by(desc(Invoice.created_at))
    )
    res = await db.execute(query)
    invoices = res.scalars().all()
    return [await enrich_invoice(db, inv) for inv in invoices]


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def generate_invoice_from_job(
    payload: InvoiceCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)

    ro_res = await db.execute(
        select(RepairOrder).where(
            and_(
                RepairOrder.id == payload.repair_order_id,
                RepairOrder.workshop_id == workshop_uuid,
            )
        )
    )
    ro = ro_res.scalar_one_or_none()
    if not ro:
        raise HTTPException(status_code=404, detail="Repair order not found")

    inv = await ensure_invoice_for_ro(db, ro)
    if payload.due_date and inv.status != "paid":
        inv.due_date = payload.due_date
        await db.flush()
    return await enrich_invoice(db, inv)


@router.post("/{invoice_id}/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def record_payment(
    invoice_id: uuid.UUID,
    payload: PaymentCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    inv_res = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.workshop_id == workshop_uuid,
            )
        )
    )
    invoice = inv_res.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(
        invoice_id=invoice.id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        recorded_by_user_id=current_user.user_id,
    )
    db.add(payment)

    new_paid = float(invoice.paid_amount) + payload.amount
    invoice.paid_amount = new_paid
    if new_paid >= float(invoice.total_amount):
        invoice.status = "paid"
    elif new_paid > 0:
        invoice.status = "partially-paid"

    await db.flush()
    await db.refresh(payment)
    return payment


@router.post("/portal/{token}/pay", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def record_portal_payment(
    token: str,
    payload: PaymentCreate,
    db: AsyncSession = DatabaseDep,
):
    inv_read = await get_portal_invoice(token=token, db=db)
    inv_res = await db.execute(select(Invoice).where(Invoice.id == inv_read.id))
    invoice = inv_res.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(
        invoice_id=invoice.id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference or f"PORTAL-{uuid.uuid4().hex[:6].upper()}",
        recorded_by_user_id="customer_portal",
    )
    db.add(payment)

    new_paid = float(invoice.paid_amount) + payload.amount
    invoice.paid_amount = new_paid
    if new_paid >= float(invoice.total_amount):
        invoice.status = "paid"
    elif new_paid > 0:
        invoice.status = "partially-paid"

    await db.flush()
    await db.refresh(payment)
    return payment


@router.get("/portal/{token}", response_model=InvoiceRead)
async def get_portal_invoice(
    token: str,
    db: AsyncSession = DatabaseDep,
):
    or_clauses = [
        func.lower(Invoice.invoice_number) == token.lower(),
    ]
    try:
        parsed_uuid = uuid.UUID(token)
        or_clauses.append(Invoice.id == parsed_uuid)
        or_clauses.append(Invoice.repair_order_id == parsed_uuid)
    except ValueError:
        pass

    query = (
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(or_(*or_clauses))
    )
    res = await db.execute(query)
    inv = res.scalars().first()

    if not inv:
        ro_or_clauses = [
            RepairOrder.public_token == token,
            func.lower(RepairOrder.ro_number) == token.lower(),
        ]
        try:
            ro_uuid = uuid.UUID(token)
            ro_or_clauses.append(RepairOrder.id == ro_uuid)
        except ValueError:
            pass
        ro_res = await db.execute(select(RepairOrder).where(or_(*ro_or_clauses)))
        ro = ro_res.scalars().first()
        if ro:
            inv = await ensure_invoice_for_ro(db, ro)

    if not inv:
        raise HTTPException(status_code=404, detail="Tax invoice not found")
    return await enrich_invoice(db, inv)


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    or_clauses = [
        func.lower(Invoice.invoice_number) == invoice_id.lower(),
    ]
    try:
        parsed_uuid = uuid.UUID(invoice_id)
        or_clauses.append(Invoice.id == parsed_uuid)
        or_clauses.append(Invoice.repair_order_id == parsed_uuid)
    except ValueError:
        pass

    query = (
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(
            and_(
                Invoice.workshop_id == workshop_uuid,
                or_(*or_clauses),
            )
        )
    )
    res = await db.execute(query)
    inv = res.scalars().first()

    if not inv:
        ro_or_clauses = [
            RepairOrder.public_token == invoice_id,
            func.lower(RepairOrder.ro_number) == invoice_id.lower(),
        ]
        try:
            ro_uuid = uuid.UUID(invoice_id)
            ro_or_clauses.append(RepairOrder.id == ro_uuid)
        except ValueError:
            pass
        ro_res = await db.execute(
            select(RepairOrder).where(
                and_(
                    RepairOrder.workshop_id == workshop_uuid,
                    or_(*ro_or_clauses),
                )
            )
        )
        ro = ro_res.scalars().first()
        if ro:
            inv = await ensure_invoice_for_ro(db, ro)

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return await enrich_invoice(db, inv)
