import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis

from app.api.deps import require_project_role
from app.core.config import get_settings
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models import ProjectRole, User
from app.services.events import EVENT_CHANNEL


router = APIRouter(prefix="/events", tags=["events"])
settings = get_settings()


@router.get("/stream")
async def stream_events(
    project_id: UUID = Query(...),
    token: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
):
    access_token = token
    if authorization and authorization.lower().startswith("bearer "):
        access_token = authorization.split(" ", 1)[1].strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="authentication required")

    try:
        payload = decode_token(access_token, expected_type="access")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="invalid token") from exc
    user_id = payload.get("sub")
    db = SessionLocal()
    try:
        current_user = db.get(User, user_id)
        if not current_user:
            raise HTTPException(status_code=401, detail="user not found")
        require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    finally:
        db.close()

    async def event_generator():
        redis = Redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = redis.pubsub()
        await pubsub.subscribe(EVENT_CHANNEL)
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=5.0)
                if not message:
                    yield "event: ping\ndata: {}\n\n"
                    await asyncio.sleep(1)
                    continue
                try:
                    body = json.loads(message["data"])
                except Exception:
                    continue
                if body.get("project_id") != str(project_id):
                    continue
                yield f"event: {body.get('event', 'message')}\ndata: {json.dumps(body)}\n\n"
        finally:
            await pubsub.unsubscribe(EVENT_CHANNEL)
            await pubsub.close()
            await redis.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
