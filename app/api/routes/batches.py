"""Batch API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Batch, Contract
from ..deps import get_db_session

router = APIRouter(prefix="/batches", tags=["batches"])


def _get_batch_or_404(db: Session, batch_id: int) -> Batch:
    batch = db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return batch


@router.get("/", response_model=list[schemas.BatchRead])
def list_batches(db: Session = Depends(get_db_session)) -> list[Batch]:
    return db.query(Batch).order_by(Batch.id).all()


@router.post("/", response_model=schemas.BatchRead, status_code=status.HTTP_201_CREATED)
def create_batch(payload: schemas.BatchCreate, db: Session = Depends(get_db_session)) -> Batch:
    contract = db.get(Contract, payload.contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract not found")
    batch = Batch(**payload.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/{batch_id}", response_model=schemas.BatchRead)
def get_batch(batch_id: int, db: Session = Depends(get_db_session)) -> Batch:
    return _get_batch_or_404(db, batch_id)


@router.put("/{batch_id}", response_model=schemas.BatchRead)
def update_batch(batch_id: int, payload: schemas.BatchUpdate, db: Session = Depends(get_db_session)) -> Batch:
    batch = _get_batch_or_404(db, batch_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(batch, key, value)
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.delete(
    "/{batch_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def delete_batch(batch_id: int, db: Session = Depends(get_db_session)) -> None:
    batch = _get_batch_or_404(db, batch_id)
    db.delete(batch)
    db.commit()
