import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class Workshop(Base):
    __tablename__ = "workshops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    vat_number: Mapped[str] = mapped_column(String(100), nullable=True)
    labour_rate_hourly: Mapped[float] = mapped_column(Numeric(10, 2), default=480.00, nullable=False)
    tax_rate_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=15.00, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="ZAR", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    users = relationship("User", back_populates="workshop", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="workshop", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="workshop", cascade="all, delete-orphan")
    repair_orders = relationship("RepairOrder", back_populates="workshop", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="workshop", cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="workshop", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="workshop", cascade="all, delete-orphan")
