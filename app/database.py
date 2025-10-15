"""Database session and engine utilities with runtime fallbacks."""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .core.config import get_settings, resolve_database_url


class Base(DeclarativeBase):
    """Base class for ORM models."""


settings = get_settings()
database_url = resolve_database_url()
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(
    database_url,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


def get_db():
    """Yield a new SQLAlchemy session per request."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
