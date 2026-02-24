from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_project_role
from app.db.session import get_db
from app.models import ExportFormat, ExportJob, JobStatus, ProjectRole, User
from app.schemas.jobs import ExportCreateRequest, ExportJobResponse
from app.services.audit import write_audit_log
from app.services.celery_app import celery_app
from app.services.events import publish_project_event
from app.services.minio_client import presign_get


router = APIRouter(tags=["exports"])


def _to_response(job: ExportJob) -> ExportJobResponse:
    return ExportJobResponse(
        id=job.id,
        project_id=job.project_id,
        format=job.format.value,
        status=job.status.value,
        object_key=job.object_key,
        summary_jsonb=job.summary_jsonb,
        error_text=job.error_text,
        created_at=job.created_at,
        finished_at=job.finished_at,
        download_url=presign_get(job.object_key) if job.object_key else None,
    )


@router.post("/projects/{project_id}/exports", response_model=ExportJobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_export(
    project_id: UUID,
    payload: ExportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExportJobResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.reviewer)
    try:
        export_format = ExportFormat(payload.format)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid export format") from exc

    job = ExportJob(project_id=project_id, format=export_format, status=JobStatus.queued, summary_jsonb={})
    db.add(job)
    db.flush()
    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project_id,
        entity_type="export_job",
        entity_id=job.id,
        action="export_queued",
        payload={"format": export_format.value},
    )
    db.commit()
    db.refresh(job)

    celery_app.send_task("worker.tasks.export_dataset", args=[str(job.id)])
    publish_project_event(project_id, "export_queued", {"export_id": str(job.id), "format": export_format.value})
    return _to_response(job)


@router.get("/projects/{project_id}/exports", response_model=list[ExportJobResponse])
def list_exports(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ExportJobResponse]:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    rows = (
        db.query(ExportJob)
        .filter(ExportJob.project_id == project_id)
        .order_by(ExportJob.created_at.desc())
        .limit(100)
        .all()
    )
    return [_to_response(r) for r in rows]


@router.get("/exports/{export_id}", response_model=ExportJobResponse)
def get_export(
    export_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExportJobResponse:
    job = db.get(ExportJob, export_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="export job not found")
    require_project_role(db, current_user, job.project_id, min_role=ProjectRole.annotator)
    return _to_response(job)
