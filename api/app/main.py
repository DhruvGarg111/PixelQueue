from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.metrics import metrics_middleware
from app.services.minio_client import ensure_bucket


import httpx

settings = get_settings()
cors_origins = settings.cors_origins
allow_credentials = "*" not in cors_origins

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_bucket()
    app.state.oauth_http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )
    yield
    if hasattr(app.state, "oauth_http_client") and app.state.oauth_http_client:
        await app.state.oauth_http_client.aclose()

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter

app = FastAPI(title=settings.app_name, version="1.2.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.middleware("http")(metrics_middleware)

from app.core.csrf import CSRFMiddleware
app.add_middleware(CSRFMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


