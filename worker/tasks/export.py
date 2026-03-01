"""Celery task: Export a project's approved annotations as COCO or YOLO dataset."""

from __future__ import annotations

import json
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import yaml
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import ExportJob, JobStatus
from app.services.celery_app import celery_app
from app.services.events import publish_project_event
from app.services.minio_client import get_object_bytes, put_bytes
from worker.converters.geometry import geometry_to_coco, geometry_to_yolo_row

settings = get_settings()


def _now():
    return datetime.now(timezone.utc)


def _fetch_image_and_annotation_rows(db, project_id: str):
    """Query images and approved annotations for a given project."""
    image_rows = (
        db.execute(
            text("""
                SELECT i.id AS image_id, i.object_key, i.width, i.height
                FROM images i
                WHERE i.project_id = :project_id
                ORDER BY i.created_at ASC
            """),
            {"project_id": project_id},
        )
        .mappings()
        .all()
    )
    ann_rows = (
        db.execute(
            text("""
                SELECT a.id, a.image_id, a.label, a.geometry_jsonb
                FROM annotations a
                WHERE a.project_id = :project_id AND a.status = 'approved'
                ORDER BY a.created_at ASC
            """),
            {"project_id": project_id},
        )
        .mappings()
        .all()
    )
    return image_rows, ann_rows


def _build_coco_json(image_rows, ann_rows, image_by_id, category_map):
    """Assemble a COCO-format dict from image and annotation rows."""
    coco = {"images": [], "annotations": [], "categories": []}
    for label, cid in category_map.items():
        coco["categories"].append({"id": cid, "name": label, "supercategory": "object"})

    image_id_map = {str(img["image_id"]): idx + 1 for idx, img in enumerate(image_rows)}

    for img in image_rows:
        int_img_id = image_id_map[str(img["image_id"])]
        suffix = Path(img["object_key"]).suffix or ".jpg"
        coco["images"].append({
            "id": int_img_id,
            "file_name": f"{img['image_id']}{suffix}",
            "width": img["width"],
            "height": img["height"],
        })

    ann_id = 1
    for row in ann_rows:
        img = image_by_id[str(row["image_id"])]
        bbox, seg, area = geometry_to_coco(row["geometry_jsonb"], int(img["width"]), int(img["height"]))
        int_img_id = image_id_map[str(row["image_id"])]
        coco["annotations"].append({
            "id": ann_id,
            "image_id": int_img_id,
            "category_id": category_map[row["label"]],
            "bbox": bbox,
            "area": area,
            "segmentation": [seg] if seg else [],
            "iscrowd": 0,
        })
        ann_id += 1
    return coco


def _build_yolo_labels(ann_rows, category_map, labels_dir: Path):
    """Write YOLO label files for each image."""
    for row in ann_rows:
        class_id = category_map[row["label"]]
        line = geometry_to_yolo_row(class_id, row["geometry_jsonb"])
        label_file = labels_dir / f"{row['image_id']}.txt"
        with label_file.open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")


@celery_app.task(name="worker.tasks.export_dataset")
def export_dataset(export_id: str) -> None:
    from worker.worker_tasks import JOB_LATENCY, JOB_TOTAL

    with JOB_LATENCY.labels("export").time():
        db = SessionLocal()
        try:
            export_job = db.get(ExportJob, export_id)
            if not export_job:
                JOB_TOTAL.labels("export", "missing_job").inc()
                return
            export_job.status = JobStatus.running
            db.commit()

            image_rows, ann_rows = _fetch_image_and_annotation_rows(db, str(export_job.project_id))
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
                    (images_dir / f"{img['image_id']}{suffix}").write_bytes(payload)

                if export_job.format.value == "coco":
                    coco = _build_coco_json(image_rows, ann_rows, image_by_id, category_map)
                    (root / "annotations.json").write_text(json.dumps(coco, indent=2), encoding="utf-8")
                else:
                    _build_yolo_labels(ann_rows, category_map, labels_dir)
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
                        if file_path == zip_path or not file_path.is_file():
                            continue
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
                publish_project_event(
                    job.project_id, "export_failed", {"export_id": str(job.id), "error": str(exc)}
                )
            JOB_TOTAL.labels("export", "failed").inc()
            raise
        finally:
            db.close()
