"""Medication API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Batch, Medication
from ..deps import get_db_session

router = APIRouter(prefix="/medications", tags=["medications"])


def _get_medication_or_404(db: Session, medication_id: int) -> Medication:
    medication = db.get(Medication, medication_id)
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication record not found")
    return medication


@router.get("/", response_model=list[schemas.MedicationRead])
def list_medications(db: Session = Depends(get_db_session)) -> list[Medication]:
    return db.query(Medication).order_by(Medication.administered_at.desc()).all()


@router.post("/", response_model=schemas.MedicationRead, status_code=status.HTTP_201_CREATED)
def create_medication(payload: schemas.MedicationCreate, db: Session = Depends(get_db_session)) -> Medication:
    batch = db.get(Batch, payload.batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch not found")
    medication = Medication(**payload.model_dump())
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return medication


@router.get("/{medication_id}", response_model=schemas.MedicationRead)
def get_medication(medication_id: int, db: Session = Depends(get_db_session)) -> Medication:
    return _get_medication_or_404(db, medication_id)


@router.put("/{medication_id}", response_model=schemas.MedicationRead)
def update_medication(
    medication_id: int, payload: schemas.MedicationUpdate, db: Session = Depends(get_db_session)
) -> Medication:
    medication = _get_medication_or_404(db, medication_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(medication, key, value)
    db.add(medication)
    db.commit()
    db.refresh(medication)
    return medication


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(medication_id: int, db: Session = Depends(get_db_session)) -> None:
    medication = _get_medication_or_404(db, medication_id)
    db.delete(medication)
    db.commit()
