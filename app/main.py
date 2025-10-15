"""FastAPI application entry point."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import get_settings
from .api.routes import (
    batches,
    contracts,
    customers,
    deliveries,
    feedings,
    health,
    medications,
    rearing_plans,
    settlements,
    weighings,
)

settings = get_settings()

app = FastAPI(title="客户定养管理系统 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(customers.router)
app.include_router(contracts.router)
app.include_router(batches.router)
app.include_router(rearing_plans.router)
app.include_router(feedings.router)
app.include_router(medications.router)
app.include_router(weighings.router)
app.include_router(deliveries.router)
app.include_router(settlements.router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Doppytang husbandry backend"}
