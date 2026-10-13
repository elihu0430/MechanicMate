from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List, Optional
import uuid

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.models.vehicle import Vehicle
from app.schemas.intake import VehicleCreate, VehicleRead

from app.models.customer import Customer
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleRead])
async def list_vehicles(
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    res = await db.execute(
        select(Vehicle).where(Vehicle.workshop_id == workshop_uuid).order_by(desc(Vehicle.created_at))
    )
    return res.scalars().all()

@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    payload: VehicleCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)

    # Validate that customer exists in this workshop
    cust_res = await db.execute(
        select(Customer).where(and_(Customer.id == payload.customer_id, Customer.workshop_id == workshop_uuid))
    )
    if not cust_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{payload.customer_id}' was not found. Please create or select an existing customer first."
        )

    veh = Vehicle(
        workshop_id=workshop_uuid,
        customer_id=payload.customer_id,
        license_plate=payload.license_plate.strip().upper(),
        year=payload.year,
        make=payload.make,
        model=payload.model,
        color=payload.color,
        mileage_km=payload.mileage_km,
        engine=payload.engine,
        vin=payload.vin,
    )
    db.add(veh)
    try:
        await db.flush()
        await db.refresh(veh)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity constraint violated: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
        )
    return veh

@router.get("/{vehicle_id}", response_model=VehicleRead)
async def get_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    res = await db.execute(
        select(Vehicle).where(and_(Vehicle.id == vehicle_id, Vehicle.workshop_id == workshop_uuid))
    )
    veh = res.scalars().first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return veh
