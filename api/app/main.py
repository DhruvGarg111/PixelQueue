from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.metrics import metrics_middleware
from app.services.minio_client import ensure_bucket


settings = get_settings()
cors_origins = settings.cors_origins
allow_credentials = "*" not in cors_origins

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_bucket()
    yield

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.middleware("http")(metrics_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


