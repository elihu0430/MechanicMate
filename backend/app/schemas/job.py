from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class RepairOrderItemBase(BaseModel):
    item_type: str = "labour" # 'part', 'labour', 'tire', 'sublet'
    description: str
    part_number: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    labour_hours: Optional[float] = None
    labour_hourly_rate: Optional[float] = None
    total_price: float = 0.0
    is_completed: bool = False

class RepairOrderItemCreate(RepairOrderItemBase):
    pass

class RepairOrderItemRead(RepairOrderItemBase):
    id: uuid.UUID
    repair_order_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RepairOrderBase(BaseModel):
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID
    customer_concern: str
    diagnosis: Optional[str] = None
    recommended_work: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class RepairOrderCreate(RepairOrderBase):
    items: List[RepairOrderItemCreate] = []

class RepairOrderUpdateStatus(BaseModel):
    status: str # 'created', 'wip', 'completed', 'due'

class RepairOrderRead(RepairOrderBase):
    id: uuid.UUID
    workshop_id: uuid.UUID
    ro_number: str
    status: str
    subtotal_parts: float
    subtotal_labour: float
    tax_amount: float
    total_amount: float
    completed_at: Optional[datetime] = None
    public_token: Optional[str] = None
    created_at: datetime
    items: List[RepairOrderItemRead] = []
    completion_percentage: float = 0.0

    class Config:
        from_attributes = True
