from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class VehicleBase(BaseModel):
    license_plate: str
    year: int
    make: str
    model: str
    color: Optional[str] = None
    mileage_km: int = 0
    engine: Optional[str] = None
    vin: Optional[str] = None

class VehicleCreate(VehicleBase):
    customer_id: uuid.UUID

class VehicleRead(VehicleBase):
    id: uuid.UUID
    workshop_id: uuid.UUID
    customer_id: uuid.UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerSummary(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: Optional[str] = None
    is_tax_exempt: bool = False
    custom_labor_rate_hourly: Optional[float] = None

    class Config:
        from_attributes = True

class IntakeLookupResponse(BaseModel):
    vehicle: VehicleRead
    customer: CustomerSummary
    past_repair_orders_count: int
    last_service_date: Optional[datetime] = None
    active_repair_order_id: Optional[uuid.UUID] = None
