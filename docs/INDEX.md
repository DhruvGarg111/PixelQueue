# PixelQueue Documentation Hub

Welcome to the PixelQueue developer and operator documentation. This hub serves as a central index for all technical manuals, design documentation, and API specifications.

---

## 🧭 Document Index

### 1. Getting Started
- [Local Setup & Getting Started](file:///E:/my%20github/PixelQueue/docs/ops/local-setup.md) — Bare-metal and containerized quick-starts.
- [Environment Variables](file:///E:/my%20github/PixelQueue/docs/ops/environment-variables.md) — Reference for all configuration variables.
- [Developer Contribution Guide](file:///E:/my%20github/PixelQueue/CONTRIBUTING.md) — Coding styles, PR checklist, and system design patterns.
- [Release Changelog](file:///E:/my%20github/PixelQueue/CHANGELOG.md) — Release notes and history.

### 2. Architecture & Design
- [System Architecture Overview](file:///E:/my%20github/PixelQueue/docs/architecture/overview.md) — Topology, service roles, and network communication table.
- [Data Flow Sequences](file:///E:/my%20github/PixelQueue/docs/architecture/data-flow.md) — End-to-end data pipelines for uploads, auto-labeling, and exports.
- [RBAC and Security](file:///E:/my%20github/PixelQueue/docs/architecture/rbac.md) — Role definitions, permissions matrices, and dependency chains.

### 3. Architecture Decision Records (ADRs)
- [ADR 001: FastAPI over Django REST](file:///E:/my%20github/PixelQueue/docs/adr/001-fastapi-over-django.md)
- [ADR 002: Celery Task Queue](file:///E:/my%20github/PixelQueue/docs/adr/002-celery-task-queue.md)
- [ADR 003: SSE over WebSockets](file:///E:/my%20github/PixelQueue/docs/adr/003-sse-over-websocket.md)
- [ADR 004: MinIO Object Storage](file:///E:/my%20github/PixelQueue/docs/adr/004-minio-object-storage.md)
- [ADR 005: YOLO Inference Microservice](file:///E:/my%20github/PixelQueue/docs/adr/005-yolo-ml-service.md)

### 4. API Reference (v1)
*Tailored for internal frontend developers consuming the backend.*
- [Authentication & Sessions](file:///E:/my%20github/PixelQueue/docs/api/v1/authentication.md) — Session cookies, CSRF tokens, and Google OAuth callback flows.
- [Projects Management](file:///E:/my%20github/PixelQueue/docs/api/v1/projects.md) — CRUD operations, membership roles, and status workflows.
- [Images Management](file:///E:/my%20github/PixelQueue/docs/api/v1/images.md) — Direct uploads, presigned URLs, and format rules.
- [Annotations Canvas Core](file:///E:/my%20github/PixelQueue/docs/api/v1/annotations.md) — GeoJSON shapes, manual edits, and auto-label triggering.
- [Exports Pipeline](file:///E:/my%20github/PixelQueue/docs/api/v1/exports.md) — Export triggering, status polling, and format specifications (COCO/YOLO).
- [Server-Sent Events (SSE)](file:///E:/my%20github/PixelQueue/docs/api/v1/events-sse.md) — Real-time event streams, schemas, and frontend handler conventions.

### 5. Developer Manuals
- [Backend Development Guide](file:///E:/my%20github/PixelQueue/docs/dev/backend-guide.md) — Router architecture, dependencies, schemas, and endpoint tests.
- [Frontend Development Guide](file:///E:/my%20github/PixelQueue/docs/dev/frontend-guide.md) — React component architecture, Konva canvas coordinates, and Zustand stores.
- [Worker Development Guide](file:///E:/my%20github/PixelQueue/docs/dev/worker-guide.md) — Adding Celery tasks, transaction boundaries, and retry mechanics.
- [Data Models & Schema Reference](file:///E:/my%20github/PixelQueue/docs/dev/data-models.md) — Relational ERD mapping, columns, and index constraints.
- [Testing Standards](file:///E:/my%20github/PixelQueue/docs/dev/testing.md) — Unit/integration tests with pytest and Vitest.

### 6. Operations & Deployment
- [Docker Compose Guide](file:///E:/my%20github/PixelQueue/docs/ops/docker-compose.md) — Container dependencies, resource limits, and worker scaling.
- [Database Migrations](file:///E:/my%20github/PixelQueue/docs/ops/database-migrations.md) — Alembic migrations workflow and schema rollbacks.
- [Monitoring & Telemetry](file:///E:/my%20github/PixelQueue/docs/ops/monitoring.md) — Prometheus metrics scrape endpoints, alerting limits, and Flower queues.

### 7. Machine Learning & MLOps
- [ML Service Reference](file:///E:/my%20github/PixelQueue/docs/ml/ml-service.md) — Ultralytics YOLO segmentation and OpenCV fallback providers.
- [MLOps Scripts Suite](file:///E:/my%20github/PixelQueue/docs/ml/mlops-scripts.md) — Dataset prep, training runs, map evaluations, and registry scripts.
- [Auto-Label Pipeline](file:///E:/my%20github/PixelQueue/docs/ml/auto-label-pipeline.md) — Core async pipeline tracing from canvas click to inference and DB sync.
