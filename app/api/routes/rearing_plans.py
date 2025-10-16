"""Rearing plan API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ... import schemas
from ...models import Batch, RearingPlan
from ..deps import get_db_session

router = APIRouter(prefix="/rearing-plans", tags=["rearing-plans"])


def _get_plan_or_404(db: Session, plan_id: int) -> RearingPlan:
    plan = db.get(RearingPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rearing plan not found")
    return plan


@router.get("/", response_model=list[schemas.RearingPlanRead])
def list_plans(db: Session = Depends(get_db_session)) -> list[RearingPlan]:
    return db.query(RearingPlan).order_by(RearingPlan.scheduled_date).all()


@router.post("/", response_model=schemas.RearingPlanRead, status_code=status.HTTP_201_CREATED)
def create_plan(payload: schemas.RearingPlanCreate, db: Session = Depends(get_db_session)) -> RearingPlan:
    batch = db.get(Batch, payload.batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch not found")
    plan = RearingPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=schemas.RearingPlanRead)
def get_plan(plan_id: int, db: Session = Depends(get_db_session)) -> RearingPlan:
    return _get_plan_or_404(db, plan_id)


@router.put("/{plan_id}", response_model=schemas.RearingPlanRead)
def update_plan(plan_id: int, payload: schemas.RearingPlanUpdate, db: Session = Depends(get_db_session)) -> RearingPlan:
    plan = _get_plan_or_404(db, plan_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def delete_plan(plan_id: int, db: Session = Depends(get_db_session)) -> None:
    plan = _get_plan_or_404(db, plan_id)
    db.delete(plan)
    db.commit()
