# Images API (v1)

This reference documents the endpoints and workflow constraints for uploading, committing, and fetching images inside PixelQueue.

---

## 🖼️ Ingestion Architecture

To prevent memory leaks and transfer bottlenecks, PixelQueue implements a decoupled **Pre-signed Upload Pattern**:

```
1. Client Request URL  ──► Core REST API (Generate URL)
2. Direct Binary PUT   ──► MinIO Storage (Using presigned URL)
3. Commit Transaction  ──► Core REST API (Save metadata & create Task)
```

---

## 🛠️ Endpoints Reference

### 1. Request Pre-signed Upload URL (`POST /api/v1/projects/{project_id}/images/presign-upload`)
Requests a write credential allowing the client browser to upload a binary directly to the object store.
*   **Permissions**: `annotator` project role or higher.
*   **Request Payload**:
    ```json
    {
      "file_name": "street_view_049.png",
      "content_type": "image/png"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "object_key": "projects/e44d3209-7756-4221-a3f2-c0c28d00f37f/images/20260702151200-a0ba5ce1-street_view_049.png",
      "upload_url": "http://localhost:9000/annotation-artifacts/projects/e44d3209-7756-4221-a3f2-c0c28d00f37f/images/20260702151200-a0ba5ce1-street_view_049.png?AWSAccessKeyId=...",
      "expires_in": 900
    }
    ```
*   **Validation Constraints**:
    *   `content_type` must start with `image/`.
    *   Allowed MIME types: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`.

### 2. Commit Uploaded Image (`POST /api/v1/projects/{project_id}/images/commit-upload`)
Commits the uploaded image meta once the binary file has been successfully uploaded to MinIO. This creates the database record and provisions a new open `Task` for the canvas workspace.
*   **Permissions**: `annotator` project role or higher.
*   **Request Payload**:
    ```json
    {
      "object_key": "projects/e44d3209-7756-4221-a3f2-c0c28d00f37f/images/20260702151200-a0ba5ce1-street_view_049.png",
      "width": 1920,
      "height": 1080,
      "checksum": "d41d8cd98f00b204e9800998ecf8427e"
    }
    ```
*   **Response Payload (`ImageResponse`)**:
    ```json
    {
      "id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "object_key": "projects/e44d3209-7756-4221-a3f2-c0c28d00f37f/images/20260702151200-a0ba5ce1-street_view_049.png",
      "width": 1920,
      "height": 1080,
      "checksum": "d41d8cd98f00b204e9800998ecf8427e",
      "annotation_revision": 0,
      "uploaded_by": "a0ba5ce1-59fb-d616-de40-527bdd3f0c5a",
      "created_at": "2026-07-02T15:13:00Z",
      "download_url": "http://localhost:9000/annotation-artifacts/projects/.../images/...png?AWSAccessKeyId=..."
    }
    ```
*   **Validation Constraints**:
    *   The `object_key` must resolve inside MinIO (`stat_object` call checks size and format).
    *   File size must not exceed the `MAX_IMAGE_BYTES` threshold.

### 3. Get Next Available Task (`GET /api/v1/projects/{project_id}/tasks/next`)
Locks and retrieves the next task queue item for workspace assignment.
*   **Permissions**: `annotator` project role or higher.
*   **Query Parameters**:
    *   `exclude_task_id` (Optional): Skip a specific task ID (e.g. to skip the active image on reload).
*   **Behavior**:
    *   Queries tasks with `open`, `in_progress`, or `in_review` statuses where `assigned_to` is either null or the active user.
    *   Applies a database row-level lock (`with_for_update(skip_locked=True)`) to prevent multiple annotators from locking the same task.
    *   Binds the task assignment to the active user and transitions status to `in_progress`.
*   **Response Payload**: `200 OK` with a wrapped `TaskResponse` containing the `image` details:
    ```json
    {
      "id": "e14a6439-e66b-30d1-003b-24b1dab4954c",
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
      "status": "in_progress",
      "assigned_to": "a0ba5ce1-59fb-d616-de40-527bdd3f0c5a",
      "created_at": "2026-07-02T15:12:30Z",
      "updated_at": "2026-07-02T15:20:00Z",
      "image": {
        "id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
        "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
        "object_key": "projects/.../images/...png",
        "width": 1920,
        "height": 1080,
        "download_url": "http://localhost:9000/..."
      }
    }
    ```

---

## 🔗 React Hook Integration

The frontend React client encapsulates this flow inside the custom `useImageUpload` hook (`src/hooks/useImageUpload.js`).

### Ingestion Hook Implementation details:
```javascript
export function useImageUpload(projectId) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      // 1. Request presigned write URL
      const presignRes = await apiRequest(`/api/v1/projects/${projectId}/images/presign-upload`, {
        method: 'POST',
        body: JSON.stringify({ file_name: file.name, content_type: file.type }),
      });
      const { object_key, upload_url } = await presignRes.json();

      // 2. PUT binary directly to MinIO
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!putRes.ok) throw new Error('Upload to S3 failed');

      // 3. Obtain image width & height from browser Image object
      const dimensions = await getImageDimensions(file);

      // 4. Commit metadata to API
      const commitRes = await apiRequest(`/api/v1/projects/${projectId}/images/commit-upload`, {
        method: 'POST',
        body: JSON.stringify({
          object_key,
          width: dimensions.width,
          height: dimensions.height,
          checksum: 'hash', // optional file hash
        }),
      });
      return await commitRes.json();
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
}
```
