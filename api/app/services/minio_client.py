import io
from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings


settings = get_settings()

minio_client = Minio(
    endpoint=settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_secure,
)


def ensure_bucket() -> None:
    found = minio_client.bucket_exists(settings.minio_bucket)
    if not found:
        minio_client.make_bucket(settings.minio_bucket)


def presign_put(object_key: str, content_type: str) -> str:
    return minio_client.presigned_put_object(
        settings.minio_bucket,
        object_key,
        expires=settings.minio_presign_expiry_seconds,
    )


def presign_get(object_key: str) -> str:
    return minio_client.presigned_get_object(
        settings.minio_bucket,
        object_key,
        expires=settings.minio_presign_expiry_seconds,
    )


def object_exists(object_key: str) -> bool:
    try:
        minio_client.stat_object(settings.minio_bucket, object_key)
        return True
    except S3Error:
        return False


def get_object_bytes(object_key: str) -> bytes:
    response = minio_client.get_object(settings.minio_bucket, object_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def put_bytes(object_key: str, payload: bytes, content_type: str = "application/octet-stream") -> None:
    data = io.BytesIO(payload)
    minio_client.put_object(
        settings.minio_bucket,
        object_key,
        data,
        length=len(payload),
        content_type=content_type,
    )

