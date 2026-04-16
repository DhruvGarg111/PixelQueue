"""Celery task: AI auto-label an image via the ML service."""

from __future__ import annotations

import base64
from datetime import datetime, timezone
from uuid import uuid4

import requests
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import (
    Annotation,
    AnnotationSource,
    AnnotationStatus,
    AnnotationVersion,
    AutoLabelJob,
    Image,
    JobStatus,
    Task,
    TaskStatus,
)
from app.services.celery_app import celery_app
from app.services.events import publish_project_event
from app.services.minio_client import get_object_bytes

settings = get_settings()


def _now():
    return datetime.now(timezone.utc)


@celery_app.task(name="worker.tasks.auto_label_image")
def auto_label_image(job_id: str) -> None:
    from worker.worker_tasks import JOB_LATENCY, JOB_TOTAL

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
                model = db.execute(
                    text("SELECT provider, name, version FROM ml_models WHERE id = :id"),
                    {"id": str(job.model_id)},
                ).first()
                if model:
                    payload["provider"] = model.provider
                    payload["model_name"] = model.name
                    payload["model_version"] = model.version

            response = requests.post(
                f"{settings.ml_service_url}/infer/auto-label", json=payload, timeout=60
            )
            response.raise_for_status()
            result = response.json()
            predictions = result.get("predictions", [])

            current_revision = int(image.annotation_revision)
            new_revision = current_revision + 1

            db.query(Annotation).filter(
                Annotation.image_id == image.id,
                Annotation.source == AnnotationSource.auto,
            ).delete(synchronize_session=False)

            created = 0
            for pred in predictions:
                # ⚡ Bolt Optimization: Generate UUID upfront to avoid per-iteration db.flush() causing N+1 inserts.
                annotation_id = uuid4()
                annotation = Annotation(
                    id=annotation_id,
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
                db.add(
                    AnnotationVersion(
                        annotation_id=annotation_id,
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
                publish_project_event(
                    job.project_id,
                    "auto_label_failed",
                    {"job_id": str(job.id), "error": str(exc)},
                )
            JOB_TOTAL.labels("auto_label", "failed").inc()
            raise
        finally:
            db.close()
