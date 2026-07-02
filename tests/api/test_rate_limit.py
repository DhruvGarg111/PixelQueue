from fastapi.testclient import TestClient
import pytest
from unittest.mock import MagicMock
from app.main import app
from app.api.deps import get_db

client = TestClient(app)

def test_login_rate_limiting():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.one_or_none.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        # Perform 5 requests (the limit)
        for i in range(5):
            response = client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "password123"}
            )
            assert response.status_code == 401

        # The 6th request should return 429
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        assert response.status_code == 429
        assert "rate limit exceeded" in response.text.lower()
    finally:
        app.dependency_overrides.pop(get_db, None)
