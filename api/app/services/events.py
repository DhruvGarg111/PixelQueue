import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from redis import Redis

from app.core.config import get_settings


settings = get_settings()
redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
logger = logging.getLogger(__name__)


EVENT_CHANNEL = "annotation_events"


def publish_project_event(project_id: UUID, event: str, payload: dict | None = None) -> None:
    body = {
        "project_id": str(project_id),
        "event": event,
        "payload": payload or {},
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    try:
        redis_client.publish(EVENT_CHANNEL, json.dumps(body))
    except Exception:
        # Event fanout is best-effort; business writes should not fail if redis publish fails.
        logger.exception("Failed to publish project event", extra={"project_id": str(project_id), "event": event})
