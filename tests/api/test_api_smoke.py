import os
import time

import requests


API_URL = os.getenv("API_URL", "http://localhost:8000")


def api(method: str, path: str, token: str | None = None, payload: dict | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, f"{API_URL}{path}", json=payload, headers=headers, timeout=30)
    assert response.status_code < 400, f"{method} {path} failed: {response.status_code} {response.text}"
    if response.headers.get("content-type", "").startswith("application/json"):
        return response.json()
    return response.text


def test_auth_and_project_listing():
    login = api("POST", "/api/v1/auth/login", payload={"email": "admin@example.com", "password": "admin123"})
    token = login["access_token"]
    me = api("GET", "/api/v1/me", token=token)
    assert me["email"] == "admin@example.com"
    projects = api("GET", "/api/v1/projects", token=token)
    assert isinstance(projects, list)


def test_authenticated_users_can_create_projects():
    login = api("POST", "/api/v1/auth/login", payload={"email": "annotator@example.com", "password": "annotator123"})
    token = login["access_token"]
    project = api(
        "POST",
        "/api/v1/projects",
        token=token,
        payload={
            "name": f"self-serve project {int(time.time() * 1000)}",
            "description": "created by a non-admin account",
        },
    )
    assert project["my_role"] == "admin"

