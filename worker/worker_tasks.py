"""
Celery worker entry point.

Imports task modules so they register with the Celery app,
and exposes the metrics and Celery instance for the worker process.
"""

from __future__ import annotations

import os

from prometheus_client import Counter, Histogram, start_http_server
from celery.signals import worker_ready

from app.services.celery_app import celery_app

# --- Prometheus Metrics (shared across task modules) ---

JOB_TOTAL = Counter(
    "annotation_worker_jobs_total",
    "Worker jobs by type and status",
    ["job_type", "status"],
)
JOB_LATENCY = Histogram(
    "annotation_worker_job_duration_seconds",
    "Worker job duration",
    ["job_type"],
    buckets=(0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60),
)


@worker_ready.connect
def start_metrics_server(**kwargs):
    start_http_server(int(os.getenv("WORKER_METRICS_PORT", "9101")))


# --- Register task modules ---
# Importing these modules causes the @celery_app.task decorators to run,
# which registers the tasks with Celery's task registry.

from worker.tasks.auto_label import auto_label_image  # noqa: F401, E402
from worker.tasks.export import export_dataset  # noqa: F401, E402

celery = celery_app
