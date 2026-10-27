from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid
from app.schemas.job import RepairOrderItemRead


class PaymentCreate(BaseModel):
    amount: float
    payment_method: str  # 'cash', 'card', 'eft', 'account_credit'
    transaction_reference: Optional[str] = None


class PaymentRead(PaymentCreate):
    id: uuid.UUID
    invoice_id: uuid.UUID
    recorded_by_user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    repair_order_id: uuid.UUID
    due_date: Optional[date] = None


class InvoiceRead(BaseModel):
    id: uuid.UUID
    workshop_id: uuid.UUID
    repair_order_id: uuid.UUID
    invoice_number: str
    status: str
    due_date: date
    subtotal: float
    tax_rate_percent: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    created_at: datetime
    payments: List[PaymentRead] = []

    # Enriched fields from associated RepairOrder / Customer / Vehicle
    ro_number: Optional[str] = None
    public_token: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    vehicle_name: Optional[str] = None
    license_plate: Optional[str] = None
    vehicle_vin: Optional[str] = None
    vehicle_mileage_km: Optional[int] = None
    customer_concern: Optional[str] = None
    recommended_work: Optional[str] = None
    items: List[RepairOrderItemRead] = []

    class Config:
        from_attributes = True
