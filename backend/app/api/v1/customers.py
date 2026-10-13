from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, or_
from typing import List, Optional
import uuid

from app.dependencies import DatabaseDep, CurrentUserDep
from app.core.auth import AuthenticatedUser
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerRead

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerRead])
async def list_customers(
    search: Optional[str] = Query(None),
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    query = select(Customer).where(Customer.workshop_id == workshop_uuid).order_by(desc(Customer.created_at))

    if search:
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                Customer.first_name.ilike(s),
                Customer.last_name.ilike(s),
                Customer.phone.ilike(s),
                Customer.email.ilike(s),
            )
        )

    res = await db.execute(query)
    return res.scalars().all()

@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    cust = Customer(
        workshop_id=workshop_uuid,
        **payload.model_dump()
    )
    db.add(cust)
    await db.flush()
    await db.refresh(cust)
    return cust

@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = DatabaseDep,
    current_user: AuthenticatedUser = CurrentUserDep,
):
    workshop_uuid = uuid.UUID(current_user.workshop_id)
    res = await db.execute(
        select(Customer).where(and_(Customer.id == customer_id, Customer.workshop_id == workshop_uuid))
    )
    cust = res.scalars().first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust
