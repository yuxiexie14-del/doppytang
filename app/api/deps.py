"""Shared FastAPI dependencies."""
from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from ..database import get_db


DBSession = Session


def get_db_session(db: Session = Depends(get_db)) -> Session:
    return db
