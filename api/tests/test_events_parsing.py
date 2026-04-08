import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user, require_project_role
from app.db.session import get_db

# Mock dependencies
mock_user = MagicMock()
mock_user.id = uuid4()
mock_user.global_role.value = "admin"

def override_get_current_user():
    return mock_user

def override_require_project_role():
    return None

def override_get_db():
    return MagicMock()

app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[require_project_role] = override_require_project_role
app.dependency_overrides[get_db] = override_get_db

@pytest.mark.asyncio
@patch("app.api.v1.events.Redis")
async def test_stream_events_handles_invalid_json(mock_redis_class):
    project_id = uuid4()

    # Mock Redis and PubSub
    mock_redis = AsyncMock()
    mock_pubsub = AsyncMock()
    mock_redis_class.from_url.return_value = mock_redis
    mock_redis.pubsub.return_value = mock_pubsub

    # Mock messages: first invalid JSON, then valid JSON for this project, then None
    # get_message is awaited
    mock_pubsub.get_message.side_effect = [
        {"data": "invalid json"},
        {"data": json.dumps({"project_id": str(project_id), "event": "test", "payload": {}})},
        None
    ]

    # Use a TestClient to call the endpoint
    client = TestClient(app)

    # is_disconnected is awaited. We return False three times then True to break.
    with patch("fastapi.Request.is_disconnected", new_callable=AsyncMock) as mock_disconnected:
        mock_disconnected.side_effect = [False, False, False, True]
        response = client.get(f"/api/v1/events/stream?project_id={project_id}")

    assert response.status_code == 200
    # Check that we got the valid event and the ping, but not an error from the invalid JSON
    content = response.text
    assert "event: test" in content
    assert "event: ping" in content
