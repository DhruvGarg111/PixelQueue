# Contributing to PixelQueue

Thank you for your interest in contributing to PixelQueue! This document outlines coding standards, branching models, and step-by-step instructions for adding features to the platform.

---

## 📂 Project Structure

Familiarise yourself with the directory layout before modifying code:

```
PixelQueue/
├── api/             # FastAPI backend application
│   ├── app/         # Source code (models, schemas, routes, services)
│   └── alembic/     # SQLAlchemy database schema migrations
├── frontend/        # React + Vite client application
│   └── src/         # UI components, Zustand stores, canvas stages, hooks
├── worker/          # Celery backend background worker task suite
│   ├── tasks/       # Async task executions (auto-label, export)
│   └── converters/  # Geometry coordinators (YOLO, COCO format conversion)
├── ml-service/      # Dedicated Python ML model inference container
│   └── app/         # YOLO segmentation and CV fallback providers
├── scripts/         # MLOps pipeline scripts (training, data prep, evaluation)
├── tests/           # Integration, API, and unit test suites
└── docs/            # Technical documentation and guides
```

---

## 🌿 Branching & Commits

### Git Branch Naming
Use descriptive prefixes for branch names:
*   `feat/your-feature-name` — for new features.
*   `fix/your-fix-name` — for bug fixes.
*   `chore/maintenance-name` — for documentation, configs, or package updates.

### Conventional Commits
We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This allows automated changelog generation.

Format: `<type>(<scope>): <description>`

Examples:
*   `feat(api): add Google OAuth registration flow`
*   `fix(canvas): resolve offset vertex rendering on zoom`
*   `chore(deps): upgrade fastapi to 0.110.0`

---

## 💻 Coding Standards & Lints

### Python (`api`, `worker`, `ml-service`, `scripts`)
We use **Ruff** for linting and code formatting.
*   **Format Check**: `ruff format --check`
*   **Lint Check**: `ruff check`
*   **Configuration**: Settings are declared in the root `/ruff.json`.

### JavaScript / React (`frontend`)
*   **Style**: ESLint combined with Prettier code styling rules.
*   **Format Check**: `npm run lint` inside the `/frontend` directory.

---

## ➕ Development Guides

### 1. Adding a New API Endpoint

Follow this step-by-step workflow when adding a new endpoint to the API:

1.  **Define the DB Model (if needed)**:
    Add your table schema in `api/app/models/entities.py`.
2.  **Generate a Migration**:
    If models were changed, run Alembic:
    ```bash
    docker compose exec api alembic revision --autogenerate -m "add_new_table"
    ```
3.  **Define Schemas**:
    Create Pydantic models for validation in `api/app/schemas/`. Define request inputs and serialization outputs.
4.  **Create Router**:
    Declare routes using `APIRouter()` in a matching router file within `api/app/api/v1/`. Wire the route dependencies for auth/RBAC (e.g. `Depends(deps.get_current_user)`).
5.  **Register Router**:
    Mount the router in the router registry at `api/app/api/v1/router.py`.
6.  **Write Tests**:
    Write a smoke/unit test in `tests/api/` targeting the new endpoints.

---

### 2. Adding a New Celery Task

Follow this workflow when creating a new asynchronous task:

1.  **Write Task Code**:
    Create a new Python file or function inside the `worker/tasks/` directory. Use the `@celery_app.task` decorator:
    ```python
    from app.services.celery_app import celery_app
    
    @celery_app.task(name="worker.tasks.your_task_name")
    def your_task_name(arg1: str):
        # Your task logic
        pass
    ```
2.  **Expose in Worker**:
    Import the task inside `worker/worker_tasks.py` so the Celery worker daemon registers it on boot.
3.  **Trigger from API**:
    Import and call the task from your API router using `.delay()` or `.apply_async()`:
    ```python
    from worker.worker_tasks import your_task_name
    
    your_task_name.delay("argument_value")
    ```
4.  **Register Real-Time Notifications (Optional)**:
    If the frontend needs to know when the task finishes, publish an event inside the task execution block using `publish_project_event(...)` and handle it on the frontend SSE hook.

---

## 🛡️ Pull Request (PR) Checklist

Before submitting a Pull Request, ensure your branch passes these validation gates:

- [ ] **Lints Pass**: No Ruff errors or ESLint warnings remain unresolved.
- [ ] **Tests Pass**: Run the test suites (Pytest and Vitest) and verify all checks pass.
- [ ] **Migrations Verified**: Ensure database migrations execute and roll back without errors.
- [ ] **Documentation**: If your change adds a new configuration setting, API endpoint, or task, update the corresponding document under `/docs`.
- [ ] **No Placeholders**: Ensure no debug code, console logs, or mock data files are committed.
