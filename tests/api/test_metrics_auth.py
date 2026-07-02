from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.api.deps import get_current_user
from app.models import User, GlobalRole

client = TestClient(app)

def test_metrics_requires_authentication():
    response = client.get("/metrics")
    assert response.status_code == 401


def test_metrics_rejects_non_admin_users():
    mock_user = User(
        email="annotator@example.com",
        full_name="Annotator",
        global_role=GlobalRole.annotator,
    )

    def override_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.get("/metrics")
        assert response.status_code == 403
        assert "Admin access required" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_metrics_allows_admin_users():
    mock_user = User(
        email="admin@example.com",
        full_name="Admin User",
        global_role=GlobalRole.admin,
    )

    def override_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.get("/metrics")
        assert response.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)
