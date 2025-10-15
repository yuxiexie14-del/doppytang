"""Contract API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Contract, Customer
from ..deps import get_db_session

router = APIRouter(prefix="/contracts", tags=["contracts"])


def _get_contract_or_404(db: Session, contract_id: int) -> Contract:
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


@router.get("/", response_model=list[schemas.ContractRead])
def list_contracts(db: Session = Depends(get_db_session)) -> list[Contract]:
    return db.query(Contract).order_by(Contract.id).all()


@router.post("/", response_model=schemas.ContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(payload: schemas.ContractCreate, db: Session = Depends(get_db_session)) -> Contract:
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found")
    existing = db.query(Contract).filter(Contract.contract_code == payload.contract_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract code already exists")
    data = payload.model_dump()
    if data.get("remaining_eggs") is None:
        data["remaining_eggs"] = data["total_eggs"]
    contract = Contract(**data)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/{contract_id}", response_model=schemas.ContractRead)
def get_contract(contract_id: int, db: Session = Depends(get_db_session)) -> Contract:
    return _get_contract_or_404(db, contract_id)


@router.put("/{contract_id}", response_model=schemas.ContractRead)
def update_contract(
    contract_id: int, payload: schemas.ContractUpdate, db: Session = Depends(get_db_session)
) -> Contract:
    contract = _get_contract_or_404(db, contract_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(contract, key, value)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(contract_id: int, db: Session = Depends(get_db_session)) -> None:
    contract = _get_contract_or_404(db, contract_id)
    db.delete(contract)
    db.commit()
