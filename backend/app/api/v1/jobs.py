from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
import secrets
from decimal import Decimal

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.core.websockets import ws_manager
from app.models.job import RepairOrder, RepairOrderItem
from app.models.customer import Customer
from app.models.workshop import Workshop
from app.schemas.job import (
    RepairOrderCreate,
    RepairOrderRead,
    RepairOrderUpdateStatus,
    RepairOrderItemCreate,
    RepairOrderItemRead,
)
from app.services.pricing import PricingEngine
from app.services.trigger import trigger_service

router = APIRouter(prefix="/jobs", tags=["Jobs & Repair Orders"])

def compute_completion(items: List[RepairOrderItem]) -> float:
    if not items:
        return 0.0
    completed = sum(1 for item in items if item.is_completed)
    return round((completed / len(items)) * 100.0, 1)

@router.get("", response_model=List[RepairOrderRead])
async def list_jobs(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(RepairOrder)
        .options(selectinload(RepairOrder.items))
        .where(RepairOrder.workshop_id == workshop_uuid)
        .order_by(desc(RepairOrder.created_at))
    )
    if status_filter:
        query = query.where(RepairOrder.status == status_filter)

    res = await db.execute(query)
    jobs = res.scalars().all()

    output = []
    for j in jobs:
        read_obj = RepairOrderRead.model_validate(j)
        read_obj.completion_percentage = compute_completion(j.items)
        output.append(read_obj)
    return output

@router.post("", response_model=RepairOrderRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: RepairOrderCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)

    # Count for sequential RO number
    count_res = await db.execute(
        select(func.count(RepairOrder.id)).where(RepairOrder.workshop_id == workshop_uuid)
    )
    total_ro = count_res.scalar_one() or 0
    ro_number = f"RO-{1001 + total_ro}"

    # Workshop & Customer resolution for rates and tax
    ws_res = await db.execute(select(Workshop).where(Workshop.id == workshop_uuid))
    workshop = ws_res.scalar_one_or_none() or Workshop(id=workshop_uuid, name="Workshop")

    cust_res = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    customer = cust_res.scalar_one_or_none()

    hourly_rate = PricingEngine.resolve_hourly_rate(workshop, customer)
    tax_rate, is_tax_exempt = PricingEngine.resolve_tax_exemption(workshop, customer)

    subtotal_parts = Decimal("0.00")
    subtotal_labour = Decimal("0.00")

    items_to_create = []
    for it in payload.items:
        if it.item_type == "labour":
            hrs = Decimal(str(it.labour_hours or 1.0))
            rate = Decimal(str(it.labour_hourly_rate or hourly_rate))
            line_tot = hrs * rate
            subtotal_labour += line_tot
            items_to_create.append(
                RepairOrderItem(
                    item_type="labour",
                    description=it.description,
                    quantity=hrs,
                    unit_price=rate,
                    labour_hours=hrs,
                    labour_hourly_rate=rate,
                    total_price=line_tot,
                    is_completed=it.is_completed,
                )
            )
        else:
            qty = Decimal(str(it.quantity or 1.0))
            price = Decimal(str(it.unit_price or 0.0))
            line_tot = qty * price
            subtotal_parts += line_tot
            items_to_create.append(
                RepairOrderItem(
                    item_type="part",
                    description=it.description,
                    part_number=it.part_number,
                    quantity=qty,
                    unit_price=price,
                    total_price=line_tot,
                    is_completed=it.is_completed,
                )
            )

    totals = PricingEngine.calculate_totals(
        subtotal_parts=subtotal_parts,
        subtotal_labour=subtotal_labour,
        tax_rate_percent=tax_rate,
        is_tax_exempt=is_tax_exempt,
    )

    new_ro = RepairOrder(
        workshop_id=workshop_uuid,
        customer_id=payload.customer_id,
        vehicle_id=payload.vehicle_id,
        ro_number=ro_number,
        status="created",
        customer_concern=payload.customer_concern,
        diagnosis=payload.diagnosis,
        recommended_work=payload.recommended_work,
        subtotal_parts=totals["subtotal_parts"],
        subtotal_labour=totals["subtotal_labour"],
        tax_amount=totals["tax_amount"],
        total_amount=totals["total_amount"],
        scheduled_at=payload.scheduled_at,
        public_token=f"ro_{secrets.token_hex(16)}",
        items=items_to_create,
    )
    db.add(new_ro)
    await db.flush()
    await db.refresh(new_ro)

    # Broadcast to workshop board
    await ws_manager.broadcast_workshop(
        str(workshop_uuid),
        {"event": "job_created", "ro_number": ro_number, "status": "created"}
    )

    read_obj = RepairOrderRead.model_validate(new_ro)
    read_obj.completion_percentage = compute_completion(new_ro.items)
    return read_obj

@router.patch("/{job_id}/status", response_model=RepairOrderRead)
async def update_job_status(
    job_id: uuid.UUID,
    payload: RepairOrderUpdateStatus,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(RepairOrder)
        .options(selectinload(RepairOrder.items))
        .where(
            and_(
                RepairOrder.id == job_id,
                RepairOrder.workshop_id == workshop_uuid
            )
        )
    )
    res = await db.execute(query)
    ro = res.scalars().first()
    if not ro:
        raise HTTPException(status_code=404, detail="Repair order not found")

    ro.status = payload.status
    await db.flush()
    await db.refresh(ro)

    # Broadcast status change across garage screens
    await ws_manager.broadcast_workshop(
        str(workshop_uuid),
        {
            "event": "job_status_updated",
            "job_id": str(job_id),
            "ro_number": ro.ro_number,
            "status": ro.status,
            "completion_percentage": compute_completion(ro.items),
        }
    )

    read_obj = RepairOrderRead.model_validate(ro)
    read_obj.completion_percentage = compute_completion(ro.items)
    return read_obj

@router.patch("/{job_id}/items/{item_id}/toggle")
async def toggle_item_completion(
    job_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(RepairOrder)
        .options(selectinload(RepairOrder.items))
        .where(
            and_(
                RepairOrder.id == job_id,
                RepairOrder.workshop_id == workshop_uuid
            )
        )
    )
    res = await db.execute(query)
    ro = res.scalars().first()
    if not ro:
        raise HTTPException(status_code=404, detail="Repair order not found")

    target_item = next((it for it in ro.items if it.id == item_id), None)
    if not target_item:
        raise HTTPException(status_code=404, detail="Line item not found")

    target_item.is_completed = not target_item.is_completed
    await db.flush()

    new_pct = compute_completion(ro.items)

    # Broadcast live WIP progress bar percentage
    await ws_manager.broadcast_workshop(
        str(workshop_uuid),
        {
            "event": "wip_progress_updated",
            "job_id": str(job_id),
            "ro_number": ro.ro_number,
            "completion_percentage": new_pct,
        }
    )

    return {"success": True, "item_id": str(item_id), "is_completed": target_item.is_completed, "completion_percentage": new_pct}


@router.post("/{job_id}/send-quote")
async def send_job_quote(
    job_id: uuid.UUID,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    """
    Dispatches a quote estimate notification to the customer via Trigger.dev WhatsApp task.
    """
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(RepairOrder)
        .options(selectinload(RepairOrder.items))
        .where(
            and_(
                RepairOrder.id == job_id,
                RepairOrder.workshop_id == workshop_uuid
            )
        )
    )
    res = await db.execute(query)
    ro = res.scalars().first()
    if not ro:
        raise HTTPException(status_code=404, detail="Repair order not found")

    cust_res = await db.execute(select(Customer).where(Customer.id == ro.customer_id))
    customer = cust_res.scalar_one_or_none()
    if not customer or not customer.phone:
        raise HTTPException(
            status_code=400,
            detail="Customer phone number is required for WhatsApp quote dispatch"
        )

    run_meta = await trigger_service.dispatch_whatsapp(
        to=customer.phone,
        template_name="mechanicmate_quote_approval",
        variables={
            "customer_name": f"{customer.first_name} {customer.last_name}",
            "ro_number": ro.ro_number,
            "total_amount": f"R{ro.total_amount:.2f}",
            "portal_url": f"/portal/{ro.public_token}",
        }
    )

    return {
        "success": True,
        "job_id": str(job_id),
        "recipient": customer.phone,
        "run": run_meta,
    }
