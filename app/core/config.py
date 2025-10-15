"""Application configuration management with environment fallbacks."""
from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from typing import List

from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

LOGGER = logging.getLogger(__name__)


def _load_optional_dotenv() -> None:
    """Load environment variables from a .env file when available."""

    env_path = os.getenv("ENV_FILE", ".env")
    if not os.path.exists(env_path):
        return
    try:
        from dotenv import load_dotenv  # type: ignore import-not-found
    except Exception:  # pragma: no cover - optional dependency
        LOGGER.debug("python-dotenv not installed; skipping %%s", env_path)
        return
    load_dotenv(env_path, override=False)


def _parse_origins(value: str) -> List[str]:
    """Parse a CORS origin string into a list."""

    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
        return [str(parsed)]
    except json.JSONDecodeError:
        return [origin.strip() for origin in value.split(",") if origin.strip()]


class Settings(BaseModel):
    """Runtime configuration populated from environment variables."""

    database_url: str = Field(
        default="mysql+pymysql://app:app@localhost:3306/doppytang",
        description="Primary SQLAlchemy database URL",
    )
    sqlite_url: str = Field(
        default="sqlite:///./dev.db",
        description="Fallback SQLite database URL for cloud environments",
    )
    cors_origins: List[str] = Field(default_factory=lambda: ["*"])
    jwt_secret: str = Field(default="change-me")
    resolved_database_url: str | None = None
    using_sqlite: bool = False

    class Config:
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Load settings from process environment once per interpreter."""

    _load_optional_dotenv()
    data: dict[str, object] = {}
    if env := os.getenv("DATABASE_URL"):
        data["database_url"] = env
    if env := os.getenv("SQLITE_URL"):
        data["sqlite_url"] = env
    if env := os.getenv("CORS_ORIGINS"):
        data["cors_origins"] = _parse_origins(env)
    if env := os.getenv("JWT_SECRET"):
        data["jwt_secret"] = env
    return Settings(**data)


@lru_cache
def resolve_database_url() -> str:
    """Determine the active database URL with MySQL → SQLite fallback."""

    settings = get_settings()
    candidates: list[str] = []
    if settings.database_url:
        candidates.append(settings.database_url)
    fallback = settings.sqlite_url or "sqlite:///./dev.db"
    if fallback and fallback not in candidates:
        candidates.append(fallback)

    last_error: Exception | None = None
    for index, url in enumerate(candidates):
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        try:
            engine = create_engine(url, future=True, pool_pre_ping=True, connect_args=connect_args)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            engine.dispose()
            object.__setattr__(settings, "resolved_database_url", url)
            object.__setattr__(settings, "using_sqlite", url.startswith("sqlite"))
            if index > 0:
                LOGGER.warning("Primary database unavailable; falling back to %s", url)
            return url
        except SQLAlchemyError as exc:  # pragma: no cover - network dependant
            last_error = exc
            LOGGER.warning("Failed to connect to %s: %s", url, exc)
        except Exception as exc:  # pragma: no cover - safety net
            last_error = exc
            LOGGER.warning("Unexpected error when connecting to %s: %s", url, exc)

    if last_error is not None:
        LOGGER.error("All configured database URLs failed; using fallback %s", fallback)
    object.__setattr__(settings, "resolved_database_url", fallback)
    object.__setattr__(settings, "using_sqlite", fallback.startswith("sqlite"))
    return fallback
