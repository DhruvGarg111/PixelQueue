# Environment Variables Reference

This document provides a comprehensive reference of all configuration variables supported by PixelQueue. These variables are defined in your `.env` file at the root of the project.

---

## 🌐 General Configuration

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `APP_ENV` | ❌ | `development` | Environment mode (`development`, `production`, `testing`). Controls debug logs and strict error messages. |
| `LOG_LEVEL` | ❌ | `INFO` | Console log verbosity level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`). |

---

## 🐘 PostgreSQL Configuration

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `POSTGRES_USER` | ✅ | `vision` | The administrative username for the PostgreSQL database container. |
| `POSTGRES_PASSWORD` | ✅ | `vision` | The password associated with the PostgreSQL administrative user. |
| `POSTGRES_DB` | ✅ | `annotation_platform` | The name of the primary database instance created on startup. |
| `POSTGRES_PORT` | ❌ | `5432` | Host port mapped to the PostgreSQL service. |
| `DATABASE_URL` | ✅ | `postgresql+psycopg2://vision:vision@postgres:5432/annotation_platform` | Database DSN (Connection String) used by the SQLAlchemy engine. *Note: Change `postgres` to `localhost` when running the backend API bare-metal.* |

---

## 🟥 Redis & Celery Configuration

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `REDIS_PORT` | ❌ | `6379` | Host port mapped to the Redis service. |
| `REDIS_URL` | ✅ | `redis://redis:6379/0` | The primary Redis connection DSN. |
| `CELERY_BROKER_URL` | ✅ | `redis://redis:6379/0` | Redis broker connection DSN for dispatching Celery tasks. |
| `CELERY_RESULT_BACKEND` | ✅ | `redis://redis:6379/1` | Redis database DSN used by Celery to store task execution outcomes and metadata. |

---

## 🪣 MinIO Object Storage Configuration

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `MINIO_ROOT_USER` | ✅ | `minioadmin` | Root username for the MinIO console and client. |
| `MINIO_ROOT_PASSWORD` | ✅ | `minioadmin` | Root password for the MinIO console and client. |
| `MINIO_PORT` | ❌ | `9000` | Port used by the API client to upload/download files. |
| `MINIO_CONSOLE_PORT` | ❌ | `9001` | Port used to access the web console. |
| `MINIO_BUCKET` | ✅ | `annotation-artifacts` | The default S3 bucket created by `minio-init` to store uploaded image payloads and compiled ZIP files. |
| `MINIO_ENDPOINT` | ✅ | `minio:9000` | The S3 client connection endpoint *internally* within the Docker network. |
| `MINIO_PUBLIC_ENDPOINT` | ✅ | `localhost:9000` | The external S3 endpoint returned to the client browser for uploading/downloading objects. |
| `MINIO_ACCESS_KEY` | ✅ | `minioadmin` | Access key used by the backend API and Celery worker to communicate with MinIO. |
| `MINIO_SECRET_KEY` | ✅ | `minioadmin` | Secret key used by the backend API and Celery worker to communicate with MinIO. |
| `MINIO_SECURE` | ❌ | `false` | Set to `true` to force HTTPS/TLS secure communication with the S3 endpoints. |
| `MINIO_PRESIGN_EXPIRY_SECONDS` | ❌ | `900` | Pre-signed URL validity lifetime (in seconds) for client-side browser image reads/uploads. |

---

## 🖼️ Media & Upload Constraints

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `MAX_IMAGE_BYTES` | ❌ | `20971520` | Maximum file upload payload size allowed by the backend (default: 20MB). |
| `ALLOWED_IMAGE_CONTENT_TYPES` | ❌ | `image/png,image/jpeg,image/jpg,image/webp` | Comma-separated list of MIME types accepted by the upload endpoint. |

---

## 🔐 Auth & Security Configuration

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `JWT_SECRET_KEY` | ✅ | `replace-with-a-secure-random-value` | Strong random key used for cryptographic signature of session cookies and JWT payloads. *Must be updated in production.* |
| `JWT_ALGORITHM` | ❌ | `HS256` | The hashing algorithm used to encrypt the JWT structure. |
| `JWT_ACCESS_TOKEN_MINUTES` | ❌ | `30` | Access cookie validity lifetime (in minutes). |
| `JWT_REFRESH_TOKEN_MINUTES` | ❌ | `10080` | Refresh cookie validity lifetime (in minutes; default 7 days). |
| `ACCESS_TOKEN_COOKIE_NAME` | ❌ | `pixelqueue_access` | Cookie identifier name storing the access JWT. |
| `REFRESH_TOKEN_COOKIE_NAME` | ❌ | `pixelqueue_refresh` | Cookie identifier name storing the refresh JWT. |
| `ACCESS_TOKEN_COOKIE_PATH` | ❌ | `/api` | Cookie path restrictor for the access JWT. |
| `REFRESH_TOKEN_COOKIE_PATH` | ❌ | `/api/v1/auth` | Cookie path restrictor for the refresh JWT. |
| `AUTH_COOKIE_SECURE` | ❌ | `false` | Set to `true` in production to force cookies to be transmitted via HTTPS only. |
| `AUTH_COOKIE_SAMESITE` | ❌ | `lax` | Browser SameSite safety rule (`lax`, `strict`, `none`). |
| `AUTH_COOKIE_DOMAIN` | ❌ | — | Domain restrictor for session cookies (leave blank for local setup). |

---

## 🌐 Network Ports & CORS

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `API_PORT` | ❌ | `8000` | Port bound to the core FastAPI backend. |
| `ML_SERVICE_PORT` | ❌ | `8002` | Port bound to the YOLO inference service. |
| `FRONTEND_PORT` | ❌ | `5173` | Port bound to the Nginx server exposing the React SPA. |
| `VITE_API_URL` | ❌ | — | Optional API host URL injected into the built Vite app. (Leave empty to use base URL proxies). |
| `CORS_ORIGIN` | ✅ | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated client addresses allowed by backend CORS middleware. |
| `ML_SERVICE_URL` | ✅ | `http://ml-service:8002` | API backend connection URL to hit the ML service. |
| `DEFAULT_AUTO_LABEL_PROVIDER` | ❌ | `yolo_seg` | Default inference worker provider model (`yolo_seg`, `cv_fallback`). |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | Redirect back URL used by OAuth services. |

---

## 🔑 External Providers (Google OAuth)

| Variable | Required | Default Value | Description |
|---|:---:|---|---|
| `GOOGLE_CLIENT_ID` | ❌ | — | Google Cloud OAuth Client ID (obtained from GCP credentials panel). |
| `GOOGLE_CLIENT_SECRET` | ❌ | — | Google Cloud OAuth Client Secret credentials. |
| `GOOGLE_REDIRECT_URI` | ❌ | `http://localhost:8000/api/v1/auth/google/callback` | Callback endpoint configured inside the GCP Console for credentials authorization. |
