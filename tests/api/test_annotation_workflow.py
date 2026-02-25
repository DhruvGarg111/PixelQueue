from __future__ import annotations

import io
import os
import time
from datetime import datetime

import requests
from PIL import Image


API_URL = os.getenv("API_URL", "http://localhost:8000")


def api(method: str, path: str, token: str | None = None, payload: dict | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, f"{API_URL}{path}", json=payload, headers=headers, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {response.status_code} {response.text}")
    return response.json()


def login(email: str, password: str) -> str:
    return api("POST", "/api/v1/auth/login", payload={"email": email, "password": password})["access_token"]


def create_png() -> bytes:
    image = Image.new("RGB", (640, 360), color="white")
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def test_revision_conflict_review_and_export_lifecycle():
    admin = login("admin@example.com", "admin123")
    reviewer = login("reviewer@example.com", "reviewer123")
    annotator = login("annotator@example.com", "annotator123")

    annotator_id = api("GET", "/api/v1/me", token=annotator)["id"]
    reviewer_id = api("GET", "/api/v1/me", token=reviewer)["id"]

    project = api(
        "POST",
        "/api/v1/projects",
        token=admin,
        payload={"name": f"API Test Project {datetime.utcnow().isoformat()}", "description": "workflow test"},
    )
    project_id = project["id"]
    api("POST", f"/api/v1/projects/{project_id}/members", token=admin, payload={"user_id": annotator_id, "role": "annotator"})
    api("POST", f"/api/v1/projects/{project_id}/members", token=admin, payload={"user_id": reviewer_id, "role": "reviewer"})

    presigned = api(
        "POST",
        f"/api/v1/projects/{project_id}/images/presign-upload",
        token=annotator,
        payload={"file_name": "workflow.png", "content_type": "image/png"},
    )
    upload = requests.put(
        presigned["upload_url"],
        data=create_png(),
        headers={"Content-Type": "image/png"},
        timeout=30,
    )
    assert upload.status_code < 400
    api(
        "POST",
        f"/api/v1/projects/{project_id}/images/commit-upload",
        token=annotator,
        payload={"object_key": presigned["object_key"], "width": 640, "height": 360},
    )

    task = api("GET", f"/api/v1/projects/{project_id}/tasks/next", token=annotator)
    image_id = task["image_id"]
    bundle = api("GET", f"/api/v1/images/{image_id}/annotations", token=annotator)
    rev = bundle["revision"]
    saved = api(
        "PUT",
        f"/api/v1/images/{image_id}/annotations",
        token=annotator,
        payload={
            "expected_revision": rev,
            "annotations": [
                {
                    "label": "box",
                    "geometry": {"type": "bbox", "x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4},
                    "source": "manual",
                    "status": "draft",
                    "confidence": None,
                }
            ],
        },
    )
    assert saved["revision"] == rev + 1

    stale = requests.put(
        f"{API_URL}/api/v1/images/{image_id}/annotations",
        headers={"Authorization": f"Bearer {annotator}", "Content-Type": "application/json"},
        json={
            "expected_revision": rev,
            "annotations": [
                {
                    "label": "box",
                    "geometry": {"type": "bbox", "x": 0.2, "y": 0.2, "w": 0.2, "h": 0.2},
                    "source": "manual",
                    "status": "draft",
                    "confidence": None,
                }
            ],
        },
        timeout=30,
    )
    assert stale.status_code == 409

    ann_id = saved["annotations"][0]["id"]
    reviewed = api(
        "POST",
        f"/api/v1/annotations/{ann_id}/review",
        token=reviewer,
        payload={"action": "approve", "comment": "ok"},
    )
    assert reviewed["status"] == "approved"

    api("POST", f"/api/v1/projects/{project_id}/exports", token=reviewer, payload={"format": "coco"})
    deadline = time.time() + 120
    status = "queued"
    latest = None
    while time.time() < deadline:
        exports = api("GET", f"/api/v1/projects/{project_id}/exports", token=reviewer)
        latest = exports[0] if exports else None
        status = latest["status"] if latest else "queued"
        if status in {"completed", "failed"}:
            break
        time.sleep(2)
    assert latest is not None
    assert status == "completed", latest
    assert latest["download_url"]

