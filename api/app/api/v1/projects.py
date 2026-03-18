from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_project_role
from app.core.security import normalize_email
from app.db.session import get_db
from app.models import Project, ProjectMembership, ProjectRole, Task, TaskStatus, User
from app.schemas.image import TaskResponse
from app.schemas.project import (
    MembershipResponse,
    MembershipUpsertRequest,
    ProjectCreateRequest,
    ProjectResponse,
)
from app.services.audit import write_audit_log


router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectResponse:
    project = Project(name=payload.name, description=payload.description, created_by=current_user.id)
    db.add(project)
    db.flush()

    membership = ProjectMembership(user_id=current_user.id, project_id=project.id, role=ProjectRole.admin)
    db.add(membership)
    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project.id,
        entity_type="project",
        entity_id=project.id,
        action="project_created",
        payload={"name": payload.name},
    )
    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_by=project.created_by,
        created_at=project.created_at,
        my_role=membership.role.value,
    )


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProjectResponse]:
    if current_user.global_role.value == "admin":
        projects = db.query(Project).order_by(Project.created_at.desc()).all()
        membership_map = {
            m.project_id: m.role.value
            for m in db.query(ProjectMembership).filter(ProjectMembership.user_id == current_user.id).all()
        }
        return [
            ProjectResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                created_by=p.created_by,
                created_at=p.created_at,
                my_role=membership_map.get(p.id, "admin"),
            )
            for p in projects
        ]

    rows = (
        db.query(Project, ProjectMembership)
        .join(ProjectMembership, ProjectMembership.project_id == Project.id)
        .filter(ProjectMembership.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            created_by=project.created_by,
            created_at=project.created_at,
            my_role=membership.role.value,
        )
        for project, membership in rows
    ]


@router.get("/{project_id}/members", response_model=list[MembershipResponse])
def list_members(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MembershipResponse]:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    rows = (
        db.query(ProjectMembership, User)
        .join(User, User.id == ProjectMembership.user_id)
        .filter(ProjectMembership.project_id == project_id)
        .order_by(ProjectMembership.created_at.asc())
        .all()
    )
    return [
        MembershipResponse(
            id=membership.id,
            user_id=membership.user_id,
            project_id=membership.project_id,
            role=membership.role.value,
            created_at=membership.created_at,
            email=user.email,
            full_name=user.full_name,
            global_role=user.global_role.value,
        )
        for membership, user in rows
    ]


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_project_role(db, current_user, project_id, min_role=ProjectRole.admin)

    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="project not found")

    db.delete(project)

    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project_id,
        entity_type="project",
        entity_id=project_id,
        action="project_deleted",
        payload={"name": project.name},
    )
    db.commit()
    return None


@router.post("/{project_id}/members", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def upsert_membership(
    project_id: UUID,
    payload: MembershipUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MembershipResponse:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.admin)

    user = None
    if payload.user_id:
        user = db.get(User, payload.user_id)
    elif payload.email:
        user = (
            db.query(User)
            .filter(func.lower(User.email) == normalize_email(payload.email))
            .one_or_none()
        )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    try:
        target_role = ProjectRole(payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid project role") from exc

    membership = (
        db.query(ProjectMembership)
        .filter(
            and_(
                ProjectMembership.user_id == user.id,
                ProjectMembership.project_id == project_id,
            )
        )
        .one_or_none()
    )
    if membership and membership.role == ProjectRole.admin and target_role != ProjectRole.admin:
        admin_count = (
            db.query(ProjectMembership)
            .filter(
                ProjectMembership.project_id == project_id,
                ProjectMembership.role == ProjectRole.admin,
            )
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project must retain at least one admin",
            )
    if membership:
        membership.role = target_role
    else:
        membership = ProjectMembership(user_id=user.id, project_id=project_id, role=target_role)
        db.add(membership)
    db.flush()

    write_audit_log(
        db,
        actor_id=current_user.id,
        project_id=project_id,
        entity_type="project_membership",
        entity_id=membership.id,
        action="membership_upserted",
        payload={"user_id": str(user.id), "role": target_role.value},
    )

    db.commit()
    db.refresh(membership)
    return MembershipResponse(
        id=membership.id,
        user_id=membership.user_id,
        project_id=membership.project_id,
        role=membership.role.value,
        created_at=membership.created_at,
        email=user.email,
        full_name=user.full_name,
        global_role=user.global_role.value,
    )


@router.get("/{project_id}/tasks", response_model=list[TaskResponse])
def list_tasks(
    project_id: UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskResponse]:
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    query = db.query(Task).filter(Task.project_id == project_id)
    if status_filter:
        try:
            parsed_status = TaskStatus(status_filter)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid task status") from exc
        query = query.filter(Task.status == parsed_status)
    tasks = query.order_by(Task.updated_at.desc()).limit(200).all()
    return [
        TaskResponse(
            id=t.id,
            project_id=t.project_id,
            image_id=t.image_id,
            status=t.status.value,
            assigned_to=t.assigned_to,
            created_at=t.created_at,
            updated_at=t.updated_at,
            image=None,
        )
        for t in tasks
    ]
