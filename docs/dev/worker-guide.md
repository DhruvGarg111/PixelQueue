# Worker Development Guide

This guide describes how the background task worker system is architected, how tasks are registered and executed, and the math behind the geometry conversion utilities.

---

## 🏗️ Background Worker Architecture

PixelQueue uses **Celery** combined with **Redis** as a message broker to process time-consuming or CPU-intensive tasks asynchronously (specifically auto-labeling and dataset compiles).

```
API Server (api)  ──► [celery_app.send_task] ──► Redis Queue (redis)
                                                   │
                                                   ▼
                                           Celery Worker (worker)
```

The worker process is structured inside the `/worker` directory. It uses a shared virtual environment with the database session pool configured in the backend API to synchronize execution results directly to PostgreSQL.

---

## 📂 Module Layout & Task Registration

Task modules are registered dynamically by importing them inside `worker/worker_tasks.py`:

```python
# worker/worker_tasks.py
from app.services.celery_app import celery_app

# Register task modules by importing them
from worker.tasks.auto_label import auto_label_image
from worker.tasks.export import export_dataset

celery = celery_app
```

---

## 🤖 Task Deep Dives

### 1. Auto-Label Task (`worker.tasks.auto_label_image`)
Triggered when an annotator requests machine assistance for an image.
*   **Workflow**:
    1.  Downloads the image binary from MinIO (`get_object_bytes`) and encodes it to Base64.
    2.  Sends the Base64 payload to the ML microservice (`POST /infer/auto-label`).
    3.  Runs a transaction block: deletes old auto annotations for the image, bulk-inserts the new model outputs (using pre-generated UUIDs to avoid database flush bottlenecks), and increments the image revision.
    4.  Updates the `AutoLabelJob` status to `completed` and writes metadata (predicted count, inference model).
    5.  Publishes an event via SSE (`auto_label_completed`).
*   **Error Handling**: If the ML service times out or the DB writes fail, the transaction executes a rollback (`db.rollback()`), sets the job status to `failed`, and logs the exception.

### 2. Dataset Compiler Task (`worker.tasks.export_dataset`)
Compiles a project's approved annotations into a compressed ZIP file.
*   **Workflow**:
    1.  Queries the DB for all `approved` annotations and their parent images.
    2.  Spawns a temporary directory on the worker node.
    3.  Downloads image binaries from MinIO, saving them to `/images/`.
    4.  **COCO JSON compiler**: Combines images and segments into a single `annotations.json` file.
    5.  **YOLO Text compiler**: Converts polygons to normal coordinates, creates individual `.txt` files in `/labels/`, and compiles a `dataset.yaml` metadata manifest.
    6.  Zips the directory, uploads the archive to MinIO, and updates `ExportJob` status.
    7.  Dispatches `export_completed` via SSE.

---

## 📐 Geometry Converters (`worker/converters/geometry.py`)

Coordinate conversions convert the backend's normalized relative points back into the spatial coordinates required by each export specification.

### 1. Shoelace Area Calculation
To compute the segmentation area field required by the COCO spec, the converter implements the Shoelace formula on absolute pixel coordinates:
$$\text{Area} = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$

In python:
```python
def polygon_area(points):
    if len(points) < 3: return 0.0
    area = 0.0
    for idx, (x1, y1) in enumerate(points):
        x2, y2 = points[(idx + 1) % len(points)]
        area += (x1 * y2) - (x2 * y1)
    return abs(area) * 0.5
```

### 2. GeoJSON to COCO Format (`geometry_to_coco`)
COCO segmentations require absolute pixel coordinates inside a flat 1D array. Bounding boxes are stored as `[x_min, y_min, width, height]`.
*   **Conversion Math**:
    *   $\text{pixel\_x} = \text{normalized\_x} \times \text{image\_width}$
    *   $\text{pixel\_y} = \text{normalized\_y} \times \text{image\_height}$
    *   $\text{width} = \max(\text{xs}) - \min(\text{xs})$
    *   $\text{height} = \max(\text{ys}) - \min(\text{ys})$

### 3. GeoJSON to YOLO Text (`geometry_to_yolo_row`)
YOLO coordinates are relative (normalized 0.0 to 1.0).
*   **For Polygons**: YOLO expects a flat space-separated string starting with the class ID followed by coordinates: `<class_id> <x1> <y1> <x2> <y2> ...`
*   **For BBoxes**: YOLO converts corners to a normalized center coordinate:
    *   $x_{\text{center}} = x_{\text{min}} + \frac{\text{width}}{2}$
    *   $y_{\text{center}} = y_{\text{min}} + \frac{\text{height}}{2}$
    *   Format: `<class_id> <x_center> <y_center> <width> <height>`

---

## 🧪 Testing Tasks in Isolation

Tasks should be tested by mocking S3 and HTTP service responses to evaluate DB updates and schema conversions:

```python
import pytest
from unittest.mock import patch
from worker.tasks.auto_label import auto_label_image

@patch("worker.tasks.auto_label.get_object_bytes")
@patch("worker.tasks.auto_label.requests.post")
def test_auto_label_task_pipeline(mock_post, mock_get_bytes, db_session, test_job):
    # Mock storage download
    mock_get_bytes.return_value = b"mock-image-bytes"
    
    # Mock inference server response
    mock_post.return_value.json.return_value = {
        "provider": "yolo_seg",
        "predictions": [
            {
                "label": "car",
                "confidence": 0.89,
                "geometry": {
                    "type": "Polygon",
                    "points": [{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.1}, {"x": 0.2, "y": 0.2}]
                }
            }
        ]
    }
    
    # Trigger task synchronously in test
    auto_label_image(str(test_job.id))
    
    # Verify job status updated in DB
    db_session.refresh(test_job)
    assert test_job.status.value == "completed"
```
