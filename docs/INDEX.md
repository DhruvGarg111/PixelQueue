# PixelQueue Documentation Hub

Welcome to the PixelQueue developer and operator documentation. This hub serves as a central index for all technical manuals, design documentation, and API specifications.

---

## 🧭 Document Index

### 1. Getting Started
- [Local Setup & Getting Started](ops/local-setup.md) — Bare-metal and containerized quick-starts.
- [Environment Variables](ops/environment-variables.md) — Reference for all configuration variables.
- [Developer Contribution Guide](../CONTRIBUTING.md) — Coding styles, PR checklist, and system design patterns.
- [Release Changelog](../CHANGELOG.md) — Release notes and history.

### 2. Architecture & Design
- [System Architecture Overview](architecture/overview.md) — Topology, service roles, and network communication table.
- [Data Flow Sequences](architecture/data-flow.md) — End-to-end data pipelines for uploads, auto-labeling, and exports.
- [RBAC and Security](architecture/rbac.md) — Role definitions, permissions matrices, and dependency chains.

### 3. Architecture Decision Records (ADRs)
- [ADR 001: FastAPI over Django REST](adr/001-fastapi-over-django.md)
- [ADR 002: Celery Task Queue](adr/002-celery-task-queue.md)
- [ADR 003: SSE over WebSockets](adr/003-sse-over-websocket.md)
- [ADR 004: MinIO Object Storage](adr/004-minio-object-storage.md)
- [ADR 005: YOLO Inference Microservice](adr/005-yolo-ml-service.md)

### 4. API Reference (v1)
*Tailored for internal frontend developers consuming the backend.*
- [Authentication & Sessions](api/v1/authentication.md) — Session cookies, CSRF tokens, and Google OAuth callback flows.
- [Projects Management](api/v1/projects.md) — CRUD operations, membership roles, and status workflows.
- [Images Management](api/v1/images.md) — Direct uploads, presigned URLs, and format rules.
- [Annotations Canvas Core](api/v1/annotations.md) — GeoJSON shapes, manual edits, and auto-label triggering.
- [Exports Pipeline](api/v1/exports.md) — Export triggering, status polling, and format specifications (COCO/YOLO).
- [Server-Sent Events (SSE)](api/v1/events-sse.md) — Real-time event streams, schemas, and frontend handler conventions.

### 5. Developer Manuals
- [Backend Development Guide](dev/backend-guide.md) — Router architecture, dependencies, schemas, and endpoint tests.
- [Frontend Development Guide](dev/frontend-guide.md) — React component architecture, Konva canvas coordinates, and Zustand stores.
- [Worker Development Guide](dev/worker-guide.md) — Adding Celery tasks, transaction boundaries, and retry mechanics.
- [Data Models & Schema Reference](dev/data-models.md) — Relational ERD mapping, columns, and index constraints.
- [Testing Standards](dev/testing.md) — Unit/integration tests with pytest and Vitest.

### 6. Operations & Deployment
- [Docker Compose Guide](ops/docker-compose.md) — Container dependencies, resource limits, and worker scaling.
- [Database Migrations](ops/database-migrations.md) — Alembic migrations workflow and schema rollbacks.
- [Monitoring & Telemetry](ops/monitoring.md) — Prometheus metrics scrape endpoints, alerting limits, and Flower queues.

### 7. Security remediation plans
- [Pillow Dependabot Remediation Plan](ops/dependabot-pillow-12-3-remediation-plan.md) - Alert inventory, upgrade steps, deployment checks, and closure criteria.

### 8. Machine Learning & MLOps
- [ML Service Reference](ml/ml-service.md) — Ultralytics YOLO segmentation and OpenCV fallback providers.
- [MLOps Scripts Suite](ml/mlops-scripts.md) — Dataset prep, training runs, map evaluations, and registry scripts.
- [Auto-Label Pipeline](ml/auto-label-pipeline.md) — Core async pipeline tracing from canvas click to inference and DB sync.
