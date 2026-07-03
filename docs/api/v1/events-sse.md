# Server-Sent Events (SSE) stream v1

PixelQueue broadcasts real-time execution states and database updates to connected frontend clients using a Server-Sent Events (SSE) stream channel. This enables non-blocking UI changes (such as auto-updating canvas layers or download buttons) when background workers complete tasks.

---

## 📡 Stream Connection

*   **Endpoint**: `GET /api/v1/events/stream`
*   **Query Parameters**:
    *   `project_id` (Required): The unique UUID of the project.
*   **Headers**:
    *   `Cache-Control: no-cache`
    *   `Connection: keep-alive`
    *   `X-Accel-Buffering: no` (Bypasses proxy buffering in Nginx)
*   **Authorization**: The request must pass cookie-based session authorization and verify active project membership.
*   **Heartbeat**: The connection issues a `ping` event every 5 seconds to keep the socket alive:
    ```
    event: ping
    data: {}
    ```

---

## 📋 Broadcast Event Schemas

The following event types are published by backend actions and Celery workers:

### 1. `image_committed`
Broadcast when a new image file is successfully committed to storage and a task is provisioned.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "image_committed",
      "payload": {
        "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
        "task_id": "e14a6439-e66b-30d1-003b-24b1dab4954c"
      },
      "ts": "2026-07-02T15:13:00.045Z"
    }
    ```

### 2. `auto_label_queued`
Broadcast immediately when an auto-label worker task is enqueued.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "auto_label_queued",
      "payload": {
        "job_id": "8581fc1c-5407-41bc-b21a-deb04066503b",
        "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32"
      },
      "ts": "2026-07-02T15:20:00.123Z"
    }
    ```

### 3. `auto_label_completed`
Broadcast when the Celery inference worker completes predicting segmentations.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "auto_label_completed",
      "payload": {
        "job_id": "8581fc1c-5407-41bc-b21a-deb04066503b",
        "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
        "count": 12
      },
      "ts": "2026-07-02T15:20:15.567Z"
    }
    ```

### 4. `auto_label_failed`
Broadcast if the ML model inference or coordinate scaling fails.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "auto_label_failed",
      "payload": {
        "job_id": "8581fc1c-5407-41bc-b21a-deb04066503b",
        "error": "ML Service timeout"
      },
      "ts": "2026-07-02T15:21:00.000Z"
    }
    ```

### 5. `annotations_saved`
Broadcast when a user saves manual refinements on the canvas stage.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "annotations_saved",
      "payload": {
        "image_id": "07ec528c-8ca1-4b70-073c-3caf8bbd8d32",
        "revision": 3,
        "count": 5
      },
      "ts": "2026-07-02T15:25:30.891Z"
    }
    ```

### 6. `annotation_reviewed`
Broadcast when a QA action is performed on an annotation.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "annotation_reviewed",
      "payload": {
        "annotation_id": "18024537-831a-8eb5-31ba-05492671169a",
        "action": "approve",
        "revision": 4
      },
      "ts": "2026-07-02T15:28:00.111Z"
    }
    ```

### 7. `export_completed`
Broadcast when the dataset package compiler finishes generating the ZIP file in MinIO.
*   **Payload Schema**:
    ```json
    {
      "project_id": "e44d3209-7756-4221-a3f2-c0c28d00f37f",
      "event": "export_completed",
      "payload": {
        "export_id": "2378aaa9-f99b-7110-18cd-a33064d69284",
        "object_key": "projects/.../exports/2378aaa9.zip"
      },
      "ts": "2026-07-02T15:30:12.990Z"
    }
    ```

---

## 🔗 React Integration Hook Pattern

The frontend React application subscribes to the stream inside a context or custom listener hook. This binds backend events directly to Zustand store updates:

```javascript
import { useEffect } from 'react';
import { useAnnotationStore } from '../store/annotationStore';

export function useProjectEvents(projectId) {
  const fetchAnnotations = useAnnotationStore((state) => state.fetchAnnotations);

  useEffect(() => {
    if (!projectId) return;

    // Establish the EventSource connection
    const eventSource = new EventSource(
      `/api/v1/events/stream?project_id=${projectId}`,
      { withCredentials: true } // Ensures session cookies are sent
    );

    // Register event listeners
    eventSource.addEventListener('auto_label_completed', (event) => {
      const data = JSON.parse(event.data);
      console.log('Auto label complete for image:', data.payload.image_id);
      
      // Auto-reload the canvas layers if the active image was updated
      const activeImageId = useAnnotationStore.getState().activeImageId;
      if (data.payload.image_id === activeImageId) {
        fetchAnnotations(activeImageId);
      }
    });

    eventSource.addEventListener('export_completed', (event) => {
      const data = JSON.parse(event.data);
      console.log('Export ready to download:', data.payload.export_id);
      // Trigger a refresh on the exports table
      window.dispatchEvent(new CustomEvent('refresh-exports'));
    });

    // Handle connection failures and reconnection attempts
    eventSource.onerror = (err) => {
      console.error('SSE Connection failed:', err);
      // The browser automatically attempts reconnection for EventSource
    };

    return () => {
      // Clean up connection when leaving the project context
      eventSource.close();
    };
  }, [projectId, fetchAnnotations]);
}
```
