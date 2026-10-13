import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.models.base import Base

class DiagnosticEntry(Base):
    __tablename__ = "diagnostic_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repair_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("repair_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    system_category: Mapped[str] = mapped_column(String(100), nullable=False) # 'Engine', 'Brakes', 'Suspension'
    customer_concern: Mapped[str] = mapped_column(Text, nullable=False)
    technician_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    correction_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    repair_order = relationship("RepairOrder", back_populates="diagnostics")

class ObdScanRecord(Base):
    __tablename__ = "obd_scan_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repair_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("repair_orders.id", ondelete="SET NULL"), nullable=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    protocol: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dtc_codes: Mapped[Any] = mapped_column(JSONB, default=list, nullable=False) # e.g. ["P0300", "P0420"]
    live_pids: Mapped[Any] = mapped_column(JSONB, default=dict, nullable=False) # e.g. {"rpm": 850, "temp": 92}
    freeze_frame_data: Mapped[Any] = mapped_column(JSONB, default=dict, nullable=False)
    scanned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    vehicle = relationship("Vehicle", back_populates="obd_records")
