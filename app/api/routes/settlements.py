"""Settlement API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Contract, Delivery, Settlement
from ..deps import get_db_session

router = APIRouter(prefix="/settlements", tags=["settlements"])


def _get_contract_or_404(db: Session, contract_id: int) -> Contract:
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


def _get_settlement_or_404(db: Session, settlement_id: int) -> Settlement:
    settlement = db.get(Settlement, settlement_id)
    if not settlement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settlement not found")
    return settlement


@router.get("/", response_model=list[schemas.SettlementRead])
def list_settlements(db: Session = Depends(get_db_session)) -> list[Settlement]:
    return db.query(Settlement).order_by(Settlement.settlement_date.desc()).all()


@router.post("/trial", response_model=schemas.SettlementTrialResponse)
def trial_settlement(payload: schemas.SettlementTrialRequest, db: Session = Depends(get_db_session)):
    contract = _get_contract_or_404(db, payload.contract_id)
    eggs_query = db.query(func.coalesce(func.sum(Delivery.eggs_delivered), 0)).filter(
        Delivery.contract_id == contract.id
    )
    eggs_total = eggs_query.scalar()
    eggs_delivered = payload.eggs_delivered if payload.eggs_delivered is not None else eggs_total
    price = float(payload.price_override if payload.price_override is not None else contract.price)
    amount_due = float(price) * float(eggs_delivered) / max(float(contract.total_eggs), 1)
    return schemas.SettlementTrialResponse(
        contract_id=contract.id,
        eggs_delivered_total=int(eggs_delivered),
        amount_due=round(amount_due, 2),
        amount_paid=0.0,
        status="trial",
        notes=payload.notes,
    )


@router.post("/", response_model=schemas.SettlementRead, status_code=status.HTTP_201_CREATED)
def create_settlement(payload: schemas.SettlementCreate, db: Session = Depends(get_db_session)) -> Settlement:
    contract = _get_contract_or_404(db, payload.contract_id)
    settlement = Settlement(**payload.model_dump())
    settlement.is_trial = False
    db.add(settlement)
    db.commit()
    db.refresh(settlement)
    return settlement


@router.get("/{settlement_id}", response_model=schemas.SettlementRead)
def get_settlement(settlement_id: int, db: Session = Depends(get_db_session)) -> Settlement:
    return _get_settlement_or_404(db, settlement_id)


@router.put("/{settlement_id}", response_model=schemas.SettlementRead)
def update_settlement(
    settlement_id: int, payload: schemas.SettlementUpdate, db: Session = Depends(get_db_session)
) -> Settlement:
    settlement = _get_settlement_or_404(db, settlement_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(settlement, key, value)
    db.add(settlement)
    db.commit()
    db.refresh(settlement)
    return settlement


@router.delete(
    "/{settlement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def delete_settlement(settlement_id: int, db: Session = Depends(get_db_session)) -> None:
    settlement = _get_settlement_or_404(db, settlement_id)
    db.delete(settlement)
    db.commit()
