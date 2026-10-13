from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class DamagePinCreate(BaseModel):
    view_angle: str # 'top', 'front', 'rear', 'side_left', 'side_right'
    x_percent: float
    y_percent: float
    damage_type: str # 'dent', 'scratch', 'crack', 'paint_chip', 'rust'
    severity: str = "minor"
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class DamagePinRead(DamagePinCreate):
    id: uuid.UUID
    inspection_id: uuid.UUID
    vehicle_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ChecklistItemCreate(BaseModel):
    category: str
    title: str
    status: str = "good" # 'good', 'fair', 'poor'
    measurement_value: Optional[float] = None
    measurement_unit: Optional[str] = None
    suggested_action: Optional[str] = None
    notes: Optional[str] = None

class ChecklistItemRead(ChecklistItemCreate):
    id: uuid.UUID
    inspection_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class InspectionCreate(BaseModel):
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID
    repair_order_id: Optional[uuid.UUID] = None
    checklist_items: List[ChecklistItemCreate] = []
    damage_pins: List[DamagePinCreate] = []

class InspectionRead(BaseModel):
    id: uuid.UUID
    workshop_id: uuid.UUID
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID
    repair_order_id: Optional[uuid.UUID] = None
    inspection_number: str
    status: str
    overall_condition: Optional[str] = None
    public_token: Optional[str] = None
    created_at: datetime
    checklist_items: List[ChecklistItemRead] = []
    damage_pins: List[DamagePinRead] = []

    class Config:
        from_attributes = True
