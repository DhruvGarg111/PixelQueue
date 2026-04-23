from __future__ import annotations

import base64
import io
import time
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from starlette.responses import Response

from app.providers import run_cv_fallback, run_yolo_segmentation


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "Collaborative Annotation ML Service"
    default_provider: str = "yolo_seg"
    max_image_bytes: int = 15 * 1024 * 1024


settings = Settings()

REQ_COUNTER = Counter("annotation_ml_requests_total", "ML service requests", ["endpoint", "status", "provider"])
REQ_LATENCY = Histogram(
    "annotation_ml_request_duration_seconds",
    "ML service request duration",
    ["endpoint", "provider"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2, 5),
)

app = FastAPI(title=settings.app_name, version="1.2.0")


class InferRequest(BaseModel):
    image_base64: str
    provider: str = "yolo_seg"
    model_name: str = "yolov8n-seg.pt"
    model_version: str | None = None
    max_predictions: int = Field(default=12, ge=1, le=64)


class Prediction(BaseModel):
    label: str
    confidence: float
    geometry: dict[str, Any]


class InferResponse(BaseModel):
    provider: str
    predictions: list[Prediction]


def decode_image(encoded: str) -> np.ndarray:
    data = encoded
    if "," in encoded and encoded.split(",", 1)[0].startswith("data:"):
        data = encoded.split(",", 1)[1]
    try:
        raw = base64.b64decode(data, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="invalid image base64") from exc
    if len(raw) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="image payload too large")
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="invalid image bytes") from exc
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


@app.get("/healthz")
def healthz():
    return {"ok": True, "default_provider": settings.default_provider}


@app.get("/readyz")
def readyz():
    return {"ok": True}


@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/infer/auto-label", response_model=InferResponse)
def infer_auto_label(payload: InferRequest) -> InferResponse:
    endpoint = "infer_auto_label"
    provider = payload.provider or settings.default_provider
    started = time.perf_counter()
    try:
        image = decode_image(payload.image_base64)
        predictions: list[dict[str, Any]]
        used_provider = provider
        if provider == "yolo_seg":
            try:
                predictions = run_yolo_segmentation(image, payload.model_name, payload.max_predictions)
                if not predictions:
                    raise RuntimeError("empty yolo predictions")
            except Exception:
                used_provider = "cv_fallback"
                predictions = run_cv_fallback(image, payload.max_predictions)
        elif provider == "cv_fallback":
            used_provider = "cv_fallback"
            predictions = run_cv_fallback(image, payload.max_predictions)
        else:
            raise HTTPException(status_code=400, detail="unknown provider")

        REQ_COUNTER.labels(endpoint=endpoint, status="success", provider=used_provider).inc()
        return InferResponse(provider=used_provider, predictions=[Prediction(**p) for p in predictions])
    except HTTPException:
        REQ_COUNTER.labels(endpoint=endpoint, status="http_error", provider=provider).inc()
        raise
    except Exception as exc:  # noqa: BLE001
        REQ_COUNTER.labels(endpoint=endpoint, status="error", provider=provider).inc()
        raise HTTPException(status_code=500, detail=f"inference error: {exc}") from exc
    finally:
        REQ_LATENCY.labels(endpoint=endpoint, provider=provider).observe(time.perf_counter() - started)
