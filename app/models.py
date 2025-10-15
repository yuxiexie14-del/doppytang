"""SQLAlchemy ORM models for the husbandry domain."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, DECIMAL, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TimestampMixin:
    """Common timestamp columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phones: Mapped[list[str]] = mapped_column(JSON, default=list)
    recipient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    area_code: Mapped[str | None] = mapped_column(String(10))
    first_purchase_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)

    contracts: Mapped[list["Contract"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


class Contract(TimestampMixin, Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    contract_code: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    package_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hen_type: Mapped[str] = mapped_column(String(50), nullable=False)
    egg_type: Mapped[str] = mapped_column(String(50), nullable=False)
    total_eggs: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_eggs: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    hen_delivered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    customer: Mapped[Customer] = relationship(back_populates="contracts")
    batches: Mapped[list["Batch"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    deliveries: Mapped[list["Delivery"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    settlements: Mapped[list["Settlement"]] = relationship(back_populates="contract", cascade="all, delete-orphan")


class Batch(TimestampMixin, Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="planned", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    contract: Mapped[Contract] = relationship(back_populates="batches")
    rearing_plans: Mapped[list["RearingPlan"]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )
    feedings: Mapped[list["Feeding"]] = relationship(back_populates="batch", cascade="all, delete-orphan")
    medications: Mapped[list["Medication"]] = relationship(back_populates="batch", cascade="all, delete-orphan")
    weighings: Mapped[list["Weighing"]] = relationship(back_populates="batch", cascade="all, delete-orphan")
    deliveries: Mapped[list["Delivery"]] = relationship(back_populates="batch")


class RearingPlan(TimestampMixin, Base):
    __tablename__ = "rearing_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    activity: Mapped[str] = mapped_column(String(255), nullable=False)
    feed_amount: Mapped[float | None] = mapped_column(DECIMAL(8, 2))
    notes: Mapped[str | None] = mapped_column(Text)

    batch: Mapped[Batch] = relationship(back_populates="rearing_plans")


class Feeding(TimestampMixin, Base):
    __tablename__ = "feedings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    feed_type: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(DECIMAL(8, 2), nullable=False)
    fed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)

    batch: Mapped[Batch] = relationship(back_populates="feedings")


class Medication(TimestampMixin, Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dosage: Mapped[str] = mapped_column(String(50), nullable=False)
    administered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)

    batch: Mapped[Batch] = relationship(back_populates="medications")


class Weighing(TimestampMixin, Base):
    __tablename__ = "weighings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    weight_kg: Mapped[float] = mapped_column(DECIMAL(8, 2), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)

    batch: Mapped[Batch] = relationship(back_populates="weighings")


class Delivery(TimestampMixin, Base):
    __tablename__ = "deliveries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    batch_id: Mapped[int | None] = mapped_column(ForeignKey("batches.id"))
    delivered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    eggs_delivered: Mapped[int] = mapped_column(Integer, nullable=False)
    packaging: Mapped[str] = mapped_column(String(50), nullable=False)
    vegetables: Mapped[str | None] = mapped_column(String(100))
    kitchen_gift: Mapped[str | None] = mapped_column(String(100))
    delivered_by: Mapped[str | None] = mapped_column(String(100))
    hen_delivered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    contract: Mapped[Contract] = relationship(back_populates="deliveries")
    batch: Mapped[Batch | None] = relationship(back_populates="deliveries")


class Settlement(TimestampMixin, Base):
    __tablename__ = "settlements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=False)
    settlement_date: Mapped[date] = mapped_column(Date, nullable=False)
    eggs_delivered_total: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_due: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    amount_paid: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    contract: Mapped[Contract] = relationship(back_populates="settlements")
