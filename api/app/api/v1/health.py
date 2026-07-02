from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text

from app.api.deps import get_current_user
from app.core.metrics import metrics_response
from app.db.session import SessionLocal
from app.models import User, GlobalRole
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
def metrics(current_user: User = Depends(get_current_user)):
    if current_user.global_role != GlobalRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for metrics",
        )
    return metrics_response()

