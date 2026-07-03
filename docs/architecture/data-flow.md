# Data Flow Sequences

This document provides detailed sequence diagrams and explanations for the three core workflows within PixelQueue:
1. **Image Upload & Ingestion** (Synchronous API + Direct S3 Upload)
2. **Asynchronous Auto-Labeling** (Celery Task + ML Service inference + SSE broadcast)
3. **Asynchronous Dataset Export** (Celery Task + coordinate conversion + ZIP compression)

---

## 1. Image Upload & Ingestion Flow

PixelQueue uses direct client-to-storage uploads via S3 pre-signed URLs to bypass the API server for binary files, preventing memory bloat and preserving bandwidth.

```mermaid
sequenceDiagram
    autonumber
    actor Annotator as Client Browser
    participant API as Core REST API
    participant MinIO as MinIO S3 Store
    participant DB as PostgreSQL DB

    Annotator->>API: POST /api/v1/projects/{id}/images/upload-request (filename, size)
    Note over API: Verify file size and mime types
    API->>MinIO: Generate Presigned PutObject URL
    MinIO-->>API: Presigned URL String
    API-->>Annotator: 200 OK (presigned_url, object_key)

    Annotator->>MinIO: PUT [presigned_url] (Image Binary File)
    MinIO-->>Annotator: 200 OK (upload successful)

    Annotator->>API: POST /api/v1/projects/{id}/images/register (object_key, filename, dimensions)
    API->>DB: INSERT INTO images (id, project_id, object_key, filename, status)
    DB-->>API: Commit Transaction
    API-->>Annotator: 201 Created (Image metadata JSON)
```

### Detailed Sequence
1. **Upload Request**: The browser requests a write link from `api` specifying the name and size of the file.
2. **Presigning**: The backend verifies details (max 20MB, image MIME type) and requests a pre-signed PUT URL from the S3 client wrapper (`minio_client.py`).
3. **Transmission to Browser**: The URL and unique S3 object key (e.g. `projects/{uuid}/images/{uuid}.png`) are returned.
4. **Direct Object Put**: The browser executes a PUT request containing the raw file binary directly to the `minio` service, bypassing the backend.
5. **Registration**: Once the binary is stored, the browser calls the registration endpoint to create the record in `postgres`, finalizing the image's database state.

---

## 2. Asynchronous Auto-Labeling Sequence

Auto-labeling uses PyTorch-based segmentation models. Because ML inference is computationally heavy, it is run asynchronously through Celery task queues.

```mermaid
sequenceDiagram
    autonumber
    actor Annotator as Client Browser
    participant API as Core REST API
    participant DB as PostgreSQL DB
    participant Redis as Redis Message Bus
    participant Worker as Celery Worker
    participant ML as ML Service (FastAPI)
    participant MinIO as MinIO S3 Store
    participant SSE as Server-Sent Events Hub

    Annotator->>API: POST /api/v1/annotations/{image_id}/auto-label
    API->>DB: INSERT INTO auto_label_jobs (status=pending)
    DB-->>API: Return job_id
    API->>Redis: Enqueue worker.tasks.auto_label_image(job_id)
    API-->>Annotator: 202 Accepted (job_id, status=pending)

    Redis->>Worker: Dequeue task(job_id)
    Worker->>DB: UPDATE auto_label_jobs SET status=running
    
    Worker->>MinIO: Fetch original image binary (object_key)
    MinIO-->>Worker: Image Byte Stream

    Note over Worker: Base64 encode image stream
    Worker->>ML: POST /infer/auto-label (image_base64, provider)
    Note over ML: Execute YOLO / OpenCV segmentation
    ML-->>Worker: 200 OK (Polygons, labels, confidence)

    Note over Worker: Convert coordinates to database schema
    Worker->>DB: DELETE FROM annotations WHERE source=auto
    Worker->>DB: INSERT INTO annotations & annotation_versions
    Worker->>DB: UPDATE images SET annotation_revision = revision+1
    Worker->>DB: UPDATE auto_label_jobs SET status=completed
    DB-->>Worker: Commit Transaction

    Worker->>SSE: Publish event (auto_label_completed)
    SSE-->>Annotator: Stream Broadcast event: auto_label_completed (image_id)
    Note over Annotator: Reload canvas with new polygons
```

### Detailed Sequence
1. **Trigger**: Clicking "Auto-Label" sends a POST request. The API immediately inserts a job record, dispatches a task to `redis`, and returns a `202 Accepted` status with a `job_id` so the client UI does not hang.
2. **Task Ingestion**: A `worker` dequeues the task and transitions the job state to `running`.
3. **Data Retrieval**: The worker downloads the source image from `minio` in-memory.
4. **Inference Request**: The worker base64 encodes the file bytes and posts it to the internal `/infer/auto-label` endpoint hosted on the isolated `ml-service` container.
5. **DB Update**: The worker deletes any previous auto-label mocks, bulk-inserts the predictions as JSONB boundaries (`geometry_jsonb`), increments the revision counter, and sets the task's state to complete.
6. **Real-time Notify**: The worker invokes `publish_project_event` which writes to the SSE queue. The SSE connection transmits an `auto_label_completed` message. The client receives the payload and instructs the Konva stage to fetch and render the new polygons.

---

## 3. Asynchronous Dataset Export Flow

Export tasks query project records, run coordinate compilation, compress images + meta, and save the resulting files to S3.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Client Browser
    participant API as Core REST API
    participant DB as PostgreSQL DB
    participant Redis as Redis Message Bus
    participant Worker as Celery Worker
    participant MinIO as MinIO S3 Store
    participant SSE as Server-Sent Events Hub

    Admin->>API: POST /api/v1/projects/{id}/exports (format)
    API->>DB: INSERT INTO export_jobs (status=pending)
    DB-->>API: Return export_id
    API->>Redis: Enqueue worker.tasks.export_project(export_id)
    API-->>Admin: 202 Accepted (export_id, status=pending)

    Redis->>Worker: Dequeue task(export_id)
    Worker->>DB: UPDATE export_jobs SET status=running
    
    Worker->>DB: SELECT images, annotations WHERE status=approved
    DB-->>Worker: Query rows

    Note over Worker: Generate manifest (COCO JSON or YOLO txt files)
    Note over Worker: Fetch & package image binaries from MinIO into ZIP
    
    Worker->>MinIO: PUT project-export-{id}.zip
    MinIO-->>Worker: Save complete

    Worker->>DB: UPDATE export_jobs SET status=completed, download_url=object_key
    DB-->>Worker: Commit Transaction

    Worker->>SSE: Publish event (export_completed)
    SSE-->>Admin: Stream Broadcast: export_completed (download_url)
    Note over Admin: Enable download button in Exports Page
```

### Detailed Sequence
1. **Trigger**: An admin initiates an export in a chosen format (`coco_json` or `yolo_txt`).
2. **Queuing**: The API registers a database tracking record, sends the task details to `redis`, and hands back a tracking payload to the client.
3. **Compilation**: The worker fetches all database annotations validated as `approved` (ground-truth only).
4. **Formatting**: In-memory, the converter modules translate the DB polygon structure into either standard COCO JSON schemas or normalized YOLO bounding box text files.
5. **Storage**: The package writes these text assets, fetches original images from MinIO, packages them into a single ZIP archive, and uploads it to MinIO.
6. **Delivery**: The job is marked as complete. The SSE listener notifies the user, exposing a link that requests a pre-signed GET URL to download the archive directly from S3.
