from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
import uuid

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.job import RepairOrder
from app.schemas.intake import IntakeLookupResponse, VehicleRead, CustomerSummary

router = APIRouter(prefix="/intake", tags=["Intake"])

@router.get("/lookup", response_model=IntakeLookupResponse)
async def lookup_plate(
    reg_num: str = Query(..., description="South African Registration Plate, e.g. ABC 123 GP"),
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    normalized = reg_num.strip().upper()
    workshop_uuid = uuid.UUID(current_user.workshop_id)

    # Fast indexed lookup on (workshop_id, license_plate)
    query = (
        select(Vehicle)
        .options(selectinload(Vehicle.customer))
        .where(
            and_(
                Vehicle.workshop_id == workshop_uuid,
                Vehicle.license_plate == normalized
            )
        )
    )
    result = await db.execute(query)
    vehicle = result.scalars().first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with plate '{reg_num}' not found in workshop directory"
        )

    # Fetch past repair order count and latest RO
    ro_query = (
        select(
            func.count(RepairOrder.id),
            func.max(RepairOrder.created_at)
        )
        .where(
            and_(
                RepairOrder.workshop_id == workshop_uuid,
                RepairOrder.vehicle_id == vehicle.id
            )
        )
    )
    ro_res = await db.execute(ro_query)
    ro_count, last_date = ro_res.first() or (0, None)

    # Active RO if any
    active_ro_query = (
        select(RepairOrder.id)
        .where(
            and_(
                RepairOrder.workshop_id == workshop_uuid,
                RepairOrder.vehicle_id == vehicle.id,
                RepairOrder.status.in_(["created", "wip"])
            )
        )
        .limit(1)
    )
    active_ro_res = await db.execute(active_ro_query)
    active_ro_id = active_ro_res.scalar_one_or_none()

    customer = vehicle.customer
    customer_summary = CustomerSummary(
        id=customer.id,
        name=f"{customer.first_name} {customer.last_name}",
        phone=customer.phone,
        email=customer.email,
        is_tax_exempt=customer.is_tax_exempt,
        custom_labor_rate_hourly=customer.custom_labor_rate_hourly if customer.has_labor_rate_override else None
    )

    return IntakeLookupResponse(
        vehicle=VehicleRead.model_validate(vehicle),
        customer=customer_summary,
        past_repair_orders_count=ro_count or 0,
        last_service_date=last_date,
        active_repair_order_id=active_ro_id
    )
