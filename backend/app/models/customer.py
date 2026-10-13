import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, Boolean, Integer, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.app.models.base import Base

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workshop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 5-Point Client Financial Overrides Matrix
    is_tax_exempt: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    has_labor_rate_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_labor_rate_hourly: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    has_parts_markup_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_parts_markup_percent: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    custom_payment_terms_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    workshop = relationship("Workshop", back_populates="customers")
    vehicles = relationship("Vehicle", back_populates="customer", cascade="all, delete-orphan")
    repair_orders = relationship("RepairOrder", back_populates="customer")
