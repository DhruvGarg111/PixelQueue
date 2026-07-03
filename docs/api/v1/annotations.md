# Annotations API (v1)

This reference documents the endpoints, schemas, validation rules, and transactional state pipelines governing image annotations inside PixelQueue.

---

## 📐 Data Formats & Schemas

### 1. Geometry Object (GeoJSON Polygon)
PixelQueue enforces GeoJSON-compliant polygons for segmentations. Coordinates are stored in image pixel units (not normalized 0-1 bounds).

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [100.5, 200.0],
      [150.0, 220.5],
      [180.2, 300.0],
      [100.5, 200.0]
    ]
  ]
}
```
*Note: The first and last coordinate elements in a polygon must be identical to close the boundary shape.*

### 2. Annotation Object Schema
```json
{
  "id": "e14a6439-e66b-30d1-003b-24b1dab4954c",
  "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
  "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
  "label": "vehicle",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[100.5, 200.0], [150.0, 220.5], [180.2, 300.0], [100.5, 200.0]]]
  },
  "source": "manual",
  "status": "draft",
  "confidence": 1.0,
  "revision": 3,
  "created_by": "a0ba5ce1-59fb-d616-de40-527bdd3f0c5a",
  "updated_by": "a0ba5ce1-59fb-d616-de40-527bdd3f0c5a",
  "created_at": "2026-07-02T15:12:30Z",
  "updated_at": "2026-07-02T15:18:00Z"
}
```

---

## 🛠️ Endpoints Reference

### 1. Get Image Annotations Bundle (`GET /api/v1/images/{image_id}/annotations`)
Fetches all active annotations, the current revision, and the task status for a specific image.
*   **Permissions**: `annotator` project role or higher.
*   **Response Payload (`AnnotationBundleResponse`)**:
    ```json
    {
      "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
      "revision": 2,
      "task_status": "in_progress",
      "annotations": [ ... ]
    }
    ```

### 2. Save Annotations Bundle (`PUT /api/v1/images/{image_id}/annotations`)
Bulk-saves the annotations for an image. This is a destructive write: it deletes all active annotations for the image and inserts the new list, while archiving the old versions in the history table.
*   **Permissions**: `annotator` project role or higher.
*   **Request Payload (`AnnotationSaveRequest`)**:
    ```json
    {
      "expected_revision": 2,
      "annotations": [
        {
          "label": "vehicle",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[100.5, 200.0], [150.0, 220.5], [180.2, 300.0], [100.5, 200.0]]]
          },
          "source": "manual",
          "status": "draft",
          "confidence": 1.0
        }
      ]
    }
    ```
*   **Optimistic Concurrency Control**:
    The request must include `expected_revision`. The API executes a row-level lock (`with_for_update`) on the image. If `expected_revision` does not match the image's database `annotation_revision`, it returns an `HTTP 409 Conflict` error:
    ```json
    {
      "detail": {
        "message": "revision mismatch",
        "current_revision": 3
      }
    }
    ```
    This prevents annotators from accidentally overwriting changes made concurrently by another user or background task.
*   **Workflow Side-Effects**:
    *   Increments `image.annotation_revision` by 1.
    *   Inserts new copies into `annotations`, and records history logs in `annotation_versions`.
    *   Transitions the corresponding `Task` status to `in_review`.
    *   Broadcasts an `annotations_saved` event via SSE.

### 3. Trigger Auto-Label (`POST /api/v1/images/{image_id}/auto-label`)
Kicks off the asynchronous ML inference worker pipeline for the target image.
*   **Permissions**: `annotator` project role or higher.
*   **Response**: `202 Accepted`
    ```json
    {
      "job_id": "8581fc1c-5407-41bc-b21a-deb04066503b",
      "status": "queued"
    }
    ```
*   **Workflow Side-Effects**:
    *   Creates an `AutoLabelJob` in the database.
    *   Enqueues the `worker.tasks.auto_label_image` Celery task.
    *   Broadcasts the `auto_label_queued` event via SSE.

### 4. Review Annotation (`POST /api/v1/annotations/{annotation_id}/review`)
Approve or reject a specific annotation, progressing the task state.
*   **Permissions**: `reviewer` project role or higher.
*   **Request Payload**:
    ```json
    {
      "action": "approve",
      "comment": "Accurate vehicle boundaries."
    }
    ```
    *`action` values must be either `"approve"` or `"reject"`.*
*   **Lifecycle Rules & Task Transitions**:
    *   Increments `image.annotation_revision` by 1 and records the review action.
    *   Sets annotation status to `approved` or `rejected`.
    *   **If Approved**: Checks all annotations for the parent image. If all active annotations are marked as `approved`, the overall `Task` is marked as **`done`** (ground-truth dataset ready).
    *   **If Rejected**: The parent `Task` is set back to **`in_progress`** and `assigned_to` is set to null, returning the image to the pool of open tasks for rework.
    *   Broadcasts the `annotation_reviewed` event via SSE.
