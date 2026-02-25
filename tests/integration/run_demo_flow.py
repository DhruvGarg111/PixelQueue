from __future__ import annotations

import io
import os
import time
from typing import Any

import requests
from PIL import Image, ImageDraw


API_URL = os.getenv("API_URL", "http://localhost:8000")
TIMEOUT_SECONDS = int(os.getenv("FLOW_TIMEOUT_SECONDS", "180"))


def api(method: str, path: str, token: str | None = None, payload: dict[str, Any] | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, f"{API_URL}{path}", json=payload, headers=headers, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path} failed: {response.status_code} {response.text}")
    if response.headers.get("content-type", "").startswith("application/json"):
        return response.json()
    return response.text


def login(email: str, password: str) -> str:
    payload = api("POST", "/api/v1/auth/login", payload={"email": email, "password": password})
    return payload["access_token"]


def make_demo_image() -> bytes:
    image = Image.new("RGB", (1024, 640), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((120, 120, 420, 420), outline="black", width=4)
    draw.ellipse((500, 200, 760, 480), outline="blue", width=6)
    draw.polygon([(800, 100), (920, 240), (860, 420), (720, 300)], outline="green", width=4)
    draw.text((130, 90), "Demo Annotation Image", fill="black")
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def wait_for_export(project_id: str, token: str) -> dict[str, Any]:
    started = time.time()
    while True:
        jobs = api("GET", f"/api/v1/projects/{project_id}/exports", token=token)
        if jobs and jobs[0]["status"] in {"completed", "failed"}:
            return jobs[0]
        if time.time() - started > TIMEOUT_SECONDS:
            raise TimeoutError("Timed out waiting for export job completion")
        time.sleep(2)


def wait_for_auto_label(image_id: str, token: str, expected_min_annotations: int) -> dict[str, Any]:
    started = time.time()
    while True:
        bundle = api("GET", f"/api/v1/images/{image_id}/annotations", token=token)
        if len(bundle.get("annotations", [])) >= expected_min_annotations:
            return bundle
        if time.time() - started > TIMEOUT_SECONDS:
            raise TimeoutError("Timed out waiting for auto-label results")
        time.sleep(2)


def main() -> None:
    admin_token = login("admin@example.com", "admin123")
    annotator_token = login("annotator@example.com", "annotator123")
    reviewer_token = login("reviewer@example.com", "reviewer123")

    project = api("POST", "/api/v1/projects", token=admin_token, payload={"name": "Integration Demo Project", "description": "integration run"})
    project_id = project["id"]
    api(
        "POST",
        f"/api/v1/projects/{project_id}/members",
        token=admin_token,
        payload={"user_id": api("GET", "/api/v1/me", token=annotator_token)["id"], "role": "annotator"},
    )
    api(
        "POST",
        f"/api/v1/projects/{project_id}/members",
        token=admin_token,
        payload={"user_id": api("GET", "/api/v1/me", token=reviewer_token)["id"], "role": "reviewer"},
    )

    image_bytes = make_demo_image()
    presigned = api(
        "POST",
        f"/api/v1/projects/{project_id}/images/presign-upload",
        token=annotator_token,
        payload={"file_name": "demo.png", "content_type": "image/png"},
    )
    put_response = requests.put(
        presigned["upload_url"],
        data=image_bytes,
        headers={"Content-Type": "image/png"},
        timeout=30,
    )
    if put_response.status_code >= 400:
        raise RuntimeError(f"Upload failed: {put_response.status_code} {put_response.text}")

    api(
        "POST",
        f"/api/v1/projects/{project_id}/images/commit-upload",
        token=annotator_token,
        payload={"object_key": presigned["object_key"], "width": 1024, "height": 640},
    )

    task = api("GET", f"/api/v1/projects/{project_id}/tasks/next", token=annotator_token)
    image_id = task["image_id"]
    bundle = api("GET", f"/api/v1/images/{image_id}/annotations", token=annotator_token)

    save_payload = {
        "expected_revision": bundle["revision"],
        "annotations": [
            {
                "label": "box_obj",
                "geometry": {"type": "bbox", "x": 0.1, "y": 0.2, "w": 0.25, "h": 0.3},
                "source": "manual",
                "status": "draft",
                "confidence": None,
            },
            {
                "label": "poly_obj",
                "geometry": {
                    "type": "polygon",
                    "points": [
                        {"x": 0.55, "y": 0.25},
                        {"x": 0.74, "y": 0.28},
                        {"x": 0.79, "y": 0.58},
                        {"x": 0.6, "y": 0.63},
                    ],
                },
                "source": "manual",
                "status": "draft",
                "confidence": None,
            },
        ],
    }
    api("PUT", f"/api/v1/images/{image_id}/annotations", token=annotator_token, payload=save_payload)

    api("POST", f"/api/v1/images/{image_id}/auto-label", token=annotator_token)
    bundle = wait_for_auto_label(image_id, annotator_token, expected_min_annotations=2)
    assert bundle["annotations"], "Expected annotations after auto-label"

    for annotation in bundle["annotations"]:
        api(
            "POST",
            f"/api/v1/annotations/{annotation['id']}/review",
            token=reviewer_token,
            payload={"action": "approve", "comment": "looks good"},
        )

    api("POST", f"/api/v1/projects/{project_id}/exports", token=reviewer_token, payload={"format": "coco"})
    export_job = wait_for_export(project_id, reviewer_token)
    assert export_job["status"] == "completed", export_job
    assert export_job.get("download_url"), "Expected export download URL"

    print("Integration demo flow passed.")
    print(f"Project: {project_id}")
    print(f"Export: {export_job['id']}")


if __name__ == "__main__":
    main()

