from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PLACEHOLDER_JWT_SECRETS = {
    "",
    "change-me-super-secret-key",
    "replace-with-a-secure-random-value",
    "changeme",
    "secret",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Collaborative AI Annotation Platform API"
    app_env: str = "development"
    log_level: str = "INFO"

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origin: str = "*"

    database_url: str = "postgresql+psycopg2://vision:vision@postgres:5432/annotation_platform"
    redis_url: str = "redis://redis:6379/0"

    minio_endpoint: str = "minio:9000"
    minio_public_endpoint: str | None = None
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False
    minio_region: str = "us-east-1"
    minio_bucket: str = "annotation-artifacts"
    minio_presign_expiry_seconds: int = 900
    max_image_bytes: int = 20 * 1024 * 1024
    allowed_image_content_types: str = "image/png,image/jpeg,image/jpg,image/webp"

    jwt_secret_key: str = "change-me-super-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 30
    jwt_refresh_token_minutes: int = 60 * 24 * 7
    access_token_cookie_name: str = "pixelqueue_access"
    refresh_token_cookie_name: str = "pixelqueue_refresh"
    access_token_cookie_path: str = "/api"
    refresh_token_cookie_path: str = "/api/v1/auth"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    auth_cookie_domain: str | None = None

    ml_service_url: str = "http://ml-service:8002"
    default_auto_label_provider: str = "yolo_seg"

    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() == "production"

    @property
    def access_token_ttl_seconds(self) -> int:
        return self.jwt_access_token_minutes * 60

    @property
    def refresh_token_ttl_seconds(self) -> int:
        return self.jwt_refresh_token_minutes * 60

    @property
    def cors_origins(self) -> list[str]:
        if self.cors_origin.strip() == "*":
            return ["*"]
        return [item.strip() for item in self.cors_origin.split(",") if item.strip()]

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if self.auth_cookie_samesite == "none" and not self.auth_cookie_secure:
            raise ValueError("SameSite=None cookies require AUTH_COOKIE_SECURE=true")

        if self.is_production:
            if self.jwt_secret_key.strip() in PLACEHOLDER_JWT_SECRETS:
                raise ValueError("JWT_SECRET_KEY must be changed before running in production")
            if not self.auth_cookie_secure:
                raise ValueError("AUTH_COOKIE_SECURE must be true in production")
            if self.cors_origin.strip() == "*":
                raise ValueError("CORS_ORIGIN cannot be '*' in production")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
