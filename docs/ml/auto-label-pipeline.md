# Asynchronous Auto-Label Pipeline

This guide outlines the step-by-step asynchronous execution flow for the AI-assisted auto-labeling pipeline inside PixelQueue.

---

## 🔄 Detailed Execution Flow

The sequence of operations spanning the Client, Backend API, Redis Broker, Celery Worker, ML Service, and MinIO S3 bucket is illustrated below:

```mermaid
sequenceDiagram
    autonumber
    actor Annotator as Client Browser
    participant API as Backend API
    participant Redis as Redis Bus
    participant Worker as Celery Worker
    participant ML as ML Service (FastAPI)
    participant MinIO as MinIO S3 Store
    participant DB as PostgreSQL DB
    participant SSE as Server-Sent Events

    Annotator->>API: POST /api/v1/images/{image_id}/auto-label
    Note over API: Get active ML Model from DB
    API->>DB: INSERT AutoLabelJob (status=queued)
    API->>Redis: Enqueue worker.tasks.auto_label_image(job_id)
    API->>SSE: Publish "auto_label_queued"
    API-->>Annotator: 202 Accepted (job_id, status=queued)
    
    SSE-->>Annotator: Receive SSE: auto_label_queued

    Redis->>Worker: Consume task
    Worker->>DB: UPDATE AutoLabelJob (status=running)
    
    Worker->>MinIO: Fetch original image binary (object_key)
    MinIO-->>Worker: Image Byte Stream

    Note over Worker: Base64-encode bytes
    Worker->>ML: POST /infer/auto-label (image_base64, provider)
    Note over ML: Decode Base64 & execute model inference
    ML-->>Worker: 200 OK (Predictions: label, confidence, geometry)

    Note over Worker: Begin SQL Transaction
    Worker->>DB: DELETE annotations WHERE image_id=id AND source=auto
    Worker->>DB: INSERT new annotations & versions (Draft state)
    Worker->>DB: UPDATE task (status=in_review)
    Worker->>DB: UPDATE AutoLabelJob (status=completed)
    Worker->>DB: UPDATE images (revision = revision + 1)
    DB-->>Worker: Commit Transaction

    Worker->>SSE: Publish "auto_label_completed"
    SSE-->>Annotator: Receive SSE: auto_label_completed (image_id)
    Note over Annotator: Reload canvas with new polygons
```

---

## 🛠️ Step-by-Step Operations Tracing

### Step 1: Triggering the Job
When the user clicks the "Auto-Label" button in the canvas workspace, the frontend checks the current task status and requests auto-labeling:
*   **Request**: `POST /api/v1/images/{image_id}/auto-label`
*   **API Action**:
    1.  Verifies the user has at least an `annotator` role.
    2.  Queries `ml_models` to fetch the active model configuration.
    3.  Generates a job UUID and inserts an `AutoLabelJob` record with `status = "queued"`.
    4.  Pushes the job ID to the Redis message bus via `celery_app.send_task("worker.tasks.auto_label_image", args=[job_id])`.
    5.  Publishes the `auto_label_queued` SSE event.
    6.  Returns `202 Accepted` to the client.

### Step 2: Worker Initialization
A Celery worker node retrieves the task from Redis:
*   **API Action**: The worker starts a DB session, queries the `AutoLabelJob` by ID, updates its status to `running`, and commits.
*   **S3 Fetch**: The worker fetches the raw image bytes from MinIO via `get_object_bytes(image.object_key)`.

### Step 3: ML Inference
The worker base64 encodes the image bytes and calls the ML microservice:
*   **Request**: `POST {settings.ml_service_url}/infer/auto-label`
*   **ML Service Action**:
    1.  Decodes the base64 string to BGR image pixels using OpenCV.
    2.  Invokes PyTorch to run the YOLO segmenter.
    3.  If YOLO fails or has no predictions, falls back to OpenCV contour detection (`cv_fallback`).
    4.  Returns predicted categories, confidence metrics, and coordinate points (GeoJSON format).

### Step 4: Database Synchronization (Bulk Insert)
The worker receives the prediction list and runs a PostgreSQL transaction:
*   **Cleanup**: Deletes previous auto-label annotations on that image to prevent coordinate duplication.
*   **Insert**: Creates new `Annotation` and `AnnotationVersion` records in `draft` status.
*   **Optimization**: Generates UUIDs in-memory using `uuid4()` before calling `db.add()`, avoiding nested flush database roundtrips.
*   **Revision Update**: Increments the `annotation_revision` column on the `Image` record to keep cache state aligned.
*   **Task State**: Sets the matching `Task` status to `in_review` so reviewers can access it.
*   **Job Complete**: Updates `AutoLabelJob` to `completed` and commits the transaction.

### Step 5: Frontend Update
*   **SSE Notify**: The worker calls `publish_project_event` to write an `auto_label_completed` message.
*   **Browser Canvas Reload**: The browser's event stream handler receives the message. If the completed `image_id` matches the active image in `useAnnotationStore`, the canvas triggers a clean fetch request (`GET /api/v1/images/{image_id}/annotations`), scales coordinates, and renders the polygons.
