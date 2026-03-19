from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models import ProjectMembership, ProjectRole, User


bearer_scheme = HTTPBearer(auto_error=False)


ROLE_ORDER = {
    "annotator": 1,
    "reviewer": 2,
    "admin": 3,
}


def _auth_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_access_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        return credentials.credentials

    cookie_name = get_settings().access_token_cookie_name
    cookie_token = request.cookies.get(cookie_name)
    if cookie_token:
        return cookie_token

    raise _auth_error()


def get_current_user(
    token: str = Depends(get_access_token),
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

