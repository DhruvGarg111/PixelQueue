from datetime import datetime, timezone
from pathlib import Path
import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from minio.error import S3Error

from app.api.deps import get_current_user, require_project_role
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Image, ProjectRole, Task, TaskStatus, User
from app.schemas.image import (
    CommitUploadRequest,
    ImageResponse,
    PresignUploadRequest,
    PresignUploadResponse,
    TaskResponse,
)
from app.services.audit import write_audit_log
from app.services.events import publish_project_event
from app.services.minio_client import presign_get, presign_put, stat_object


router = APIRouter(prefix="/projects/{project_id}", tags=["images"])
settings = get_settings()
SAFE_FILE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")
ALLOWED_IMAGE_CONTENT_TYPES = {
    ctype.strip().lower()
    for ctype in settings.allowed_image_content_types.split(",")
    if ctype.strip()
}


def _sanitize_file_name(file_name: str) -> str:
    leaf = Path(file_name).name
    cleaned = SAFE_FILE_CHARS.sub("_", leaf)
    return cleaned[:128] if cleaned else "upload.bin"


@router.post("/images/presign-upload", response_model=PresignUploadResponse)
def presign_upload(
    project_id: UUID,
    payload: PresignUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PresignUploadResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    content_type = payload.content_type.lower().strip()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="only image uploads are allowed")
    if ALLOWED_IMAGE_CONTENT_TYPES and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="unsupported image content type")

    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    safe_name = _sanitize_file_name(payload.file_name)
    object_key = f"projects/{project_id}/images/{ts}-{current_user.id}-{safe_name}"
    url = presign_put(object_key, content_type)
    return PresignUploadResponse(object_key=object_key, upload_url=url, expires_in=settings.minio_presign_expiry_seconds)


@router.post("/images/commit-upload", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
def commit_upload(
    project_id: UUID,
    payload: CommitUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImageResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    if ".." in payload.object_key or payload.object_key.startswith("/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid object key")
    if not payload.object_key.startswith(f"projects/{project_id}/images/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid project object key")
    try:
        obj_stat = stat_object(payload.object_key)
    except S3Error as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="object not found in storage") from exc

    content_type = (obj_stat.content_type or "").lower().strip()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="object is not an image")
    if ALLOWED_IMAGE_CONTENT_TYPES and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="unsupported image content type")
    if int(obj_stat.size) > int(settings.max_image_bytes):
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="image exceeds max upload size")

    image = Image(
        project_id=project_id,
        object_key=payload.object_key,
        width=payload.width,
        height=payload.height,
        checksum=payload.checksum,
        uploaded_by=current_user.id,
    )
    db.add(image)
    db.flush()

    task = Task(
        project_id=project_id,
        image_id=image.id,
        status=TaskStatus.open,
        assigned_to=None,
    )
    db.add(task)
    db.flush()
    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project_id,
        entity_type="image",
        entity_id=image.id,
        action="image_committed",
        payload={"object_key": payload.object_key, "task_id": str(task.id)},
    )
    db.commit()
    db.refresh(image)
    publish_project_event(project_id, "image_committed", {"image_id": str(image.id), "task_id": str(task.id)})

    return ImageResponse(
        id=image.id,
        project_id=image.project_id,
        object_key=image.object_key,
        width=image.width,
        height=image.height,
        checksum=image.checksum,
        annotation_revision=image.annotation_revision,
        uploaded_by=image.uploaded_by,
        created_at=image.created_at,
        download_url=presign_get(image.object_key),
    )


@router.get("/tasks/next", response_model=TaskResponse)
def next_task(
    project_id: UUID,
    exclude_task_id: UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)

    query = (
        db.query(Task)
        .filter(
            Task.project_id == project_id,
            Task.status.in_([TaskStatus.open, TaskStatus.in_progress, TaskStatus.in_review]),
            or_(Task.assigned_to.is_(None), Task.assigned_to == current_user.id),
        )
    )
    if exclude_task_id:
        query = query.filter(Task.id != exclude_task_id)
    task = query.order_by(Task.updated_at.asc()).with_for_update(skip_locked=True).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no available task")

    if task.assigned_to is None:
        task.assigned_to = current_user.id
    if task.status == TaskStatus.open:
        task.status = TaskStatus.in_progress
    db.commit()
    db.refresh(task)

    image = db.get(Image, task.image_id)
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="image not found")

    return TaskResponse(
        id=task.id,
        project_id=task.project_id,
        image_id=task.image_id,
        status=task.status.value,
        assigned_to=task.assigned_to,
        created_at=task.created_at,
        updated_at=task.updated_at,
        image=ImageResponse(
            id=image.id,
            project_id=image.project_id,
            object_key=image.object_key,
            width=image.width,
            height=image.height,
            checksum=image.checksum,
            annotation_revision=image.annotation_revision,
            uploaded_by=image.uploaded_by,
            created_at=image.created_at,
            download_url=presign_get(image.object_key),
        ),
    )


@router.get("/images/{image_id}", response_model=ImageResponse)
def get_image(
    project_id: UUID,
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImageResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    image = db.get(Image, image_id)
    if not image or image.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="image not found")
    return ImageResponse(
        id=image.id,
        project_id=image.project_id,
        object_key=image.object_key,
        width=image.width,
        height=image.height,
        checksum=image.checksum,
        annotation_revision=image.annotation_revision,
        uploaded_by=image.uploaded_by,
        created_at=image.created_at,
        download_url=presign_get(image.object_key),
    )
