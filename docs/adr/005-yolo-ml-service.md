# ADR 005: YOLO Inference Microservice over In-Process Inference

*   **Status**: Approved
*   **Decided by**: Tech Lead
*   **Date**: 2026-07-02

---

## Context and Problem Statement

Auto-labeling requires loading weights and executing PyTorch/YOLO inference models. 

Should the ML model code execute in-process inside the backend API or background worker (loading weights directly in the worker python interpreter), or should it run inside an isolated microservice?

---

## Decision Driver

1.  **Dependency Isolation**: PyTorch, TorchVision, and Ultralytics require large package downloads (exceeding 2GB) and system libraries that are not needed by the API server.
2.  **Resource Allocation**: Model inference is CPU/GPU intensive. ML processes must not starve the API server of memory or threads.
3.  **Cold Start Times**: Loading weights in-memory takes time. The inference service should keep the model loaded and ready.

---

## Considered Options

1.  **Isolated ML Service**: A standalone FastAPI container running PyTorch, exposing a simple REST endpoint (`/infer/auto-label`).
2.  **In-Process Worker Execution**: Importing the Ultralytics YOLO package directly inside the Celery worker task code.

---

## Decision Outcome

We chose to run an **Isolated ML Service**.

### Consequences

*   **Positive (Pros)**:
    *   **Lightweight API & Worker Images**: The API and Celery worker Docker images remain under 300MB, while the heavy PyTorch and OpenCV dependencies are isolated in the ML image.
    *   **Independent Resource Scaling**: We can deploy the ML service container on GPU-enabled instances (like AWS ECS/EC2 with CUDA support) while keeping the API and database on standard CPU instances.
    *   **Process Stability**: If the ML service runs out of memory (OOM) or crashes, the core API remains fully active.
    *   **Lazy Loading**: The ML service loads weights in-memory once on startup, making subsequent calls fast.
*   **Negative (Cons)**:
    *   **Network overhead**: Passing base64 images over HTTP between the worker and the ML service adds a slight latency overhead. This is minimized locally since the containers reside in the same virtual bridge network.
