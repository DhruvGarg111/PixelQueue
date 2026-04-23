from __future__ import annotations

import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "api"
if str(API_ROOT) not in sys.path:
    sys.path.append(str(API_ROOT))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models import GlobalRole, MLModel, Project, ProjectMembership, ProjectRole, User  # noqa: E402


def ensure_user(db, email: str, full_name: str, password: str, global_role: GlobalRole) -> User:
    existing = db.query(User).filter(User.email == email).one_or_none()
    if existing:
        return existing
    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        global_role=global_role,
    )
    db.add(user)
    db.flush()
    return user


def main() -> None:
    db = SessionLocal()
    try:
        admin = ensure_user(db, "admin@example.com", "Admin User", "admin123", GlobalRole.admin)
        reviewer = ensure_user(db, "reviewer@example.com", "Reviewer User", "reviewer123", GlobalRole.reviewer)
        annotator = ensure_user(db, "annotator@example.com", "Annotator User", "annotator123", GlobalRole.annotator)

        project_name = os.getenv("BOOTSTRAP_PROJECT_NAME", "Bootstrapped Annotation Project")
        project = db.query(Project).filter(Project.name == project_name).one_or_none()
        if not project:
            project = Project(name=project_name, description="Seeded project", created_by=admin.id)
            db.add(project)
            db.flush()

        for user, role in [
            (admin, ProjectRole.admin),
            (reviewer, ProjectRole.reviewer),
            (annotator, ProjectRole.annotator),
        ]:
            membership = (
                db.query(ProjectMembership)
                .filter(ProjectMembership.project_id == project.id, ProjectMembership.user_id == user.id)
                .one_or_none()
            )
            if not membership:
                db.add(ProjectMembership(project_id=project.id, user_id=user.id, role=role))

        active_model = db.query(MLModel).filter(MLModel.is_active.is_(True)).one_or_none()
        if not active_model:
            db.add(
                MLModel(
                    name="yolov8n-seg",
                    version="1.2.0",
                    provider="yolo_seg",
                    object_key=None,
                    is_active=True,
                    metrics_jsonb={"note": "bootstrap model entry"},
                )
            )

        db.commit()
        print("Bootstrap complete.")
        print("Users:")
        print(" - admin@example.com / admin123")
        print(" - reviewer@example.com / reviewer123")
        print(" - annotator@example.com / annotator123")
        print(f"Project: {project_name}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
