from fastapi.testclient import TestClient
import pytest
from unittest.mock import MagicMock
from app.main import app
from app.api.deps import get_db, get_current_user
from app.models import User, GlobalRole

# Set raise_server_exceptions=False to prevent internal validation/mock errors from crashing tests
client = TestClient(app, raise_server_exceptions=False)

def test_csrf_cookie_issued_on_get_request():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert "csrf_token" in response.cookies


def test_csrf_validation_fails_on_mutation_with_cookie_auth_lacking_header():
    mock_db = MagicMock()
    mock_user = User(
        email="test@example.com",
        full_name="Test User",
        global_role=GlobalRole.annotator,
    )
    
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        # Set auth cookie (representing cookie auth)
        client.cookies.set("pixelqueue_access", "valid_cookie_value")
        
        # Mutation without header -> should be rejected with 403
        response = client.post("/api/v1/projects", json={"name": "New Project"})
        assert response.status_code == 403
        assert "CSRF validation failed" in response.json()["detail"]
    finally:
        client.cookies.clear()
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_csrf_validation_passes_on_mutation_with_valid_header():
    mock_db = MagicMock()
    mock_user = User(
        email="test@example.com",
        full_name="Test User",
        global_role=GlobalRole.annotator,
    )
    
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        client.cookies.set("pixelqueue_access", "valid_cookie_value")
        client.cookies.set("csrf_token", "my_secret_csrf_token")
        
        response = client.post(
            "/api/v1/projects",
            json={"name": "New Project"},
            headers={"X-CSRF-Token": "my_secret_csrf_token"}
        )
        # Verify it bypassed the CSRF check (status code should NOT be 403)
        assert response.status_code != 403
    finally:
        client.cookies.clear()
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_csrf_ignored_for_bearer_auth():
    mock_db = MagicMock()
    mock_user = User(
        email="test@example.com",
        full_name="Test User",
        global_role=GlobalRole.annotator,
    )
    
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        # Authorization header but no cookies -> CSRF should be ignored
        response = client.post(
            "/api/v1/projects",
            json={"name": "New Project"},
            headers={"Authorization": "Bearer my_access_token"}
        )
        assert response.status_code != 403
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
