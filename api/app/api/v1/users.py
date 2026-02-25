from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import ProjectMembership, User
from app.schemas.auth import MeResponse, MembershipView


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

