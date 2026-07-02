import secrets
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import get_settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/google/start",
    "/api/v1/auth/google/callback",
}


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = get_settings()

        # Skip check for safe methods
        if request.method in SAFE_METHODS:
            response = await call_next(request)
            return self._ensure_csrf_cookie(request, response, settings)

        # Skip check for exempt endpoints
        if request.url.path in CSRF_EXEMPT_PATHS:
            response = await call_next(request)
            return self._ensure_csrf_cookie(request, response, settings)

        # Only enforce when cookie auth is in use (not Bearer)
        auth_header = request.headers.get("authorization", "")
        access_cookie = request.cookies.get(settings.access_token_cookie_name)

        if access_cookie and not auth_header.lower().startswith("bearer "):
            csrf_cookie = request.cookies.get("csrf_token")
            csrf_header = request.headers.get("x-csrf-token")

            if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
                return Response(
                    content='{"detail":"CSRF validation failed"}',
                    status_code=403,
                    media_type="application/json",
                )

        response = await call_next(request)
        return self._ensure_csrf_cookie(request, response, settings)

    def _ensure_csrf_cookie(self, request, response, settings) -> Response:
        if "csrf_token" not in request.cookies:
            csrf_token = secrets.token_urlsafe(32)
            response.set_cookie(
                key="csrf_token",
                value=csrf_token,
                httponly=False,  # MUST be readable by JavaScript
                secure=settings.auth_cookie_secure,
                samesite=settings.auth_cookie_samesite,
                domain=settings.auth_cookie_domain,
                path="/",
                max_age=settings.refresh_token_ttl_seconds,
            )
        return response
