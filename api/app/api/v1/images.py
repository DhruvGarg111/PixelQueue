from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

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
from app.services.minio_client import object_exists, presign_get, presign_put


router = APIRouter(prefix="/projects/{project_id}", tags=["images"])
settings = get_settings()


@router.post("/images/presign-upload", response_model=PresignUploadResponse)
def presign_upload(
    project_id: UUID,
    payload: PresignUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PresignUploadResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    safe_name = payload.file_name.replace(" ", "_")
    object_key = f"projects/{project_id}/images/{ts}-{current_user.id}-{safe_name}"
    url = presign_put(object_key, payload.content_type)
    return PresignUploadResponse(object_key=object_key, upload_url=url, expires_in=settings.minio_presign_expiry_seconds)


@router.post("/images/commit-upload", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
def commit_upload(
    project_id: UUID,
    payload: CommitUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImageResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    if not payload.object_key.startswith(f"projects/{project_id}/images/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid project object key")
    if not object_exists(payload.object_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="object not found in storage")

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)

    task = (
        db.query(Task)
        .filter(
            Task.project_id == project_id,
            Task.status.in_([TaskStatus.open, TaskStatus.in_progress, TaskStatus.in_review]),
            or_(Task.assigned_to.is_(None), Task.assigned_to == current_user.id),
        )
        .order_by(Task.updated_at.asc())
        .first()
    )
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

