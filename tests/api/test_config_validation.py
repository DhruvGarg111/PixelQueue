import pytest
from pydantic import ValidationError
from app.core.config import Settings

def test_production_validators_for_minio_secrets():
    # In development environment, default minio secrets are allowed
    settings_dev = Settings(
        app_env="development",
        minio_access_key="minioadmin",
        minio_secret_key="minioadmin"
    )
    assert settings_dev.minio_access_key == "minioadmin"
    assert settings_dev.minio_secret_key == "minioadmin"

    # In production environment, default minio secrets must raise ValidationError
    with pytest.raises(ValidationError) as excinfo:
        Settings(
            app_env="production",
            minio_access_key="minioadmin",
            minio_secret_key="minioadmin",
            jwt_secret_key="a-random-secure-jwt-secret-key-123456789",
            auth_cookie_secure=True,
            cors_origin="http://example.com"
        )
    assert "MINIO_SECRET_KEY" in str(excinfo.value) or "MINIO_ACCESS_KEY" in str(excinfo.value)

    # In production environment, valid keys should work
    settings_prod = Settings(
        app_env="production",
        minio_access_key="secureaccesskey",
        minio_secret_key="securesecretkey",
        jwt_secret_key="a-random-secure-jwt-secret-key-123456789",
        auth_cookie_secure=True,
        cors_origin="http://example.com"
    )
    assert settings_prod.minio_access_key == "secureaccesskey"
    assert settings_prod.minio_secret_key == "securesecretkey"
