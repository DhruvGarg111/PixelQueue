from __future__ import annotations

import base64
import io
import json
import os
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
import yaml
from prometheus_client import Counter, Histogram, start_http_server
from celery.signals import worker_ready
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import (
    Annotation,
    AnnotationSource,
    AnnotationStatus,
    AnnotationVersion,
    AutoLabelJob,
    ExportJob,
    Image,
    JobStatus,
    Task,
    TaskStatus,
)
from app.services.celery_app import celery_app
from app.services.events import publish_project_event
from app.services.minio_client import get_object_bytes, put_bytes


settings = get_settings()

@worker_ready.connect
def start_metrics_server(**kwargs):
    start_http_server(int(os.getenv("WORKER_METRICS_PORT", "9101")))
JOB_TOTAL = Counter("annotation_worker_jobs_total", "Worker jobs by type and status", ["job_type", "status"])
JOB_LATENCY = Histogram(
    "annotation_worker_job_duration_seconds",
    "Worker job duration",
    ["job_type"],
    buckets=(0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60),
)


def _now():
    return datetime.now(timezone.utc)


def _point_to_xy(point: Any) -> tuple[float, float]:
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])
    if isinstance(point, (list, tuple)) and len(point) == 2:
        return float(point[0]), float(point[1])
    raise ValueError("invalid polygon point payload")


def _polygon_area(points: list[tuple[float, float]]) -> float:
    if len(points) < 3:
        return 0.0
    area = 0.0
    for idx, (x1, y1) in enumerate(points):
        x2, y2 = points[(idx + 1) % len(points)]
        area += (x1 * y2) - (x2 * y1)
    return abs(area) * 0.5


def _geometry_to_coco(geometry: dict[str, Any], width: int, height: int) -> tuple[list[float], list[float], float]:
    if geometry.get("type") == "bbox":
        x = float(geometry["x"]) * width
        y = float(geometry["y"]) * height
        w = float(geometry["w"]) * width
        h = float(geometry["h"]) * height
        return [x, y, w, h], [], w * h

    points = geometry.get("points", [])
    abs_points = [(x * width, y * height) for x, y in (_point_to_xy(p) for p in points)]
    if len(abs_points) < 3:
        return [0.0, 0.0, 0.0, 0.0], [], 0.0
    xs = [p[0] for p in abs_points]
    ys = [p[1] for p in abs_points]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
    segmentation = [coord for xy in abs_points for coord in xy]
    area = _polygon_area(abs_points)
    return bbox, segmentation, area


def _geometry_to_yolo_row(class_id: int, geometry: dict[str, Any]) -> str:
    if geometry.get("type") == "bbox":
        x = float(geometry["x"])
        y = float(geometry["y"])
        w = float(geometry["w"])
        h = float(geometry["h"])
        x_center = x + w / 2.0
        y_center = y + h / 2.0
        return f"{class_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}"

    pts = geometry.get("points", [])
    if len(pts) < 3:
        return f"{class_id} 0.500000 0.500000 1.000000 1.000000"
    flattened = " ".join([f"{x:.6f} {y:.6f}" for x, y in (_point_to_xy(p) for p in pts)])
    return f"{class_id} {flattened}".strip()


@celery_app.task(name="worker.tasks.auto_label_image")
def auto_label_image(job_id: str) -> None:
    with JOB_LATENCY.labels("auto_label").time():
        db = SessionLocal()
        try:
            job = db.get(AutoLabelJob, job_id)
            if not job:
                JOB_TOTAL.labels("auto_label", "missing_job").inc()
                return
            job.status = JobStatus.running
            job.started_at = _now()
            db.commit()

            image = db.get(Image, job.image_id)
            if not image:
                raise RuntimeError("image_not_found")

            payload = {
                "image_base64": base64.b64encode(get_object_bytes(image.object_key)).decode("utf-8"),
                "provider": settings.default_auto_label_provider,
            }
            if job.model_id:
                model = db.execute(text("SELECT provider, name, version FROM ml_models WHERE id = :id"), {"id": str(job.model_id)}).first()
                if model:
                    payload["provider"] = model.provider
                    payload["model_name"] = model.name
                    payload["model_version"] = model.version

            response = requests.post(f"{settings.ml_service_url}/infer/auto-label", json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            predictions = result.get("predictions", [])

            current_revision = int(image.annotation_revision)
            new_revision = current_revision + 1

            db.query(Annotation).filter(Annotation.image_id == image.id, Annotation.source == AnnotationSource.auto).delete(synchronize_session=False)
            created = 0
            for pred in predictions:
                annotation = Annotation(
                    project_id=image.project_id,
                    image_id=image.id,
                    label=pred.get("label", "object"),
                    geometry_jsonb=pred["geometry"],
                    source=AnnotationSource.auto,
                    status=AnnotationStatus.draft,
                    confidence=float(pred.get("confidence", 0.0)),
                    created_by=image.uploaded_by,
                    updated_by=image.uploaded_by,
                    revision=new_revision,
                )
                db.add(annotation)
                db.flush()
                db.add(
                    AnnotationVersion(
                        annotation_id=annotation.id,
                        revision=new_revision,
                        geometry_jsonb=annotation.geometry_jsonb,
                        label=annotation.label,
                        source=annotation.source,
                        status=annotation.status,
                        changed_by=image.uploaded_by,
                    )
                )
                created += 1

            image.annotation_revision = new_revision
            task = db.query(Task).filter(Task.image_id == image.id).one_or_none()
            if task:
                task.status = TaskStatus.in_review
            job.status = JobStatus.completed
            job.result_jsonb = {"count": created, "provider": result.get("provider")}
            job.finished_at = _now()
            db.commit()

            JOB_TOTAL.labels("auto_label", "completed").inc()
            publish_project_event(
                image.project_id,
                "auto_label_completed",
                {"job_id": str(job.id), "image_id": str(image.id), "count": created},
            )
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            job = db.get(AutoLabelJob, job_id)
            if job:
                job.status = JobStatus.failed
                job.error_text = str(exc)
                job.finished_at = _now()
                db.commit()
                publish_project_event(job.project_id, "auto_label_failed", {"job_id": str(job.id), "error": str(exc)})
            JOB_TOTAL.labels("auto_label", "failed").inc()
            raise
        finally:
            db.close()


@celery_app.task(name="worker.tasks.export_dataset")
def export_dataset(export_id: str) -> None:
    with JOB_LATENCY.labels("export").time():
        db = SessionLocal()
        try:
            export_job = db.get(ExportJob, export_id)
            if not export_job:
                JOB_TOTAL.labels("export", "missing_job").inc()
                return
            export_job.status = JobStatus.running
            db.commit()

            image_rows = (
                db.execute(
                    text(
                        """
                        SELECT i.id AS image_id, i.object_key, i.width, i.height
                        FROM images i
                        WHERE i.project_id = :project_id
                        ORDER BY i.created_at ASC
                        """
                    ),
                    {"project_id": str(export_job.project_id)},
                )
                .mappings()
                .all()
            )
            ann_rows = (
                db.execute(
                    text(
                        """
                        SELECT a.id, a.image_id, a.label, a.geometry_jsonb
                        FROM annotations a
                        WHERE a.project_id = :project_id AND a.status = 'approved'
                        ORDER BY a.created_at ASC
                        """
                    ),
                    {"project_id": str(export_job.project_id)},
                )
                .mappings()
                .all()
            )

            image_by_id = {str(r["image_id"]): r for r in image_rows}
            labels = sorted({r["label"] for r in ann_rows})
            category_map = {label: idx for idx, label in enumerate(labels)}
            approved_image_ids = {str(r["image_id"]) for r in ann_rows}
            image_rows = [row for row in image_rows if str(row["image_id"]) in approved_image_ids]

            with tempfile.TemporaryDirectory(prefix="annotation-export-") as tmp:
                root = Path(tmp)
                images_dir = root / "images"
                labels_dir = root / "labels"
                images_dir.mkdir(parents=True, exist_ok=True)
                labels_dir.mkdir(parents=True, exist_ok=True)

                for img in image_rows:
                    payload = get_object_bytes(img["object_key"])
                    suffix = Path(img["object_key"]).suffix or ".jpg"
                    target_path = images_dir / f"{img['image_id']}{suffix}"
                    target_path.write_bytes(payload)

                if export_job.format.value == "coco":
                    coco = {"images": [], "annotations": [], "categories": []}
                    for label, cid in category_map.items():
                        coco["categories"].append({"id": cid, "name": label, "supercategory": "object"})
                    
                    # COCO requires integer IDs for images and annotations
                    image_id_map = {str(img["image_id"]): idx + 1 for idx, img in enumerate(image_rows)}
                    
                    ann_id = 1
                    for img in image_rows:
                        int_img_id = image_id_map[str(img["image_id"])]
                        coco["images"].append(
                            {"id": int_img_id, "file_name": f"{img['image_id']}{Path(img['object_key']).suffix or '.jpg'}", "width": img["width"], "height": img["height"]}
                        )
                    for row in ann_rows:
                        img = image_by_id[str(row["image_id"])]
                        bbox, seg, area = _geometry_to_coco(row["geometry_jsonb"], int(img["width"]), int(img["height"]))
                        int_img_id = image_id_map[str(row["image_id"])]
                        coco["annotations"].append(
                            {
                                "id": ann_id,
                                "image_id": int_img_id,
                                "category_id": category_map[row["label"]],
                                "bbox": bbox,
                                "area": area,
                                "segmentation": [seg] if seg else [],
                                "iscrowd": 0,
                            }
                        )
                        ann_id += 1
                    (root / "annotations.json").write_text(json.dumps(coco, indent=2), encoding="utf-8")
                else:
                    for row in ann_rows:
                        class_id = category_map[row["label"]]
                        line = _geometry_to_yolo_row(class_id, row["geometry_jsonb"])
                        label_file = labels_dir / f"{row['image_id']}.txt"
                        with label_file.open("a", encoding="utf-8") as fh:
                            fh.write(line + "\n")

                    data_yaml = {
                        "path": ".",
                        "train": "images",
                        "val": "images",
                        "names": {idx: label for label, idx in category_map.items()},
                    }
                    (root / "dataset.yaml").write_text(yaml.safe_dump(data_yaml, sort_keys=True), encoding="utf-8")

                zip_path = root / "dataset.zip"
                with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                    for file_path in root.rglob("*"):
                        if file_path == zip_path:
                            continue
                        if file_path.is_file():
                            zf.write(file_path, arcname=file_path.relative_to(root).as_posix())

                object_key = f"projects/{export_job.project_id}/exports/{export_job.id}.zip"
                put_bytes(object_key, zip_path.read_bytes(), content_type="application/zip")

            export_job.status = JobStatus.completed
            export_job.object_key = object_key
            export_job.summary_jsonb = {
                "images": len(image_rows),
                "approved_annotations": len(ann_rows),
                "labels": labels,
            }
            export_job.finished_at = _now()
            db.commit()
            JOB_TOTAL.labels("export", "completed").inc()
            publish_project_event(
                export_job.project_id,
                "export_completed",
                {"export_id": str(export_job.id), "object_key": object_key},
            )
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            job = db.get(ExportJob, export_id)
            if job:
                job.status = JobStatus.failed
                job.error_text = str(exc)
                job.finished_at = _now()
                db.commit()
                publish_project_event(job.project_id, "export_failed", {"export_id": str(job.id), "error": str(exc)})
            JOB_TOTAL.labels("export", "failed").inc()
            raise
        finally:
            db.close()


celery = celery_app
