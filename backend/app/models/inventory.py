import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, Integer, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workshop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workshops.id", ondelete="CASCADE"), nullable=False)
    item_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'part', 'tire', 'canned_labor'
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    retail_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    quantity_on_hand: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    reorder_threshold: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    bin_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Tire-specific dimensions
    tire_width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tire_aspect_ratio: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tire_rim_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tire_speed_index: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    tire_season: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Canned labor
    canned_standard_hours: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_inventory_workshop", "workshop_id", "item_type"),
        Index("idx_inventory_sku", "workshop_id", "sku"),
    )

    workshop = relationship("Workshop", back_populates="inventory_items")
