# ADR 002: Celery and Redis Task Queue

*   **Status**: Approved
*   **Decided by**: Tech Lead
*   **Date**: 2026-07-02

---

## Context and Problem Statement

PixelQueue needs to run heavy, time-consuming operations in the background:
1.  **AI Auto-labeling**: Calls the ML inference service, decodes large base64 image streams, and inserts dozens of coordinate records.
2.  **Dataset Exports**: Queries hundreds of database rows, converts geometries into YOLO/COCO formats, packages image files, compresses them into a ZIP archive, and uploads them to S3.

Running these operations synchronously on the main thread would block the backend API and cause HTTP timeouts.

---

## Decision Driver

1.  **Non-Blocking API**: API requests must return `202 Accepted` immediately, keeping the web client responsive.
2.  **Task Durability**: Failed tasks must support retries, failover states, and logging without losing state.
3.  **Horizontal Scalability**: The system must support scaling workers independently to handle increased load during bulk uploads.

---

## Considered Options

1.  **Celery + Redis**: Python's standard task queue framework paired with Redis as a fast message broker.
2.  **FastAPI BackgroundTasks**: FastAPI's built-in threadpool-based background task runner.

---

## Decision Outcome

We chose **Celery + Redis**.

### Consequences

*   **Positive (Pros)**:
    *   **Worker Decoupling**: Tasks run in completely separate OS processes (or containers), meaning high CPU usage during ML inference or zipping does not impact API request processing.
    *   **Scaling**: You can scale workers horizontally with a single command (e.g. `docker compose up --scale worker=3`) to distribute processing loads.
    *   **Advanced Queues**: Native support for task retries, task priorities, scheduling, and Flower dashboard monitoring.
*   **Negative (Cons)**:
    *   **Infrastructure Overhead**: Requires running and maintaining a Redis container and a Celery worker daemon process.
    *   **Complexity**: Passing database session states between the API and the worker requires serialization. We must pass UUID keys as strings rather than passing live Python objects.
