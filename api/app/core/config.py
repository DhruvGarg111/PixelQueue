from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False
    minio_bucket: str = "annotation-artifacts"
    minio_presign_expiry_seconds: int = 900

    jwt_secret_key: str = "change-me-super-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 30
    jwt_refresh_token_minutes: int = 60 * 24 * 7

    ml_service_url: str = "http://ml-service:8002"
    default_auto_label_provider: str = "yolo_seg"

    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"


@lru_cache
def get_settings() -> Settings:
    return Settings()

