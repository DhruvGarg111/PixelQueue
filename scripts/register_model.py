from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "api"
if str(API_ROOT) not in sys.path:
    sys.path.append(str(API_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.models import MLModel  # noqa: E402
from app.services.minio_client import put_bytes  # noqa: E402


def _sanitize_model_name(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-") or "model"


def main() -> None:
    report_path = ROOT / "tmp" / "training" / "train_report.json"
    eval_path = ROOT / "tmp" / "evaluation.json"
    if not report_path.exists():
        raise FileNotFoundError(f"Training report missing at {report_path}. Run train_yolo.py first.")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    metrics = json.loads(eval_path.read_text(encoding="utf-8")) if eval_path.exists() else {}

    name = str(report.get("model_name", "yolo-seg"))
    version = os.getenv("MODEL_VERSION")
    if not version:
        version = datetime.now(timezone.utc).strftime("%Y.%m.%d.%H%M%S")

    provider = "yolo_seg" if report.get("provider") == "ultralytics" else "cv_fallback"
    artifact_path = Path(str(report.get("artifact", "")))
    if not artifact_path.exists():
        raise FileNotFoundError(f"Model artifact missing at {artifact_path}")

    object_key = f"models/{_sanitize_model_name(name)}/{version}/model.pt"
    put_bytes(object_key, artifact_path.read_bytes(), content_type="application/octet-stream")

    db = SessionLocal()
    try:
        db.query(MLModel).update({MLModel.is_active: False})
        model = MLModel(
            name=name,
            version=version,
            provider=provider,
            object_key=object_key,
            is_active=True,
            metrics_jsonb={"train": report, "eval": metrics},
        )
        db.add(model)
        db.commit()
        print(f"Registered model {name}:{version} provider={provider} object_key={object_key}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
