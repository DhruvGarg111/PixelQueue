# ML Service Reference

The `ml-service` is a microservice built with FastAPI, OpenCV, and PyTorch (Ultralytics YOLO). It exposes high-performance object detection and instance segmentation inference endpoints.

---

## 🏗️ Service Architecture

The service uses a provider-based architecture, allowing the core inference endpoints to route tasks dynamically depending on configuration or weight registers.

```
POST /infer/auto-label  ──► Decode Base64 Image
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
          [yolo_seg Provider]   [cv_fallback Provider]
                  │                     │
                  ▼                     ▼
          Ultralytics YOLOv8    OpenCV Contour Tracing
                  │                     │
                  └──────────┬──────────┘
                             ▼
                    GeoJSON Predictions
```

---

## 🛠️ API Endpoints

### 1. Inference Auto-Label (`POST /infer/auto-label`)
Executes boundary segmentation on a base64-encoded image.
*   **Request Payload (`InferRequest`)**:
    ```json
    {
      "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "provider": "yolo_seg",
      "model_name": "yolov8n-seg.pt",
      "max_predictions": 12
    }
    ```
    *   `provider`: Options: `yolo_seg`, `cv_fallback` (default: `yolo_seg`).
    *   `model_name`: The weights filename inside the model registry (default: `yolov8n-seg.pt`).
    *   `max_predictions`: Limits the number of polygons returned (default: 12, range: 1-64).
*   **Response Payload (`InferResponse`)**:
    ```json
    {
      "provider": "yolo_seg",
      "predictions": [
        {
          "label": "car",
          "confidence": 0.92,
          "geometry": {
            "type": "polygon",
            "points": [
              {"x": 0.25, "y": 0.40},
              {"x": 0.35, "y": 0.40},
              {"x": 0.35, "y": 0.55},
              {"x": 0.25, "y": 0.55}
            ]
          }
        }
      ]
    }
    ```

### 2. Liveness Check (`GET /healthz`)
Exposes system health status and configuration details:
```json
{
  "ok": true,
  "default_provider": "yolo_seg"
}
```

---

## 🧠 ML Inference Providers

### 1. YOLO Segmentation (`yolo_seg` provider)
*   **Engine**: PyTorch + Ultralytics YOLOv8.
*   **Weights Loading**: The service automatically downloads standard weights (e.g. `yolov8n-seg.pt`) or loads them from the local persistent workspace.
*   **Output**: YOLO generates pixel-level masks which are converted to polygon boundaries using coordinate scaling.

### 2. Computer Vision Fallback (`cv_fallback` provider)
*   **Engine**: OpenCV.
*   **Workflow**: Converts the image to grayscale, applies Otsu thresholding, performs morphological operations to clean noise, and runs contour retrieval (`cv2.findContours`).
*   **Use Case**: Serves as a fast CPU-only model fallback when GPU tasks are unavailable, or to pre-segment high-contrast objects.

### 3. Failover Cascading Mechanism
If `provider` is set to `yolo_seg` but execution fails (e.g. weights are missing, or GPU memory is saturated), the service automatically drops back to `cv_fallback` to process the request. It returns `"provider": "cv_fallback"` in the response payload to notify the worker.
