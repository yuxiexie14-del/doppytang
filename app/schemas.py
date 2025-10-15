"""Pydantic schemas for API requests and responses."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Customer


class CustomerBase(ORMModel):
    customer_code: str = Field(..., min_length=1, max_length=32)
    name: str = Field(..., min_length=1)
    phones: List[str] = Field(default_factory=list)
    recipient_name: str
    address: str
    area_code: Optional[str] = Field(default=None, max_length=10)
    first_purchase_date: Optional[date] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(ORMModel):
    name: Optional[str] = None
    phones: Optional[List[str]] = None
    recipient_name: Optional[str] = None
    address: Optional[str] = None
    area_code: Optional[str] = Field(default=None, max_length=10)
    first_purchase_date: Optional[date] = None
    notes: Optional[str] = None


class CustomerRead(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Contract


class ContractBase(ORMModel):
    contract_code: str = Field(..., min_length=1)
    customer_id: int
    package_name: str
    hen_type: str
    egg_type: str
    total_eggs: int
    remaining_eggs: Optional[int] = None
    price: float
    start_date: date
    status: str = "active"
    hen_delivered: bool = False
    description: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ORMModel):
    package_name: Optional[str] = None
    hen_type: Optional[str] = None
    egg_type: Optional[str] = None
    total_eggs: Optional[int] = None
    remaining_eggs: Optional[int] = None
    price: Optional[float] = None
    start_date: Optional[date] = None
    status: Optional[str] = None
    hen_delivered: Optional[bool] = None
    description: Optional[str] = None


class ContractRead(ContractBase):
    id: int
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerRead] = None


# ---------------------------------------------------------------------------
# Batch


class BatchBase(ORMModel):
    contract_id: int
    name: str
    start_date: date
    end_date: Optional[date] = None
    status: str = "planned"
    notes: Optional[str] = None


class BatchCreate(BatchBase):
    pass


class BatchUpdate(ORMModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BatchRead(BatchBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Rearing plan


class RearingPlanBase(ORMModel):
    batch_id: int
    scheduled_date: date
    activity: str
    feed_amount: Optional[float] = None
    notes: Optional[str] = None


class RearingPlanCreate(RearingPlanBase):
    pass


class RearingPlanUpdate(ORMModel):
    scheduled_date: Optional[date] = None
    activity: Optional[str] = None
    feed_amount: Optional[float] = None
    notes: Optional[str] = None


class RearingPlanRead(RearingPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Feeding


class FeedingBase(ORMModel):
    batch_id: int
    feed_type: str
    quantity_kg: float
    fed_at: Optional[datetime] = None
    notes: Optional[str] = None


class FeedingCreate(FeedingBase):
    pass


class FeedingUpdate(ORMModel):
    feed_type: Optional[str] = None
    quantity_kg: Optional[float] = None
    fed_at: Optional[datetime] = None
    notes: Optional[str] = None


class FeedingRead(FeedingBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Medication


class MedicationBase(ORMModel):
    batch_id: int
    medication_name: str
    dosage: str
    administered_at: Optional[datetime] = None
    notes: Optional[str] = None


class MedicationCreate(MedicationBase):
    pass


class MedicationUpdate(ORMModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    administered_at: Optional[datetime] = None
    notes: Optional[str] = None


class MedicationRead(MedicationBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Weighing


class WeighingBase(ORMModel):
    batch_id: int
    weight_kg: float
    recorded_at: Optional[datetime] = None
    notes: Optional[str] = None


class WeighingCreate(WeighingBase):
    pass


class WeighingUpdate(ORMModel):
    weight_kg: Optional[float] = None
    recorded_at: Optional[datetime] = None
    notes: Optional[str] = None


class WeighingRead(WeighingBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Delivery


class DeliveryBase(ORMModel):
    contract_id: int
    batch_id: Optional[int] = None
    delivered_at: Optional[datetime] = None
    eggs_delivered: int
    packaging: str
    vegetables: Optional[str] = None
    kitchen_gift: Optional[str] = None
    delivered_by: Optional[str] = None
    hen_delivered: bool = False
    notes: Optional[str] = None


class DeliveryCreate(DeliveryBase):
    pass


class DeliveryUpdate(ORMModel):
    delivered_at: Optional[datetime] = None
    eggs_delivered: Optional[int] = None
    packaging: Optional[str] = None
    vegetables: Optional[str] = None
    kitchen_gift: Optional[str] = None
    delivered_by: Optional[str] = None
    hen_delivered: Optional[bool] = None
    notes: Optional[str] = None


class DeliveryRead(DeliveryBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Settlement


class SettlementBase(ORMModel):
    contract_id: int
    settlement_date: date
    eggs_delivered_total: int
    amount_due: float
    amount_paid: float
    status: str = "pending"
    is_trial: bool = False
    notes: Optional[str] = None


class SettlementCreate(SettlementBase):
    pass


class SettlementUpdate(ORMModel):
    settlement_date: Optional[date] = None
    eggs_delivered_total: Optional[int] = None
    amount_due: Optional[float] = None
    amount_paid: Optional[float] = None
    status: Optional[str] = None
    is_trial: Optional[bool] = None
    notes: Optional[str] = None


class SettlementRead(SettlementBase):
    id: int
    created_at: datetime
    updated_at: datetime


class SettlementTrialRequest(ORMModel):
    contract_id: int
    eggs_delivered: Optional[int] = None
    price_override: Optional[float] = None
    notes: Optional[str] = None


class SettlementTrialResponse(ORMModel):
    contract_id: int
    eggs_delivered_total: int
    amount_due: float
    amount_paid: float
    status: str
    notes: Optional[str] = None
