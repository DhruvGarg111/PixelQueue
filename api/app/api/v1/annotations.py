from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_project_role
from app.db.session import get_db
from app.models import (
    Annotation,
    AnnotationSource,
    AnnotationStatus,
    AnnotationVersion,
    AutoLabelJob,
    JobStatus,
    MLModel,
    ProjectRole,
    ReviewAction,
    Task,
    TaskStatus,
    User,
)
from app.schemas.annotation import AnnotationBundleResponse, AnnotationSaveRequest, AnnotationView, ReviewRequest
from app.schemas.jobs import AutoLabelCreateResponse
from app.services.audit import write_audit_log
from app.services.celery_app import celery_app
from app.services.events import publish_project_event


router = APIRouter(tags=["annotations"])


def annotation_to_view(row: Annotation) -> AnnotationView:
    return AnnotationView(
        id=row.id,
        project_id=row.project_id,
        image_id=row.image_id,
        label=row.label,
        geometry=row.geometry_jsonb,
        source=row.source.value,
        status=row.status.value,
        confidence=row.confidence,
        revision=row.revision,
        created_by=row.created_by,
        updated_by=row.updated_by,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/images/{image_id}/annotations", response_model=AnnotationBundleResponse)
def get_annotations(
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnnotationBundleResponse:
    image = db.execute("SELECT id, project_id, annotation_revision FROM images WHERE id = :image_id", {"image_id": str(image_id)}).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="image not found")

    project_id = image.project_id
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)

    annotations = (
        db.query(Annotation)
        .filter(Annotation.image_id == image_id)
        .order_by(Annotation.created_at.asc())
        .all()
    )
    task = db.query(Task).filter(Task.image_id == image_id).one_or_none()
    return AnnotationBundleResponse(
        image_id=image_id,
        revision=image.annotation_revision,
        task_status=task.status.value if task else None,
        annotations=[annotation_to_view(a) for a in annotations],
    )


@router.put("/images/{image_id}/annotations", response_model=AnnotationBundleResponse)
def save_annotations(
    image_id: UUID,
    payload: AnnotationSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnnotationBundleResponse:
    image_row = db.execute(
        "SELECT id, project_id, annotation_revision FROM images WHERE id = :image_id FOR UPDATE",
        {"image_id": str(image_id)},
    ).first()
    if not image_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="image not found")

    project_id = image_row.project_id
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)

    current_revision = int(image_row.annotation_revision)
    if payload.expected_revision != current_revision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "revision mismatch", "current_revision": current_revision},
        )

    new_revision = current_revision + 1

    # Replace current revision set. Historical data stays in annotation_versions.
    db.query(Annotation).filter(Annotation.image_id == image_id).delete(synchronize_session=False)
    inserted: list[Annotation] = []
    for item in payload.annotations:
        annotation = Annotation(
            project_id=project_id,
            image_id=image_id,
            label=item.label,
            geometry_jsonb=item.geometry.model_dump(mode="json"),
            source=AnnotationSource(item.source),
            status=AnnotationStatus(item.status),
            confidence=item.confidence,
            created_by=current_user.id,
            updated_by=current_user.id,
            revision=new_revision,
        )
        db.add(annotation)
        db.flush()
        db.add(
            AnnotationVersion(
                annotation_id=annotation.id,
                revision=new_revision,
                geometry_jsonb=annotation.geometry_jsonb,
                label=annotation.label,
                source=annotation.source.value,
                status=annotation.status.value,
                changed_by=current_user.id,
            )
        )
        inserted.append(annotation)

    db.execute(
        "UPDATE images SET annotation_revision = :revision WHERE id = :image_id",
        {"revision": new_revision, "image_id": str(image_id)},
    )
    task = db.query(Task).filter(Task.image_id == image_id).one_or_none()
    if task:
        task.status = TaskStatus.in_review
        if task.assigned_to is None:
            task.assigned_to = current_user.id

    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project_id,
        entity_type="annotation_bundle",
        entity_id=image_id,
        action="annotations_saved",
        payload={"revision": new_revision, "count": len(inserted)},
    )
    db.commit()
    publish_project_event(project_id, "annotations_saved", {"image_id": str(image_id), "revision": new_revision, "count": len(inserted)})

    return AnnotationBundleResponse(
        image_id=image_id,
        revision=new_revision,
        task_status=task.status.value if task else None,
        annotations=[annotation_to_view(x) for x in inserted],
    )


@router.post("/images/{image_id}/auto-label", response_model=AutoLabelCreateResponse, status_code=status.HTTP_202_ACCEPTED)
def trigger_auto_label(
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AutoLabelCreateResponse:
    image_row = db.execute("SELECT id, project_id FROM images WHERE id = :image_id", {"image_id": str(image_id)}).first()
    if not image_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="image not found")
    project_id = image_row.project_id
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)

    model = db.query(MLModel).filter(MLModel.is_active.is_(True)).order_by(MLModel.created_at.desc()).first()
    job = AutoLabelJob(
        project_id=project_id,
        image_id=image_id,
        model_id=model.id if model else None,
        status=JobStatus.queued,
        result_jsonb={},
    )
    db.add(job)
    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project_id,
        entity_type="auto_label_job",
        entity_id=job.id,
        action="auto_label_queued",
        payload={"image_id": str(image_id)},
    )
    db.commit()
    db.refresh(job)

    celery_app.send_task("worker.tasks.auto_label_image", args=[str(job.id)])
    publish_project_event(project_id, "auto_label_queued", {"job_id": str(job.id), "image_id": str(image_id)})
    return AutoLabelCreateResponse(job_id=job.id, status=job.status.value)


@router.post("/annotations/{annotation_id}/review", response_model=AnnotationView)
def review_annotation(
    annotation_id: UUID,
    payload: ReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnnotationView:
    annotation = db.get(Annotation, annotation_id)
    if not annotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="annotation not found")

    require_project_role(db, current_user, annotation.project_id, min_role=ProjectRole.reviewer)
    annotation.status = AnnotationStatus.approved if payload.action == "approve" else AnnotationStatus.rejected
    annotation.updated_by = current_user.id
    db.add(
        ReviewAction(
            annotation_id=annotation.id,
            reviewer_id=current_user.id,
            action=payload.action,
            comment=payload.comment,
        )
    )

    task = db.query(Task).filter(Task.image_id == annotation.image_id).one_or_none()
    if task:
        image_annotations = db.query(Annotation).filter(Annotation.image_id == annotation.image_id).all()
        if image_annotations and all(a.status == AnnotationStatus.approved for a in image_annotations):
            task.status = TaskStatus.done
        else:
            task.status = TaskStatus.in_review

    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=annotation.project_id,
        entity_type="annotation",
        entity_id=annotation.id,
        action=f"annotation_{payload.action}",
        payload={"comment": payload.comment},
    )
    db.commit()
    db.refresh(annotation)
    publish_project_event(annotation.project_id, "annotation_reviewed", {"annotation_id": str(annotation.id), "action": payload.action})
    return annotation_to_view(annotation)

