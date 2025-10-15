"""Feeding API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Batch, Feeding
from ..deps import get_db_session

router = APIRouter(prefix="/feedings", tags=["feedings"])


def _get_feeding_or_404(db: Session, feeding_id: int) -> Feeding:
    feeding = db.get(Feeding, feeding_id)
    if not feeding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feeding record not found")
    return feeding


@router.get("/", response_model=list[schemas.FeedingRead])
def list_feedings(db: Session = Depends(get_db_session)) -> list[Feeding]:
    return db.query(Feeding).order_by(Feeding.fed_at.desc()).all()


@router.post("/", response_model=schemas.FeedingRead, status_code=status.HTTP_201_CREATED)
def create_feeding(payload: schemas.FeedingCreate, db: Session = Depends(get_db_session)) -> Feeding:
    batch = db.get(Batch, payload.batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch not found")
    feeding = Feeding(**payload.model_dump())
    db.add(feeding)
    db.commit()
    db.refresh(feeding)
    return feeding


@router.get("/{feeding_id}", response_model=schemas.FeedingRead)
def get_feeding(feeding_id: int, db: Session = Depends(get_db_session)) -> Feeding:
    return _get_feeding_or_404(db, feeding_id)


@router.put("/{feeding_id}", response_model=schemas.FeedingRead)
def update_feeding(
    feeding_id: int, payload: schemas.FeedingUpdate, db: Session = Depends(get_db_session)
) -> Feeding:
    feeding = _get_feeding_or_404(db, feeding_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(feeding, key, value)
    db.add(feeding)
    db.commit()
    db.refresh(feeding)
    return feeding


@router.delete("/{feeding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feeding(feeding_id: int, db: Session = Depends(get_db_session)) -> None:
    feeding = _get_feeding_or_404(db, feeding_id)
    db.delete(feeding)
    db.commit()
