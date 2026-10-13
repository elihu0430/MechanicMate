from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid

class PaymentCreate(BaseModel):
    amount: float
    payment_method: str # 'cash', 'card', 'eft', 'account_credit'
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
    due_date: date

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

    class Config:
        from_attributes = True
