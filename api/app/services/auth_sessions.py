from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_refresh_token, decode_token, hash_token
from app.models import AuthSession, User


class AuthSessionError(Exception):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_auth_session(db: Session, user: User) -> tuple[AuthSession, str]:
    settings = get_settings()
    # ⚡ Bolt Optimization: Generate UUID upfront to avoid db.flush() overhead
    session = AuthSession(
        id=uuid4(),
        user_id=user.id,
        refresh_token_hash="",
        expires_at=_now() + timedelta(minutes=settings.jwt_refresh_token_minutes),
        last_used_at=_now(),
    )
    db.add(session)

    refresh_token = create_refresh_token(str(user.id), str(session.id))
    session.refresh_token_hash = hash_token(refresh_token)
    return session, refresh_token


def validate_refresh_session(db: Session, refresh_token: str) -> tuple[User, AuthSession]:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except Exception as exc:  # noqa: BLE001
        raise AuthSessionError("invalid refresh token") from exc

    session_id = payload.get("sid")
    user_id = payload.get("sub")
    if not session_id or not user_id:
        raise AuthSessionError("invalid refresh token")

    session = db.get(AuthSession, session_id)
    if not session or str(session.user_id) != str(user_id):
        raise AuthSessionError("invalid refresh token")
    if session.revoked_at is not None:
        raise AuthSessionError("refresh session revoked")
    if session.expires_at <= _now():
        raise AuthSessionError("refresh session expired")
    if session.refresh_token_hash != hash_token(refresh_token):
        raise AuthSessionError("invalid refresh token")

    user = db.get(User, user_id)
    if not user:
        raise AuthSessionError("user not found")

    session.last_used_at = _now()
    return user, session


def revoke_auth_session(session: AuthSession) -> None:
    now = _now()
    session.last_used_at = now
    if session.revoked_at is None:
        session.revoked_at = now
