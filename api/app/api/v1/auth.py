import secrets
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import httpx

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    hash_password,
    normalize_email,
    validate_password_strength,
    verify_password,
)
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.services.auth_sessions import (
    AuthSessionError,
    create_auth_session,
    revoke_auth_session,
    validate_refresh_session,
)
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _build_token_response(access_token: str) -> TokenResponse:
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.access_token_ttl_seconds,
    )


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    cookie_kwargs = {
        "httponly": True,
        "secure": settings.auth_cookie_secure,
        "samesite": settings.auth_cookie_samesite,
        "domain": settings.auth_cookie_domain,
    }
    response.set_cookie(
        settings.access_token_cookie_name,
        access_token,
        max_age=settings.access_token_ttl_seconds,
        path=settings.access_token_cookie_path,
        **cookie_kwargs,
    )
    response.set_cookie(
        settings.refresh_token_cookie_name,
        refresh_token,
        max_age=settings.refresh_token_ttl_seconds,
        path=settings.refresh_token_cookie_path,
        **cookie_kwargs,
    )


def _clear_auth_cookies(response: Response) -> None:
    for cookie_name, path in [
        (settings.access_token_cookie_name, settings.access_token_cookie_path),
        (settings.refresh_token_cookie_name, settings.refresh_token_cookie_path),
    ]:
        response.delete_cookie(
            cookie_name,
            path=path,
            domain=settings.auth_cookie_domain,
            secure=settings.auth_cookie_secure,
            httponly=True,
            samesite=settings.auth_cookie_samesite,
        )


def _issue_session(response: Response, db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(str(user.id))
    _, refresh_token = create_auth_session(db, user)
    db.commit()
    _set_auth_cookies(response, access_token, refresh_token)
    return _build_token_response(access_token)


def _get_refresh_token(request: Request, payload: RefreshRequest | None) -> str | None:
    if payload and payload.refresh_token:
        return payload.refresh_token
    return request.cookies.get(settings.refresh_token_cookie_name)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    email = normalize_email(payload.email)
    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="full name is required")

    if db.query(User).filter(User.email == email).one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already registered")

    try:
        validate_password_strength(payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()
    return _issue_session(response, db, user)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = db.query(User).filter(User.email == normalize_email(payload.email)).one_or_none()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    return _issue_session(response, db, user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    payload: RefreshRequest | None = Body(default=None),
    db: Session = Depends(get_db),
) -> TokenResponse:
    refresh_token = _get_refresh_token(request, payload)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="refresh token required")

    try:
        user, session = validate_refresh_session(db, refresh_token)
        revoke_auth_session(session)
        access_token = create_access_token(str(user.id))
        _, rotated_refresh_token = create_auth_session(db, user)
        db.commit()
    except AuthSessionError as exc:
        db.rollback()
        _clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    _set_auth_cookies(response, access_token, rotated_refresh_token)
    return _build_token_response(access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    payload: RefreshRequest | None = Body(default=None),
    db: Session = Depends(get_db),
) -> None:
    refresh_token = _get_refresh_token(request, payload)
    if refresh_token:
        try:
            _, session = validate_refresh_session(db, refresh_token)
            revoke_auth_session(session)
            db.commit()
        except AuthSessionError:
            db.rollback()

    _clear_auth_cookies(response)


@router.get("/google/start")
def google_start():
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    response = RedirectResponse(url)

    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=settings.auth_cookie_domain,
        path="/",
    )

    return response

def oauth_error_redirect(error_code: str) -> RedirectResponse:
    redirect = RedirectResponse(
        url=f"{settings.frontend_url}/login?oauth_error={error_code}",
        status_code=302,
    )

    # clear oauth_state cookie
    redirect.delete_cookie(
        key="oauth_state",
        domain=settings.auth_cookie_domain,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
    )

    return redirect

@router.get("/google/callback")
def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        cookie_state = request.cookies.get("oauth_state")

        # 🔐 STATE VALIDATION
        if not state or not cookie_state or state != cookie_state:
            return oauth_error_redirect("invalid_state")

        if not code:
            return oauth_error_redirect("missing_code")

        # ---------------------------
        # TOKEN EXCHANGE
        # ---------------------------
        token_res = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=10.0,
        )

        if token_res.status_code != 200:
            return oauth_error_redirect("token_exchange_failed")

        token_data = token_res.json()
        access_token_google = token_data.get("access_token")

        if not access_token_google:
            return oauth_error_redirect("missing_access_token")

        # ---------------------------
        # USER INFO
        # ---------------------------
        user_info_res = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token_google}"},
            timeout=10.0,
        )

        if user_info_res.status_code != 200:
            return oauth_error_redirect("userinfo_failed")

        user_info = user_info_res.json()

        email_raw = user_info.get("email")
        google_sub = user_info.get("sub")
        email_verified = user_info.get("email_verified")

        if not email_raw or not google_sub:
            return oauth_error_redirect("invalid_google_response")

        if not email_verified:
            return oauth_error_redirect("email_not_verified")

        email = normalize_email(email_raw)

        # ---------------------------
        # USER RESOLUTION
        # ---------------------------
        user = db.query(User).filter(
            User.provider_subject == google_sub
        ).one_or_none()

        if not user:
            user = db.query(User).filter(
                User.email == email
            ).one_or_none()

            if user:
                user.provider_subject = google_sub
                user.auth_provider = "google"
                db.flush()
            else:
                user = User(
                    email=email,
                    full_name=user_info.get("name") or "Google User",
                    password_hash=None,
                    auth_provider="google",
                    provider_subject=google_sub,
                )
                db.add(user)
                db.flush()

        # ---------------------------
        # ISSUE SESSION
        # ---------------------------
        redirect_response = RedirectResponse(
            url=f"{settings.frontend_url}/projects",
            status_code=302,
        )

        _issue_session(redirect_response, db, user)

        redirect_response.delete_cookie(
            key="oauth_state",
            domain=settings.auth_cookie_domain,
            path="/",
            secure=settings.auth_cookie_secure,
            httponly=True,
            samesite=settings.auth_cookie_samesite,
        )

        return redirect_response

    except Exception as e:
        logger.exception("Google OAuth callback failed")
        db.rollback()
        return oauth_error_redirect("google_auth_failed")