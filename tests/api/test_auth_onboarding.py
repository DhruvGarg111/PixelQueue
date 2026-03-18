from __future__ import annotations

import os
import time

import requests


API_URL = os.getenv("API_URL", "http://localhost:8000")


def register_user(session: requests.Session, email: str, full_name: str = "Test Operator", password: str = "StrongPass1"):
    response = session.post(
        f"{API_URL}/api/v1/auth/register",
        json={"email": email, "full_name": full_name, "password": password},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert response.status_code < 400, response.text
    return response.json()


def login_session(email: str, password: str) -> requests.Session:
    session = requests.Session()
    response = session.post(
        f"{API_URL}/api/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert response.status_code < 400, response.text
    return session


def test_register_create_project_and_logout_cookie_session():
    session = requests.Session()
    suffix = int(time.time() * 1000)
    email = f"cookie-user-{suffix}@example.com"

    register_user(session, email=email)

    me = session.get(f"{API_URL}/api/v1/me", timeout=30)
    assert me.status_code == 200
    assert me.json()["email"] == email

    project = session.post(
        f"{API_URL}/api/v1/projects",
        json={"name": f"Project {suffix}", "description": "cookie-auth smoke"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert project.status_code == 201, project.text

    logout = session.post(f"{API_URL}/api/v1/auth/logout", timeout=30)
    assert logout.status_code == 204, logout.text

    after_logout = session.get(f"{API_URL}/api/v1/me", timeout=30)
    assert after_logout.status_code == 401


def test_register_rejects_weak_password():
    response = requests.post(
        f"{API_URL}/api/v1/auth/register",
        json={"email": f"weak-{int(time.time() * 1000)}@example.com", "full_name": "Weak Password", "password": "weak"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert response.status_code == 400
    assert "password" in response.text.lower()


def test_register_rejects_duplicate_email_case_insensitive():
    suffix = int(time.time() * 1000)
    first_session = requests.Session()
    email = f"duplicate-{suffix}@example.com"
    register_user(first_session, email=email, full_name="Primary User")

    duplicate = requests.post(
        f"{API_URL}/api/v1/auth/register",
        json={"email": email.upper(), "full_name": "Duplicate User", "password": "StrongPass1"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert duplicate.status_code == 409


def test_login_response_access_token_supports_bearer_fallback():
    suffix = int(time.time() * 1000)
    email = f"bearer-{suffix}@example.com"
    register_user(requests.Session(), email=email, full_name="Bearer Ready")

    response = requests.post(
        f"{API_URL}/api/v1/auth/login",
        json={"email": email, "password": "StrongPass1"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    access_token = response.json()["access_token"]

    me = requests.get(
        f"{API_URL}/api/v1/me",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30,
    )
    assert me.status_code == 200, me.text
    assert me.json()["email"] == email


def test_refresh_rotates_cookie_session():
    session = requests.Session()
    suffix = int(time.time() * 1000)
    email = f"refresh-{suffix}@example.com"
    register_user(session, email=email, full_name="Refresh Session")

    original_refresh = session.cookies.get("pixelqueue_refresh")
    assert original_refresh

    refresh = session.post(f"{API_URL}/api/v1/auth/refresh", timeout=30)
    assert refresh.status_code == 200, refresh.text

    rotated_refresh = session.cookies.get("pixelqueue_refresh")
    assert rotated_refresh
    assert rotated_refresh != original_refresh

    me = session.get(f"{API_URL}/api/v1/me", timeout=30)
    assert me.status_code == 200, me.text


def test_project_admin_can_invite_registered_user_by_email():
    admin = login_session("admin@example.com", "admin123")
    suffix = int(time.time() * 1000)
    project_id = admin.post(
        f"{API_URL}/api/v1/projects",
        json={"name": f"Invite Smoke {suffix}", "description": "email invite"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    ).json()["id"]

    collaborator_session = requests.Session()
    collaborator_email = f"invitee-{suffix}@example.com"
    register_user(collaborator_session, email=collaborator_email, full_name="Invitee Operator")

    invite = admin.post(
        f"{API_URL}/api/v1/projects/{project_id}/members",
        json={"email": collaborator_email, "role": "annotator"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert invite.status_code == 201, invite.text
    assert invite.json()["email"] == collaborator_email

    members = admin.get(f"{API_URL}/api/v1/projects/{project_id}/members", timeout=30)
    assert members.status_code == 200, members.text
    assert any(row["email"] == collaborator_email for row in members.json())
