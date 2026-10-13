from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.models.invoice import Invoice, Payment
from app.models.job import RepairOrder
from app.schemas.invoice import InvoiceCreate, InvoiceRead, PaymentCreate, PaymentRead

router = APIRouter(prefix="/invoices", tags=["Invoices & Billing"])

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
    )
    res = await db.execute(query)
    return res.scalars().all()

@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def generate_invoice_from_job(
    payload: InvoiceCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)

    # Fetch Repair Order
    ro_res = await db.execute(
        select(RepairOrder).where(
            and_(
                RepairOrder.id == payload.repair_order_id,
                RepairOrder.workshop_id == workshop_uuid
            )
        )
    )
    ro = ro_res.scalar_one_or_none()
    if not ro:
        raise HTTPException(status_code=404, detail="Repair order not found")

    count_res = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.workshop_id == workshop_uuid)
    )
    total_inv = count_res.scalar_one() or 0
    inv_number = f"INV-{1001 + total_inv}"

    inv = Invoice(
        workshop_id=workshop_uuid,
        repair_order_id=ro.id,
        invoice_number=inv_number,
        status="sent",
        due_date=payload.due_date,
        subtotal=ro.subtotal_parts + ro.subtotal_labour,
        tax_rate_percent=15.00,
        tax_amount=ro.tax_amount,
        total_amount=ro.total_amount,
        paid_amount=0.00
    )
    db.add(inv)
    await db.flush()
    await db.refresh(inv)
    return inv

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
                Invoice.workshop_id == workshop_uuid
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

    # Update invoice paid balance and status
    new_paid = float(invoice.paid_amount) + payload.amount
    invoice.paid_amount = new_paid
    if new_paid >= float(invoice.total_amount):
        invoice.status = "paid"
    elif new_paid > 0:
        invoice.status = "partially-paid"

    await db.flush()
    await db.refresh(payment)
    return payment
