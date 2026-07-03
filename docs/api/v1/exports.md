# Exports API (v1)

This reference documents the endpoints, payload formats, and background worker lifecycle rules governing project dataset exports inside PixelQueue.

---

## 📦 Supported Export Formats

PixelQueue translates internally stored GeoJSON polygons into two standard machine learning formats:

### 1. COCO JSON (`coco_json`)
Generates a single comprehensive metadata JSON file mapping segments and category labels to image IDs.
*   **Dimensions**: Absolute pixel coordinates (`[x, y, x, y, ...]`).
*   **Output Structure**:
    ```json
    {
      "images": [
        {"id": 1, "width": 1920, "height": 1080, "file_name": "image_01.png"}
      ],
      "annotations": [
        {
          "id": 101,
          "image_id": 1,
          "category_id": 2,
          "segmentation": [[100.5, 200.0, 150.0, 220.5, 180.2, 300.0, 100.5, 200.0]],
          "area": 4500.25,
          "bbox": [100.5, 200.0, 79.7, 100.0],
          "iscrowd": 0
        }
      ],
      "categories": [
        {"id": 2, "name": "vehicle", "supercategory": "none"}
      ]
    }
    ```

### 2. YOLO Text (`yolo_txt`)
Generates a separate configuration folder:
*   `/images/` folder containing copies of original images.
*   `/labels/` folder containing matching `.txt` files named after the source image (e.g. `image_01.txt`).
*   **Dimensions**: Normalized bounds (`[class_index, x_center, y_center, width, height]`) mapped relative to image scale (values between 0.0 and 1.0).

---

## 🛠️ Operational Endpoints

### 1. Trigger Project Export (`POST /api/v1/projects/{project_id}/exports`)
Initiates the asynchronous compilation task to package the approved ground-truth annotations and images into a single ZIP archive.
*   **Permissions**: `reviewer` project role or higher.
*   **Request Payload**:
    ```json
    {
      "format": "coco_json"
    }
    ```
    *`format` must be either `"coco_json"` or `"yolo_txt"`.*
*   **Response**: `202 Accepted`
    ```json
    {
      "id": "2378aaa9-f99b-7110-18cd-a33064d69284",
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "format": "coco_json",
      "status": "queued",
      "object_key": null,
      "summary_jsonb": {},
      "error_text": null,
      "created_at": "2026-07-02T15:20:00Z",
      "finished_at": null,
      "download_url": null
    }
    ```
*   **Workflow Side-Effects**:
    *   Saves an `ExportJob` with a status of `queued`.
    *   Enqueues the `worker.tasks.export_dataset` Celery task.
    *   Broadcasts the `export_queued` event via SSE.

### 2. List Export History (`GET /api/v1/projects/{project_id}/exports`)
Returns the last 100 export jobs executed for the project, sorted by `created_at` descending.
*   **Permissions**: `annotator` project role or higher.
*   **Response**: `200 OK` (Array of Export Job Objects).

### 3. Check Export Status (`GET /api/v1/exports/{export_id}`)
Queries the execution status of a single export job.
*   **Permissions**: `annotator` project role or higher (associated with the project).
*   **Response**: `200 OK` with the Export Job Object. If the job is complete (`status == "completed"`), the payload includes a pre-signed MinIO download URL:
    ```json
    {
      "id": "2378aaa9-f99b-7110-18cd-a33064d69284",
      "status": "completed",
      "object_key": "exports/e44d3209-7756-4221-a3f2-c0c28d00f37f/coco_json-20260702152000.zip",
      "summary_jsonb": {
        "images_count": 48,
        "annotations_count": 234
      },
      "download_url": "http://localhost:9000/annotation-artifacts/exports/...zip?AWSAccessKeyId=..."
    }
    ```

---

## 🔄 Asynchronous Export Task Lifecycle

1.  **Enqueued State**: Job starts in the `queued` state. The UI shows a loading/spinner status.
2.  **Worker Processing**: Celery worker picks up the job, switches state to `running`, queries all `approved` annotations from the DB, runs the coordinates compiler, packages files in a `.zip` archive, and PUTs the zip directly into MinIO.
3.  **Real-Time Completed Event**: The worker commits database updates and dispatches an `export_completed` event via SSE.
4.  **Download**: The frontend intercepts the `export_completed` event in the `ExportsPage.jsx` dashboard, enabling the download link pointing directly to the pre-signed S3 `download_url` in MinIO.
