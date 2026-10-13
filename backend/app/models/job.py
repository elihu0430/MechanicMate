import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Numeric, Boolean, DateTime, Text, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workshop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    ro_number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="created", nullable=False) # 'created', 'wip', 'completed', 'due'
    customer_concern: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_work: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subtotal_parts: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    subtotal_labour: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    public_token: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_repair_orders_status", "workshop_id", "status"),
        Index("idx_repair_orders_vehicle", "workshop_id", "vehicle_id"),
    )

    workshop = relationship("Workshop", back_populates="repair_orders")
    customer = relationship("Customer", back_populates="repair_orders")
    vehicle = relationship("Vehicle", back_populates="repair_orders")
    items: Mapped[List["RepairOrderItem"]] = relationship("RepairOrderItem", back_populates="repair_order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="repair_order")
    diagnostics = relationship("DiagnosticEntry", back_populates="repair_order", cascade="all, delete-orphan")

class RepairOrderItem(Base):
    __tablename__ = "repair_order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repair_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("repair_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False) # 'part', 'labour', 'tire', 'sublet'
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    part_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(8, 2), default=1.00, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    labour_hours: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    labour_hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    repair_order = relationship("RepairOrder", back_populates="items")
