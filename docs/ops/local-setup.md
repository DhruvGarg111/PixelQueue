# Local Setup & Getting Started Guide

This guide describes how to bootstrap the PixelQueue development environment. You can run the entire system using Docker Compose, or run individual services on your host machine (bare metal) for faster feedback loops.

---

## 📋 Prerequisites

Ensure the following tools are installed on your workstation:

| Tool | Recommended Version | Purpose |
|---|---|---|
| **Docker** | `24.0.0+` | Container runtime |
| **Docker Compose** | `v2.20.0+` | Service orchestration |
| **Node.js** | `v20.x` (LTS) | Frontend development |
| **Python** | `3.11` or `3.12` | Backend, Worker, and ML development |
| **Git** | `2.40.0+` | Version control |

---

## 🐳 Running with Docker Compose (Recommended)

Docker Compose orchestrates all 7 services (app + infra) with automatic dependency health checks and DB migrations.

### Step 1: Clone the Repository
```bash
git clone https://github.com/DhruvGarg111/PixelQueue.git
cd PixelQueue
```

### Step 2: Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```
*(On Windows PowerShell, use `copy .env.example .env`)*

By default, the `.env.example` file contains pre-configured settings for running inside the Docker network. You do not need to modify it for standard local development unless configuring optional features like Google OAuth.

### Step 3: Start the Containers
Run Docker Compose in detached mode to compile and start all services:
```bash
docker compose up -d --build
```
This command performs the following sequence:
1. Boots `postgres` and `redis` first.
2. Initialises `minio` and runs `minio-init` to provision the `annotation-artifacts` bucket.
3. Once postgres/redis are healthy and minio-init completes successfully, boots the `api` (which automatically executes `alembic upgrade head` to run migrations), the `worker`, and the `ml-service`.
4. Boots the `frontend` container (Nginx serving the built assets).

### Step 4: Seed Initial Data
Run the bootstrap profile to run the DB seeding script. This registers the default ML model and provisions admin, reviewer, and annotator accounts:
```bash
docker compose --profile tools run --rm bootstrap
```

### Step 5: Verify Telemetry & Port Bindings

Once the services are active, check their availability using the following local addresses:

- **Frontend Interface**: [http://localhost:5173](http://localhost:5173) (Interactive UI)
- **FastAPI API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (OpenAPI manual)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (Credentials: `minioadmin` / `minioadmin`)
- **Celery Flower Panel**: [http://localhost:5555](http://localhost:5555) (Task worker analytics dashboard - if mapped)

---

## 💻 Bare-Metal Setup (For Active Development)

Running services directly on your host machine is faster for development as it supports live-reload without rebuilding Docker images. 

We recommend running infrastructure (`postgres`, `redis`, `minio`) in Docker, while running the application services (`api`, `ml-service`, `worker`, `frontend`) locally.

### Step 1: Run Infrastructure Containers
Shutdown any fully-packaged compose setup, and start only the data stores:
```bash
docker compose down
docker compose up -d postgres redis minio minio-init
```

### Step 2: Set Up the Backend API
Navigate to `/api`, create a virtual environment, and install dependencies:
```bash
cd api
python -m venv venv
# Activate on Unix/macOS:
source venv/bin/activate
# Activate on Windows:
.\venv\Scripts\activate

pip install -r requirements.txt
```

Run migrations manually:
```bash
alembic upgrade head
```

Start the FastAPI development server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Set Up the Celery Worker
Navigate to the root directory (where `worker_tasks.py` resides), activate the virtual environment, and install worker dependencies:
```bash
cd ..
pip install -r worker/requirements.txt
```

Start the Celery worker daemon:
```bash
# Unix/macOS:
celery -A worker.worker_tasks worker --loglevel=info
# Windows (requires gevent execution pool):
pip install gevent
celery -A worker.worker_tasks worker --loglevel=info -P gevent
```

### Step 4: Set Up the ML Inference Service
Open a new terminal session, navigate to `/ml-service`, set up its environment:
```bash
cd ml-service
python -m venv venv
# Activate virtualenv:
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Unix

pip install -r requirements.txt
```
Start the ML FastAPI server on port 8002:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

### Step 5: Set Up the React Frontend
Open a new terminal, navigate to `/frontend`, install packages and run Vite:
```bash
cd frontend
npm install
npm run dev
```
The application will run at [http://localhost:5173](http://localhost:5173) and proxy backend requests to [http://localhost:8000](http://localhost:8000).

---

## 🔧 Troubleshooting & Common Failure States

### 1. Database Connection Failures
* **Symptom**: API logs show `psycopg2.OperationalError: connection to server at "postgres" failed`.
* **Fix**: If running bare-metal, the connection string in `.env` must target `localhost` instead of the internal docker network host name `postgres`:
  ```env
  DATABASE_URL=postgresql+psycopg2://vision:vision@localhost:5432/annotation_platform
  ```

### 2. MinIO Pre-signed URLs Fail to Load
* **Symptom**: Images do not display in the annotation canvas; console shows `ERR_CONNECTION_REFUSED` targeting `http://minio:9000/...`.
* **Fix**: Ensure your `MINIO_PUBLIC_ENDPOINT` env variable is set to `localhost:9000` so that your browser connects to host port 9000 instead of attempting to resolve the container name `minio`.

### 3. Port Collisions
* **Symptom**: Docker logs show `port is already allocated` errors for port `5432`, `6379`, or `9000`.
* **Fix**: Shut down any local instances of PostgreSQL, Redis, or MinIO servers running natively on your host machine before starting Docker Compose.
