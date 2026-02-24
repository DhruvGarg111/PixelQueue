from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _make_token(subject: str, token_type: Literal["access", "refresh"], expires_minutes: int) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    return _make_token(subject, "access", settings.jwt_access_token_minutes)


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    return _make_token(subject, "refresh", settings.jwt_refresh_token_minutes)


def decode_token(token: str, expected_type: Literal["access", "refresh"] | None = None) -> dict[str, Any]:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise JWTError("invalid token type")
    return payload

