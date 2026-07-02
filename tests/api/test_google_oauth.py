from fastapi.testclient import TestClient
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.api.deps import get_db
from sqlalchemy.orm import Session

client = TestClient(app)

def test_google_callback_invalid_state():
    response = client.get("/api/v1/auth/google/callback?state=invalid&code=123", follow_redirects=False)
    assert response.status_code == 302
    assert "oauth_error=invalid_state" in response.headers["location"]


def test_google_callback_success():
    client.cookies.set("oauth_state", "mystate")

    mock_client = MagicMock()
    
    mock_token_response = MagicMock()
    mock_token_response.status_code = 200
    mock_token_response.json.return_value = {"access_token": "google_token_123"}
    # AsyncMock for post
    mock_client.post = AsyncMock(return_value=mock_token_response)

    mock_user_response = MagicMock()
    mock_user_response.status_code = 200
    mock_user_response.json.return_value = {
        "email": "google-user@example.com",
        "sub": "google-sub-12345",
        "email_verified": True,
        "name": "Google User"
    }
    # AsyncMock for get
    mock_client.get = AsyncMock(return_value=mock_user_response)

    mock_db = MagicMock(spec=Session)
    mock_query = mock_db.query.return_value
    mock_query.filter.return_value.one_or_none.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db
    app.state.oauth_http_client = mock_client
    try:
        response = client.get("/api/v1/auth/google/callback?state=mystate&code=mycode", follow_redirects=False)
        assert response.status_code == 302
        assert "/projects" in response.headers["location"]
        assert mock_db.add.called
    finally:
        app.state.oauth_http_client = None
        app.dependency_overrides.pop(get_db, None)
