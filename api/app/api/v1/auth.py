from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

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
    if not user or not verify_password(payload.password, user.password_hash):
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


