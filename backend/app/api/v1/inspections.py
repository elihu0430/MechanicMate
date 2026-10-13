from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List
import uuid
import secrets

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.models.inspection import (
    Inspection,
    InspectionChecklistItem,
    VehicleDamagePin,
)
from app.schemas.inspection import (
    InspectionCreate,
    InspectionRead,
    DamagePinCreate,
    ChecklistItemCreate,
)

router = APIRouter(prefix="/inspections", tags=["Inspections & DVI"])

@router.get("", response_model=List[InspectionRead])
async def list_inspections(
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(Inspection)
        .options(
            selectinload(Inspection.checklist_items),
            selectinload(Inspection.damage_pins)
        )
        .where(Inspection.workshop_id == workshop_uuid)
    )
    res = await db.execute(query)
    return res.scalars().all()

@router.post("", response_model=InspectionRead, status_code=status.HTTP_201_CREATED)
async def create_inspection(
    payload: InspectionCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)

    count_res = await db.execute(
        select(func.count(Inspection.id)).where(Inspection.workshop_id == workshop_uuid)
    )
    total_insp = count_res.scalar_one() or 0
    insp_number = f"INSP-{1001 + total_insp}"

    new_insp = Inspection(
        workshop_id=workshop_uuid,
        customer_id=payload.customer_id,
        vehicle_id=payload.vehicle_id,
        repair_order_id=payload.repair_order_id,
        inspection_number=insp_number,
        status="in_progress",
        public_token=f"insp_{secrets.token_hex(16)}"
    )

    for item in payload.checklist_items:
        new_insp.checklist_items.append(
            InspectionChecklistItem(**item.model_dump())
        )

    for pin in payload.damage_pins:
        new_insp.damage_pins.append(
            VehicleDamagePin(vehicle_id=payload.vehicle_id, **pin.model_dump())
        )

    db.add(new_insp)
    await db.flush()
    await db.refresh(new_insp)
    return new_insp

@router.get("/{inspection_id}", response_model=InspectionRead)
async def get_inspection(
    inspection_id: uuid.UUID,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = (
        select(Inspection)
        .options(
            selectinload(Inspection.checklist_items),
            selectinload(Inspection.damage_pins)
        )
        .where(and_(Inspection.id == inspection_id, Inspection.workshop_id == workshop_uuid))
    )
    res = await db.execute(query)
    insp = res.scalars().first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection session not found")
    return insp
