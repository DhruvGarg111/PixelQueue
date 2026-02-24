from fastapi import APIRouter
from sqlalchemy import text

from app.core.metrics import metrics_response
from app.db.session import SessionLocal
from app.services.minio_client import ensure_bucket


router = APIRouter(tags=["health"])


@router.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@router.get("/readyz")
def readyz() -> dict:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        ensure_bucket()
    finally:
        db.close()
    return {"ok": True}


@router.get("/metrics")
def metrics():
    return metrics_response()

