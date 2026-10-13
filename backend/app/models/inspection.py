import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Numeric, DateTime, Text, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workshop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    repair_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("repair_orders.id"), nullable=True)
    inspection_number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="in_progress", nullable=False) # 'in_progress', 'completed', 'converted'
    overall_condition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # 'good', 'fair', 'poor'
    public_token: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    workshop = relationship("Workshop", back_populates="inspections")
    vehicle = relationship("Vehicle", back_populates="inspections")
    checklist_items: Mapped[List["InspectionChecklistItem"]] = relationship("InspectionChecklistItem", back_populates="inspection", cascade="all, delete-orphan")
    damage_pins: Mapped[List["VehicleDamagePin"]] = relationship("VehicleDamagePin", back_populates="inspection", cascade="all, delete-orphan")
    attachments: Mapped[List["InspectionAttachment"]] = relationship("InspectionAttachment", back_populates="inspection", cascade="all, delete-orphan")

class InspectionChecklistItem(Base):
    __tablename__ = "inspection_checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False) # 'Engine', 'Brakes', 'Tires', etc.
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="good", nullable=False) # 'good', 'fair', 'poor'
    measurement_value: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    measurement_unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    suggested_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    inspection = relationship("Inspection", back_populates="checklist_items")

class VehicleDamagePin(Base):
    __tablename__ = "vehicle_damage_pins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    view_angle: Mapped[str] = mapped_column(String(50), nullable=False) # 'top', 'front', 'rear', 'side_left', 'side_right'
    x_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    y_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    damage_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'dent', 'scratch', 'crack', 'paint_chip', 'rust'
    severity: Mapped[str] = mapped_column(String(50), default="minor", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    inspection = relationship("Inspection", back_populates="damage_pins")

class InspectionAttachment(Base):
    __tablename__ = "inspection_attachments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    inspection = relationship("Inspection", back_populates="attachments")
