"""Weighing API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Batch, Weighing
from ..deps import get_db_session

router = APIRouter(prefix="/weighings", tags=["weighings"])


def _get_weighing_or_404(db: Session, weighing_id: int) -> Weighing:
    weighing = db.get(Weighing, weighing_id)
    if not weighing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weighing record not found")
    return weighing


@router.get("/", response_model=list[schemas.WeighingRead])
def list_weighings(db: Session = Depends(get_db_session)) -> list[Weighing]:
    return db.query(Weighing).order_by(Weighing.recorded_at.desc()).all()


@router.post("/", response_model=schemas.WeighingRead, status_code=status.HTTP_201_CREATED)
def create_weighing(payload: schemas.WeighingCreate, db: Session = Depends(get_db_session)) -> Weighing:
    batch = db.get(Batch, payload.batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch not found")
    weighing = Weighing(**payload.model_dump())
    db.add(weighing)
    db.commit()
    db.refresh(weighing)
    return weighing


@router.get("/{weighing_id}", response_model=schemas.WeighingRead)
def get_weighing(weighing_id: int, db: Session = Depends(get_db_session)) -> Weighing:
    return _get_weighing_or_404(db, weighing_id)


@router.put("/{weighing_id}", response_model=schemas.WeighingRead)
def update_weighing(
    weighing_id: int, payload: schemas.WeighingUpdate, db: Session = Depends(get_db_session)
) -> Weighing:
    weighing = _get_weighing_or_404(db, weighing_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(weighing, key, value)
    db.add(weighing)
    db.commit()
    db.refresh(weighing)
    return weighing


@router.delete("/{weighing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weighing(weighing_id: int, db: Session = Depends(get_db_session)) -> None:
    weighing = _get_weighing_or_404(db, weighing_id)
    db.delete(weighing)
    db.commit()
