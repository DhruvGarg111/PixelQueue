import socket
import logging
from urllib.parse import urlparse
from fastapi import Request
from slowapi import Limiter
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def get_remote_address_proxy_aware(request: Request) -> str:
    """Extracts client IP address, respecting reverse proxies (X-Forwarded-For)"""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"


storage_uri = "memory://"

if settings.app_env.strip().lower() != "test" and settings.redis_url:
    try:
        parsed = urlparse(settings.redis_url)
        if parsed.hostname:
            # Check if redis host can be resolved
            socket.gethostbyname(parsed.hostname)
            storage_uri = settings.redis_url
    except (socket.gaierror, ValueError):
        # Gracefully fallback to memory storage if Redis host cannot be resolved
        pass

# Instantiate Limiter with native error swallowing and in-memory fallback
limiter = Limiter(
    key_func=get_remote_address_proxy_aware,
    storage_uri=storage_uri,
    swallow_errors=True,
    in_memory_fallback_enabled=True,
)
