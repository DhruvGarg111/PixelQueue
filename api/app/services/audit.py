from uuid import UUID

from sqlalchemy.orm import Session

from app.models import AuditLog


def write_audit_log(
    db: Session,
    actor_id: UUID | None,
    project_id: UUID | None,
    entity_type: str,
    entity_id: UUID | None,
    action: str,
    payload: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            project_id=project_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            payload_jsonb=payload or {},
        )
    )

