import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_project_role
from app.core.config import get_settings
from app.db.session import get_db
from app.models import ProjectRole, User
from app.services.events import EVENT_CHANNEL


router = APIRouter(prefix="/events", tags=["events"])
settings = get_settings()


@router.get("/stream")
async def stream_events(
    request: Request,
    project_id: UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)

    async def event_generator():
        redis = Redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = redis.pubsub()
        await pubsub.subscribe(EVENT_CHANNEL)
        try:
            while True:
                if await request.is_disconnected():
                    break
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=5.0)
                if not message:
                    yield "event: ping\ndata: {}\n\n"
                    await asyncio.sleep(1)
                    continue
                try:
                    body = json.loads(message["data"])
                except (json.JSONDecodeError, TypeError):
                    continue
                if body.get("project_id") != str(project_id):
                    continue
                yield f"event: {body.get('event', 'message')}\ndata: {json.dumps(body)}\n\n"
        finally:
            await pubsub.unsubscribe(EVENT_CHANNEL)
            await pubsub.close()
            await redis.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
