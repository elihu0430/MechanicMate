import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.app.models.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workshop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    license_plate: Mapped[str] = mapped_column(String(50), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mileage_km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engine: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    vin: Mapped[Optional[str]] = mapped_column(String(17), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_vehicles_plate", "workshop_id", "license_plate"),
        Index("idx_vehicles_vin", "workshop_id", "vin"),
    )

    workshop = relationship("Workshop", back_populates="vehicles")
    customer = relationship("Customer", back_populates="vehicles")
    repair_orders = relationship("RepairOrder", back_populates="vehicle")
    inspections = relationship("Inspection", back_populates="vehicle")
    obd_records = relationship("ObdScanRecord", back_populates="vehicle")
