from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models import ProjectMembership, ProjectRole, User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


ROLE_ORDER = {
    "annotator": 1,
    "reviewer": 2,
    "admin": 3,
}


def _auth_error() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid authentication credentials")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token, expected_type="access")
        subject = payload.get("sub")
    except JWTError as exc:
        raise _auth_error() from exc
    if not subject:
        raise _auth_error()

    user = db.get(User, subject)
    if not user:
        raise _auth_error()
    return user


def require_global_roles(*allowed_roles: str) -> Callable[[User], User]:
    allowed = set(allowed_roles)

    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if current_user.global_role.value not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
        return current_user

    return _dep


def get_project_membership(
    db: Session,
    user_id: UUID,
    project_id: UUID,
) -> ProjectMembership | None:
    return (
        db.query(ProjectMembership)
        .filter(ProjectMembership.user_id == user_id, ProjectMembership.project_id == project_id)
        .one_or_none()
    )


def require_project_role(
    db: Session,
    current_user: User,
    project_id: UUID,
    min_role: ProjectRole = ProjectRole.annotator,
) -> ProjectMembership | None:
    if current_user.global_role.value == "admin":
        return None
    membership = get_project_membership(db, current_user.id, project_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="project membership required")
    if ROLE_ORDER[membership.role.value] < ROLE_ORDER[min_role.value]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="insufficient project role")
    return membership

