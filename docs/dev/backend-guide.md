# Backend Development Guide

This guide describes the design patterns, code structure, and development workflows for the FastAPI backend API of PixelQueue.

---

## 📂 Module Architecture

The backend code is organized into clean, domain-driven modules inside the `api/app/` directory:

```
api/app/
├── api/             # API routes and dependencies
│   ├── deps.py      # Common FastAPI dependencies (auth, DB, RBAC)
│   └── v1/          # Version 1 route controllers (auth, annotations, etc.)
├── core/            # Configuration and system middleware
│   ├── config.py    # Pydantic settings loading env variables
│   ├── security.py  # Cryptographic utilities (JWT, password hashes)
│   ├── csrf.py      # CSRF validation middleware
│   └── rate_limit.py# Redis-backed endpoint throttling
├── db/              # Database connection session pooling
│   └── session.py   # SQLAlchemy session creation and engine init
├── models/          # Relational database models
│   ├── base.py      # Declarative base class
│   └── entities.py  # SQLAlchemy Table schemas (User, Image, Annotation...)
├── schemas/         # Serialization and request validation
│   ├── auth.py      # Pydantic register/login request/response schemas
│   └── annotation.py# Pydantic geometry and annotation validations
└── services/        # Third-party wrappers and utility managers
    ├── minio_client.py # S3 bucket put/get presigning wrapper
    ├── events.py    # Redis publish interface for SSE
    └── audit.py     # System audit logging wrapper
```

---

## 🔄 Request Execution Lifecycle

Every incoming request to the API traverses these layers sequentially:

```
1. Request Ingest ──► CSRF / Rate Limit Middleware
                  ──► Router Router Match
                  ──► Dependency Injection (Deps: auth, db session, RBAC validation)
                  ──► Controller Action Logic
                  ──► Service Call / DB Transaction
                  ──► Serialization (Pydantic Output filtering)
2. Response Out  ──► Client
```

---

## ➕ Walkthrough: Creating a New Endpoint

Follow this step-by-step guide to add a new endpoint, for example: `POST /api/v1/projects/{project_id}/notes` (allowing annotators to attach text notes to a project).

### Step 1: Create the Model
Declare the new database schema inside `api/app/models/entities.py`:
```python
class ProjectNote(Base):
    __tablename__ = "project_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Step 2: Generate the DB Migration
Run Alembic from the host terminal context:
```bash
docker compose exec api alembic revision --autogenerate -m "add_project_notes_table"
```
Verify the migration script in `api/alembic/versions/` and commit it.

### Step 3: Create Pydantic Validation Schemas
Define Pydantic structures in `api/app/schemas/project.py` (or create a new `notes.py` schema):
```python
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class NoteCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class NoteResponse(BaseModel):
    id: UUID
    project_id: UUID
    author_id: UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
```

### Step 4: Write Router & Controller Logic
Create `api/app/api/v1/notes.py` and implement the controller using dependencies:
```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from app.api import deps
from app.models import ProjectRole, ProjectNote, User
from app.schemas.project import NoteCreateRequest, NoteResponse

router = APIRouter(prefix="/projects/{project_id}/notes", tags=["notes"])

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_project_note(
    project_id: UUID,
    payload: NoteCreateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Enforce that user has at least annotator role in this project
    deps.require_project_role(db, current_user, project_id, min_role=ProjectRole.annotator)
    
    note = ProjectNote(
        id=uuid4(),
        project_id=project_id,
        author_id=current_user.id,
        content=payload.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
```

### Step 5: Register Router in the Main App
Import and mount your new router inside `api/app/api/v1/router.py`:
```python
from app.api.v1 import notes
api_router.include_router(notes.router)
```

---

## 🔑 Dependency Injection (DI) Patterns

FastAPI dependencies (resolved via `Depends()`) perform core cross-cutting tasks cleanly:

### 1. Database Session Lifecycle (`deps.get_db`)
Exposes a transactional database session using a generator context. It guarantees that the connection is closed when the request finishes:
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 2. User Authentication (`deps.get_current_user`)
Decrypts session cookies/Bearer tokens, validates expiration and signature, and queries PostgreSQL for the current active `User` object. Throws `HTTP 401` on failure.

### 3. Project-Level Authorization (`deps.require_project_role`)
Validates that the authenticated user has the necessary privileges within a specific project context, checking the `ROLE_ORDER` hierarchy. Throws `HTTP 403` on failure.

---

## 🧪 Endpoint Testing Pattern

Write API tests inside `tests/api/` using `pytest`. We use the `httpx.Client` to dispatch requests directly against the FastAPI application.

Example endpoint test:
```python
from fastapi.testclient import TestClient
from app.models import ProjectRole

def test_create_project_note_success(client: TestClient, db_session, test_user, test_project):
    # Setup project membership
    deps.require_project_role(db_session, test_user, test_project.id, min_role=ProjectRole.annotator)
    
    # Authenticate client by setting session cookie
    client.cookies.set("pixelqueue_access", "valid_test_jwt_token")
    
    payload = {"content": "Test annotation note details."}
    response = client.post(
        f"/api/v1/projects/{test_project.id}/notes",
        json=payload
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == payload["content"]
    assert "id" in data
```
