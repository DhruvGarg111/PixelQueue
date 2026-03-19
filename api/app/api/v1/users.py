from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import normalize_email
from app.db.session import get_db
from app.models import ProjectMembership, User
from app.schemas.auth import MeResponse, MembershipView, UserLookupResponse


router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/me", response_model=MeResponse)
def me_alias(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeResponse:
    memberships = (
        db.query(ProjectMembership)
        .filter(ProjectMembership.user_id == current_user.id)
        .all()
    )
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        global_role=current_user.global_role.value,
        created_at=current_user.created_at,
        memberships=[MembershipView(project_id=m.project_id, role=m.role.value) for m in memberships],
    )


@router.get("/users", response_model=list[UserLookupResponse])
def search_users(
    query: str = Query(default="", min_length=0, max_length=255),
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserLookupResponse]:
    q = query.strip()
    if not q:
        return []

    normalized = normalize_email(q)
    rows = (
        db.query(User)
        .filter(
            or_(
                User.email.ilike(f"%{normalized}%"),
                User.full_name.ilike(f"%{q}%"),
            )
        )
        .order_by(User.created_at.asc())
        .limit(8)
        .all()
    )
    return [
        UserLookupResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            global_role=user.global_role.value,
        )
        for user in rows
    ]

