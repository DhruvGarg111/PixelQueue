# Testing Standards & Guide

This guide documents the testing suites, directory structures, execution commands, and guidelines for writing new tests inside PixelQueue.

---

## 📂 Test Suites Overview

PixelQueue is split into two main testing environments:
1.  **Backend Pytest Suite** (`/tests` and `/api/tests`): Executes integration and smoke tests against the FastAPI application, Celery tasks, and ML service.
2.  **Frontend Vitest Suite** (`/frontend/src/test`): Executes unit tests for frontend helpers, React-Konva geometry math, and API HTTP client operations.

---

## 🏃 Running Tests

### 1. Running Backend Tests (Python)
Dependencies are declared in `tests/requirements.txt`.

#### Option A: Running inside Docker Containers (Recommended)
This runs the tests in an environment identical to production, with mock services spun up inside the Docker networks:
```bash
# Run all backend tests
docker compose run --rm api pytest

# Run a specific test module
docker compose run --rm api pytest tests/api/test_csrf.py

# Run with stdout verbosity enabled
docker compose run --rm api pytest -s tests/api/test_annotation_workflow.py
```

#### Option B: Running Locally (Bare-metal)
Ensure your local virtual environment is active, dependencies are installed, and local postgres/redis infrastructure is active:
```bash
pip install -r tests/requirements.txt
pytest
```

---

### 2. Running Frontend Tests (Vite + React)
Frontend tests use **Vitest** for quick in-memory testing.

Navigate to `/frontend` and execute:
```bash
cd frontend

# Run tests once
npm run test

# Run tests in watch mode (interactive development)
npm run test

# Check code coverage
npm run coverage
```

---

## ✍️ Writing New Tests

### 1. Writing Backend Tests (Pytest)

Backend tests can hit the live running application context using `requests` or execute queries directly in the DB session.

#### Example: API Endpoint Integration Test
Save as `tests/api/test_custom_workflow.py`:
```python
import pytest
import requests
import os

API_URL = os.getenv("API_URL", "http://localhost:8000")

def test_annotator_cannot_delete_project():
    # 1. Log in as a standard annotator
    login_resp = requests.post(
        f"{API_URL}/api/v1/auth/login",
        json={"email": "annotator@example.com", "password": "annotator123"},
        timeout=10
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Attempt to delete a project (Should fail with 403 Forbidden)
    project_id = "e44d3209-7756-4221-a3f2-c0c28d00f37f"
    delete_resp = requests.delete(
        f"{API_URL}/api/v1/projects/{project_id}",
        headers=headers,
        timeout=10
    )
    assert delete_resp.status_code == 403
```

#### Example: Geometry Unit Test
Save as `tests/worker/test_coordinate_math.py`:
```python
from worker.converters.geometry import geometry_to_coco

def test_geometry_bbox_to_coco_conversion():
    # Model represents a relative bounding box shape
    geometry = {
        "type": "bbox",
        "x": 0.1,
        "y": 0.2,
        "w": 0.5,
        "h": 0.4
    }
    
    # Scale to image dimensions: 1000 x 500
    bbox, segmentation, area = geometry_to_coco(geometry, width=1000, height=500)
    
    assert bbox == [100.0, 100.0, 500.0, 200.0]
    assert segmentation == []
    assert area == 100000.0
```

---

### 2. Writing Frontend Tests (Vitest)

Frontend tests focus on state transformations, data mapping, and custom React hooks.

#### Example: Utility Test
Save as `frontend/src/test/scale.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { normalizePoint } from '../components/geometry';

describe('Coordinate Normalization', () => {
  it('should scale absolute pixel points to normalized decimal floats', () => {
    const point = normalizePoint(192, 108, 1920, 1080);
    
    expect(point.x).toBe(0.1);
    expect(point.y).toBe(0.1);
  });
});
```

#### Example: Zustand Store Action Test
Save as `frontend/src/test/authStore.test.js`:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('Auth Store Actions', () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.getState().clearSession();
  });

  it('should save user session on login action', () => {
    const dummyUser = { email: 'user@example.com', name: 'User Name' };
    
    useAuthStore.getState().setSession(dummyUser);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('user@example.com');
  });
});
```
