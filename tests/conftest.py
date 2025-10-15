from __future__ import annotations

import os
import subprocess
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TEST_DB_PATH = PROJECT_ROOT / "test.db"
os.environ.setdefault("DATABASE_URL", f"sqlite:///{TEST_DB_PATH}")
os.environ.setdefault("SQLITE_URL", f"sqlite:///{TEST_DB_PATH}")

from app.main import app  # noqa: E402
from app.database import Base, SessionLocal  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def apply_migrations() -> Iterator[None]:
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    subprocess.run(["alembic", "upgrade", "head"], check=True)
    yield


@pytest.fixture(autouse=True)
def clean_database() -> Iterator[None]:
    session = SessionLocal()
    try:
        foreign_keys_disabled = False
        try:
            session.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            foreign_keys_disabled = True
        except Exception:
            session.rollback()
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
        if foreign_keys_disabled:
            session.execute(text("SET FOREIGN_KEY_CHECKS=1"))
            session.commit()
        yield
    finally:
        session.close()


@pytest.fixture()
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
