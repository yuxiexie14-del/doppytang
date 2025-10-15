"""Delivery API endpoints."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Batch, Contract, Delivery
from ..deps import get_db_session

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


def _get_delivery_or_404(db: Session, delivery_id: int) -> Delivery:
    delivery = db.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery


def _ensure_contract(db: Session, contract_id: int) -> Contract:
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract not found")
    return contract


@router.get("/", response_model=list[schemas.DeliveryRead])
def list_deliveries(db: Session = Depends(get_db_session)) -> list[Delivery]:
    return db.query(Delivery).order_by(Delivery.delivered_at.desc()).all()


@router.post("/", response_model=schemas.DeliveryRead, status_code=status.HTTP_201_CREATED)
def create_delivery(payload: schemas.DeliveryCreate, db: Session = Depends(get_db_session)) -> Delivery:
    contract = _ensure_contract(db, payload.contract_id)
    if payload.batch_id is not None:
        batch = db.get(Batch, payload.batch_id)
        if not batch:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch not found")
        if batch.contract_id != contract.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch not linked to contract")
    data = payload.model_dump()
    if data.get("delivered_at") is None:
        data["delivered_at"] = datetime.now(timezone.utc)
    delivery = Delivery(**data)
    if contract.remaining_eggs - delivery.eggs_delivered < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient remaining eggs")
    contract.remaining_eggs -= delivery.eggs_delivered
    if delivery.hen_delivered:
        contract.hen_delivered = True
    db.add(delivery)
    db.add(contract)
    db.commit()
    db.refresh(delivery)
    db.refresh(contract)
    return delivery


@router.get("/{delivery_id}", response_model=schemas.DeliveryRead)
def get_delivery(delivery_id: int, db: Session = Depends(get_db_session)) -> Delivery:
    return _get_delivery_or_404(db, delivery_id)


@router.put("/{delivery_id}", response_model=schemas.DeliveryRead)
def update_delivery(
    delivery_id: int, payload: schemas.DeliveryUpdate, db: Session = Depends(get_db_session)
) -> Delivery:
    delivery = _get_delivery_or_404(db, delivery_id)
    contract = _ensure_contract(db, delivery.contract_id)
    original_eggs = delivery.eggs_delivered
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(delivery, key, value)
    if "eggs_delivered" in update_data:
        delta = update_data["eggs_delivered"] - original_eggs
        if contract.remaining_eggs - delta < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient remaining eggs")
        contract.remaining_eggs -= delta
    if "hen_delivered" in update_data and delivery.hen_delivered:
        contract.hen_delivered = True
    db.add(delivery)
    db.add(contract)
    db.commit()
    db.refresh(delivery)
    return delivery


@router.delete("/{delivery_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery(delivery_id: int, db: Session = Depends(get_db_session)) -> None:
    delivery = _get_delivery_or_404(db, delivery_id)
    contract = _ensure_contract(db, delivery.contract_id)
    contract.remaining_eggs += delivery.eggs_delivered
    if delivery.hen_delivered:
        # recompute hen delivery flag
        other = (
            db.query(Delivery)
            .filter(Delivery.contract_id == contract.id, Delivery.id != delivery.id, Delivery.hen_delivered.is_(True))
            .first()
        )
        contract.hen_delivered = other is not None
    db.delete(delivery)
    db.add(contract)
    db.commit()
