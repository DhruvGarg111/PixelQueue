from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from jwt.exceptions import PyJWTError


def _settings():
    get_settings.cache_clear()
    return get_settings()


def test_access_token_roundtrip(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "unit-test-secret-not-a-placeholder")
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("APP_ENV", "test")
    _settings()
    token = create_access_token("user-1")
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "user-1"
    assert payload["type"] == "access"


def test_refresh_token_keeps_sid(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "unit-test-secret-not-a-placeholder")
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("APP_ENV", "test")
    _settings()
    token = create_refresh_token("user-1", "session-1")
    payload = decode_token(token, expected_type="refresh")
    assert payload["sid"] == "session-1"


def test_decode_rejects_bad_signature(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "unit-test-secret-not-a-placeholder")
    monkeypatch.setenv("JWT_ALGORITHM", "HS256")
    monkeypatch.setenv("APP_ENV", "test")
    _settings()
    token = create_access_token("user-1")
    broken = token[:-4] + ("abcd" if not token.endswith("abcd") else "wxyz")
    try:
        decode_token(broken, expected_type="access")
    except PyJWTError:
        return
    raise AssertionError("bad signature was accepted")
