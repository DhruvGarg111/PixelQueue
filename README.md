# Collaborative AI-Assisted Image Annotation Platform

A production-style, full-stack image annotation system with:

- Role-based collaboration (`annotator`, `reviewer`, `admin`)
- Human-in-the-loop quality control (approve/reject)
- Auto-labeling jobs via ML service + Celery
- Dataset export (COCO and YOLO)
- Metrics and operational observability

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [First-Run Workflow](#first-run-workflow)
- [Service Endpoints](#service-endpoints)
- [API Quick Reference](#api-quick-reference)
- [Testing](#testing)
- [Training Pipeline Scripts](#training-pipeline-scripts)
- [Configuration Notes](#configuration-notes)
- [Troubleshooting](#troubleshooting)

## Architecture

```text
Browser
  -> Frontend (React/Vite, served by Nginx)
    -> API (FastAPI)
      -> PostgreSQL (core data, revisions, audit)
      -> MinIO (images, exported artifacts, model artifacts)
      -> Redis (broker/result backend)
      -> Celery Worker (auto-label, export jobs)
      -> ML Service (YOLO seg provider with cv_fallback)
```

Core lifecycle:

1. Upload image -> task created (`open`)
2. Annotate (`in_progress`) with autosave + revision checks
3. Submit for review (`in_review`)
4. Reviewer approves/rejects
5. All approved -> task `done`
6. Any reject -> task returns for rework
7. Export approved annotations as COCO/YOLO

## Tech Stack

- Frontend: React 18, Vite, Zustand, React Router, react-konva
- API: FastAPI, SQLAlchemy 2, Alembic, JWT auth
- Storage/Data: PostgreSQL, MinIO (S3-compatible object storage), Redis
- Background Jobs: Celery worker
- ML Service: FastAPI + OpenCV fallback + optional Ultralytics YOLO
- Observability: Prometheus metrics, Flower

## Repository Layout

```text
api/          FastAPI app, schemas, routes, models, migrations config
frontend/     React app and UI
worker/       Celery tasks for auto-label and export
ml-service/   Inference service used by auto-label jobs
scripts/      Bootstrap, dataset prep, training/eval/register helpers
tests/        API, integration, and ML service tests
db/           SQL bootstrap/migration assets for Postgres init
monitoring/   Prometheus config
```

## Quick Start (Docker Compose)

Prerequisites:

- Docker + Docker Compose

1. Create env file.

```powershell
Copy-Item .env.example .env
```

2. Build and start services.

```bash
docker compose up --build -d
```

3. Seed users, a starter project, and active model metadata.

```bash
docker compose --profile tools run --rm bootstrap
```

4. Open the app:

- Frontend: `http://localhost:5173`
- API docs (OpenAPI): `http://localhost:8000/docs`

5. Stop services when done:

```bash
docker compose down
```

To wipe persisted data (Postgres/MinIO volumes), use:

```bash
docker compose down -v
```

## First-Run Workflow

Default users created by `bootstrap`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Reviewer | `reviewer@example.com` | `reviewer123` |
| Annotator | `annotator@example.com` | `annotator123` |

Recommended flow:

1. Login as admin.
2. Use existing bootstrapped project or create a new one.
3. Ensure annotator and reviewer are project members.
4. Login as annotator:
   - Open `Annotate`
   - Upload image
   - Draw bbox/polygon annotations
   - Optionally run `Auto-Label`
5. Login as reviewer:
   - Open `Review`
   - Approve or reject annotations
6. Open `Exports`:
   - Queue COCO or YOLO export
   - Download when status is `completed`

If you create a brand new project, add members via API:

Requires: `curl` and `jq`.

```bash
# Login and collect tokens
ADMIN_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r .access_token)
ANNOTATOR_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"annotator@example.com","password":"annotator123"}' | jq -r .access_token)
REVIEWER_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewer@example.com","password":"reviewer123"}' | jq -r .access_token)

ANNOTATOR_ID=$(curl -s http://localhost:8000/api/v1/me -H "Authorization: Bearer $ANNOTATOR_TOKEN" | jq -r .id)
REVIEWER_ID=$(curl -s http://localhost:8000/api/v1/me -H "Authorization: Bearer $REVIEWER_TOKEN" | jq -r .id)

# Replace <PROJECT_ID>
curl -X POST http://localhost:8000/api/v1/projects/<PROJECT_ID>/members \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$ANNOTATOR_ID\",\"role\":\"annotator\"}"

curl -X POST http://localhost:8000/api/v1/projects/<PROJECT_ID>/members \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$REVIEWER_ID\",\"role\":\"reviewer\"}"
```

## Service Endpoints

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| API | `http://localhost:8000` |
| API Docs | `http://localhost:8000/docs` |
| ML Service | `http://localhost:8002` |
| Flower | `http://localhost:5555` |
| Prometheus | `http://localhost:9090` |
| Worker Metrics | `http://localhost:9101/metrics` |
| MinIO API | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |

## API Quick Reference

Base URL: `http://localhost:8000`

Auth:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/me`

Projects and membership:

- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `POST /api/v1/projects/{project_id}/members`

Images and tasks:

- `POST /api/v1/projects/{project_id}/images/presign-upload`
- `POST /api/v1/projects/{project_id}/images/commit-upload`
- `GET /api/v1/projects/{project_id}/tasks`
- `GET /api/v1/projects/{project_id}/tasks/next`
  - optional query: `exclude_task_id=<task_uuid>`
- `GET /api/v1/projects/{project_id}/images/{image_id}`

Annotations/review:

- `GET /api/v1/images/{image_id}/annotations`
- `PUT /api/v1/images/{image_id}/annotations`
- `POST /api/v1/images/{image_id}/auto-label`
- `POST /api/v1/annotations/{annotation_id}/review`

Exports/events:

- `POST /api/v1/projects/{project_id}/exports`
- `GET /api/v1/projects/{project_id}/exports`
- `GET /api/v1/exports/{export_id}`
- `GET /api/v1/events/stream?project_id=...&token=...`

Health/metrics:

- `GET /healthz`
- `GET /readyz`
- `GET /metrics`

## Testing

Install Python test dependencies and run backend/integration tests:

```bash
pip install -r tests/requirements.txt
pytest
```

Run frontend tests:

```bash
cd frontend
npm ci
npm run test
```

Run integration demo script:

```bash
python tests/integration/run_demo_flow.py
```

Helpers:

- Bash: `./scripts/run_demo_flow.sh`
- PowerShell: `./scripts/run_demo_flow.ps1`

## Training Pipeline Scripts

Scripts (run from repository root):

- `scripts/prepare_dataset.py`
- `scripts/train_yolo.py`
- `scripts/evaluate.py`
- `scripts/register_model.py`

Suggested sequence:

```bash
python scripts/prepare_dataset.py
python scripts/train_yolo.py
python scripts/evaluate.py
python scripts/register_model.py
```

Outputs:

- `tmp/dataset/` YOLO-format dataset and summary
- `tmp/training/model.pt` model artifact (or fallback artifact)
- `tmp/evaluation.json` quality proxy metrics
- Model metadata row in `ml_models` and artifact in MinIO

## Configuration Notes

Copy `.env.example` to `.env` and review these values first:

- `JWT_SECRET_KEY`: change for non-local environments
- `MINIO_PUBLIC_ENDPOINT`: keep `localhost:9000` for local browser presigned URL access
- `ALLOWED_IMAGE_CONTENT_TYPES`: upload allow-list
- `MAX_IMAGE_BYTES`: maximum upload size
- `DEFAULT_AUTO_LABEL_PROVIDER`: `yolo_seg` or `cv_fallback`
- `VITE_API_URL`: leave empty for Docker Nginx `/api` proxy, set only for external API hosts

## Troubleshooting

`no available task` in annotate page:

- No eligible tasks exist for your role/project.
- Upload new images or verify task status and membership.

Review queue is empty:

- Reviewer view shows tasks in `in_review`.
- Make sure annotations were saved/submitted from annotate flow.

Exports stay queued/failed:

- Check `worker` logs: `docker compose logs -f worker`
- Verify Redis and ML service are healthy.

Upload/download link issues in browser:

- Confirm `MINIO_PUBLIC_ENDPOINT=localhost:9000` in `.env` for local Docker runs.

API 401/403:

- 401: invalid/expired token.
- 403: missing project membership or insufficient project role.

## Operational Notes

- Frontend container serves static assets via Nginx and proxies `/api/*` to the API.
- ML service falls back to deterministic OpenCV proposals if YOLO path is unavailable.
- API and worker expose Prometheus metrics; inspect via `/metrics` and Prometheus UI.
