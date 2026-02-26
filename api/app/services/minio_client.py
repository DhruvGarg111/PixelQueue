import io
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings


settings = get_settings()


def _build_minio_client(endpoint: str) -> Minio:
    return Minio(
        endpoint=endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
        region=settings.minio_region,
    )

minio_client = _build_minio_client(settings.minio_endpoint)
_public_endpoint = (settings.minio_public_endpoint or "").strip()
presign_client = _build_minio_client(_public_endpoint) if _public_endpoint else minio_client


def ensure_bucket() -> None:
    found = minio_client.bucket_exists(settings.minio_bucket)
    if not found:
        minio_client.make_bucket(settings.minio_bucket)


def presign_put(object_key: str, _content_type: str) -> str:
    return presign_client.presigned_put_object(
        settings.minio_bucket,
        object_key,
        expires=timedelta(seconds=settings.minio_presign_expiry_seconds),
    )


def presign_get(object_key: str) -> str:
    return presign_client.presigned_get_object(
        settings.minio_bucket,
        object_key,
        expires=timedelta(seconds=settings.minio_presign_expiry_seconds),
    )


def object_exists(object_key: str) -> bool:
    try:
        minio_client.stat_object(settings.minio_bucket, object_key)
        return True
    except S3Error:
        return False


def stat_object(object_key: str):
    return minio_client.stat_object(settings.minio_bucket, object_key)


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
