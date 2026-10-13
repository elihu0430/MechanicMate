from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_tax_exempt: bool = False
    default_discount_percent: float = 0.0
    has_labor_rate_override: bool = False
    custom_labor_rate_hourly: Optional[float] = None
    has_parts_markup_override: bool = False
    custom_parts_markup_percent: Optional[float] = None
    custom_payment_terms_days: int = 0

class CustomerCreate(CustomerBase):
    pass

class CustomerRead(CustomerBase):
    id: uuid.UUID
    workshop_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
