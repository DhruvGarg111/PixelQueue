# Collaborative AI-Assisted Image Annotation Platform

Production-style full-stack ML system based on Project IV from the sixth document.

## What this project includes

- React + TypeScript + `react-konva` canvas annotation UI
- FastAPI backend with JWT auth and project-scoped RBAC
- PostgreSQL with JSONB annotations, revision history, review actions, and audit logs
- MinIO object storage with presigned upload/download URLs
- Redis + Celery background jobs for auto-label and dataset export
- ML inference service with `yolo_seg` provider and offline-safe `cv_fallback`
- COCO + YOLO export pipeline
- Prometheus metrics + Flower worker observability
- Automated tests and integration demo flow

## Stack services (Docker Compose)

- `frontend` -> React app (`http://localhost:5173`)
- `api` -> FastAPI backend (`http://localhost:8000`)
- `worker` -> Celery worker + metrics (`http://localhost:9101/metrics`)
- `ml-service` -> inference API (`http://localhost:8002`)
- `postgres`, `redis`, `minio`, `minio-init`
- `prometheus` (`http://localhost:9090`)
- `flower` (`http://localhost:5555`)

## Quick start

1. Create env file.

```powershell
Copy-Item .env.example .env
```

2. Start the platform.

```bash
docker compose up --build
```

3. Bootstrap users and seed project/model.

```bash
docker compose --profile tools run --rm bootstrap
```

4. Open UI and sign in.

- URL: `http://localhost:5173`
- Admin: `admin@example.com / admin123`
- Reviewer: `reviewer@example.com / reviewer123`
- Annotator: `annotator@example.com / annotator123`

## How to use (step-by-step)

Use this flow after Quick start:

1. Open `http://localhost:5173`.
2. Login as `admin@example.com / admin123`.
3. Either:
   - Use the bootstrapped project already listed on the Projects page, or
   - Create a new project from **Create Project**.
4. If you created a new project, add reviewer/annotator members (API):

```bash
# get admin token
ADMIN_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r .access_token)

# get annotator/reviewer ids from their own /me endpoint
ANNOTATOR_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"annotator@example.com","password":"annotator123"}' | jq -r .access_token)
REVIEWER_TOKEN=$(curl -s http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewer@example.com","password":"reviewer123"}' | jq -r .access_token)
ANNOTATOR_ID=$(curl -s http://localhost:8000/api/v1/me -H "Authorization: Bearer $ANNOTATOR_TOKEN" | jq -r .id)
REVIEWER_ID=$(curl -s http://localhost:8000/api/v1/me -H "Authorization: Bearer $REVIEWER_TOKEN" | jq -r .id)

# replace <PROJECT_ID> with your new project id
curl -X POST http://localhost:8000/api/v1/projects/<PROJECT_ID>/members \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$ANNOTATOR_ID\",\"role\":\"annotator\"}"
curl -X POST http://localhost:8000/api/v1/projects/<PROJECT_ID>/members \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$REVIEWER_ID\",\"role\":\"reviewer\"}"
```

5. Login as `annotator@example.com / annotator123` and open **Annotate**.
6. Upload an image, draw bbox/polygon labels, and optionally click **Auto-Label**.
7. Login as `reviewer@example.com / reviewer123`, open **Review**, and approve/reject annotations.
8. Go to **Exports**, queue COCO/YOLO export, then download the artifact when status is `completed`.
9. Stop the platform when done:

```bash
docker compose down
```

## Demo flow (automated)

After stack is running and bootstrap is complete:

```bash
python tests/integration/run_demo_flow.py
```

PowerShell helper:

```powershell
./scripts/run_demo_flow.ps1
```

## Core workflows

1. Create project (`admin` or `reviewer`).
2. Add members with project roles.
3. Upload image via presigned URL + commit.
4. Annotate on canvas (bbox/polygon) with debounced autosave and optimistic revision checks.
5. Trigger auto-label job and refine model suggestions.
6. Review annotations (`reviewer` or `admin`) and approve/reject.
7. Export approved labels as COCO or YOLO.

## API surface

Base URL: `http://localhost:8000`

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/me`
- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `POST /api/v1/projects/{project_id}/members`
- `POST /api/v1/projects/{project_id}/images/presign-upload`
- `POST /api/v1/projects/{project_id}/images/commit-upload`
- `GET /api/v1/projects/{project_id}/tasks/next`
- `GET /api/v1/projects/{project_id}/tasks?status=...`
- `GET /api/v1/images/{image_id}/annotations`
- `PUT /api/v1/images/{image_id}/annotations`
- `POST /api/v1/images/{image_id}/auto-label`
- `POST /api/v1/annotations/{annotation_id}/review`
- `POST /api/v1/projects/{project_id}/exports`
- `GET /api/v1/projects/{project_id}/exports`
- `GET /api/v1/exports/{export_id}`
- `GET /api/v1/events/stream?project_id=...&token=...`
- `GET /healthz`
- `GET /readyz`
- `GET /metrics`

## ML pipeline scripts

- `scripts/prepare_dataset.py`
- `scripts/train_yolo.py`
- `scripts/evaluate.py`
- `scripts/register_model.py`

Suggested order:

```bash
python scripts/prepare_dataset.py
python scripts/train_yolo.py
python scripts/evaluate.py
python scripts/register_model.py
```

Pipeline details:

- `prepare_dataset.py` builds `tmp/dataset/` with deterministic train/val split and YOLO labels from approved annotations.
- `train_yolo.py` trains with Ultralytics when available; otherwise generates deterministic fallback artifact for offline runs.
- `evaluate.py` writes `tmp/evaluation.json` with dataset quality proxy metrics.
- `register_model.py` uploads model artifact to MinIO and marks model active in `ml_models`.

## Testing

Python tests:

```bash
pip install -r tests/requirements.txt
pytest
```

Frontend unit tests:

```bash
cd frontend
npm install
npm run test
```

## Operational notes

- If YOLO dependencies are unavailable, the ML service falls back to OpenCV contour proposals (`cv_fallback`) automatically.
- Upload commit validates image content type and max size (`MAX_IMAGE_BYTES`, `ALLOWED_IMAGE_CONTENT_TYPES` in `.env`).
- For browser uploads/downloads with Docker on localhost, keep `MINIO_PUBLIC_ENDPOINT=localhost:9000` in `.env` so presigned URLs are externally reachable.
- SSE endpoint supports both `Authorization: Bearer <token>` and query token for browser `EventSource`.
- Frontend container is built as static assets served by Nginx; by default it proxies `/api/*` to the `api` service. Set `VITE_API_URL` in `.env` only when building against an external API host.

## Notes on offline runnability

- If Ultralytics YOLO is unavailable, `ml-service` automatically falls back to deterministic OpenCV contour-based suggestions.
- This keeps auto-label operational in restricted/offline environments.
