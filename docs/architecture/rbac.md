# Role-Based Access Control (RBAC)

PixelQueue enforces strict authentication and authorization boundaries. Access is governed by both **Global System Roles** (assigned to users globally) and **Project-Specific Roles** (scoped to individual annotation projects).

---

## 👥 Role Definitions

### 1. Global Roles (`GlobalRole` Enum)
Assigned upon user registration and persisted on the `User` model. Controls access to system-level metrics and administration boundaries:

*   **Global Admin (`GlobalRole.admin`)**: Bypasses all project-level validation. Has absolute R/W access across all resources in the database.
*   **Global Reviewer (`GlobalRole.reviewer`)**: Dedicated monitoring and validation credentials.
*   **Global Annotator (`GlobalRole.annotator`)**: Standard user credentials.

### 2. Project Roles (`ProjectRole` Enum)
Assigned on a per-project basis within the `ProjectMembership` junction table. Governs workspace rights inside a specific project:

*   **Project Admin (`ProjectRole.admin`)**: Full operational control over a single project. Can modify project settings, invite/remove members, and change roles.
*   **Project Reviewer (`ProjectRole.reviewer`)**: Responsible for quality assurance. Can access the review queue, and approve or reject submitted annotations.
*   **Project Annotator (`ProjectRole.annotator`)**: Core workflow agent. Can upload images, draw/edit polygon boundaries, and trigger ML auto-labeling.

---

## 📊 Operational Permission Matrix

The following matrix documents the minimum required project-level role to execute core system operations:

| Operations | API Route | Annotator | Reviewer | Admin | Global Admin |
|---|---|:---:|:---:|:---:|:---:|
| **Create Project** | `POST /api/v1/projects` | ✅ | ✅ | ✅ | ✅ |
| **Delete Project** | `DELETE /api/v1/projects/{id}` | ❌ | ❌ | ✅ | ✅ |
| **Manage Members** | `POST /api/v1/projects/{id}/members` | ❌ | ❌ | ✅ | ✅ |
| **Upload Images** | `POST /api/v1/projects/{id}/images/upload-request` | ✅ | ✅ | ✅ | ✅ |
| **Delete Images** | `DELETE /api/v1/projects/{id}/images/{img_id}` | ❌ | ❌ | ✅ | ✅ |
| **Trigger Auto-Label** | `POST /api/v1/annotations/{img_id}/auto-label` | ✅ | ✅ | ✅ | ✅ |
| **Submit Polygons** | `POST /api/v1/annotations` | ✅ | ✅ | ✅ | ✅ |
| **Approve/Reject QA**| `POST /api/v1/projects/{id}/review/{task_id}` | ❌ | ✅ | ✅ | ✅ |
| **Compile Export** | `POST /api/v1/projects/{id}/exports` | ❌ | ✅ | ✅ | ✅ |
| **View System Metrics**| `GET /api/v1/metrics` | ❌ | ❌ | ❌ | ✅ |

---

## 🔒 Code-Level Enforcement

FastAPI router dependencies serve as the primary policy enforcement points (PEPs). Security rules are declared directly in router signatures using dependency injection.

### Enforcement Flow

```
HTTP Request ──► [get_access_token] ──► [get_current_user] ──► [require_project_role] ──► Controller Action
```

1.  **Token Extraction (`deps.py:get_access_token`)**: Extracts the JWT token from the HTTP Bearer header or the signed HTTP-only access cookie.
2.  **Authentication (`deps.py:get_current_user`)**: Decodes the JWT, validates its expiration and signature, and retrieves the matching `User` record from the database.
3.  **Role Evaluation (`deps.py:require_project_role`)**:
    *   If the user has a global `admin` role, authorization is granted immediately.
    *   Otherwise, it queries `project_memberships` to check for active enrollment.
    *   It references a role hierarchy map `ROLE_ORDER` to verify that the active role meets the required hierarchy value:
        ```python
        ROLE_ORDER = {
            "annotator": 1,
            "reviewer": 2,
            "admin": 3,
        }
        ```
    *   If the user's role weight is lower than the minimum required weight, a `403 Forbidden` exception is raised.

### Example Backend Route Enforcement

```python
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models import ProjectRole

router = APIRouter()

@router.post(
    "/{project_id}/exports", 
    status_code=status.HTTP_202_ACCEPTED
)
def create_dataset_export(
    project_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Enforce that the user must be at least a project Reviewer
    deps.require_project_role(
        db=db,
        current_user=current_user,
        project_id=project_id,
        min_role=ProjectRole.reviewer
    )
    
    # Executed only if role verification completes successfully
    return trigger_export_pipeline(project_id, db)
```

---

## 🔑 Session & Token Lifecycle

PixelQueue uses short-lived access tokens and long-lived refresh tokens stored as secure, HTTP-only cookies to mitigate cross-site scripting (XSS) risks.

*   **Access Token**:
    *   **Validity**: 30 minutes.
    *   **Storage**: Handled via `pixelqueue_access` cookie or standard Bearer authorization headers.
    *   **Path Restriction**: `/api`.
*   **Refresh Token**:
    *   **Validity**: 7 days.
    *   **Storage**: Stored in the `pixelqueue_refresh` cookie.
    *   **Path Restriction**: `/api/v1/auth`.
    *   **Function**: Sent automatically to `/api/v1/auth/refresh` to obtain a new access token without forcing a full user re-authentication.
