# ADR 001: FastAPI over Django REST Framework

*   **Status**: Approved
*   **Decided by**: Tech Lead
*   **Date**: 2026-07-02

---

## Context and Problem Statement

PixelQueue requires a backend API to handle authentication, RBAC, annotations CRUD, SSE event dispatching, and task triggers. The platform serves zero-latency visual annotation workflows where fast response times and low API overhead are critical. 

Should we use a heavy framework like Django (specifically Django REST Framework) or a modern, lightweight, asynchronous framework like FastAPI?

---

## Decision Driver

1.  **Response Latency**: The annotation workspace requires near-instantaneous save, load, and concurrency checks.
2.  **Asynchronous Concurrency**: Support for Server-Sent Events (SSE) requires keeping many connection sockets open concurrently, which is difficult with WSGI-based frameworks.
3.  **Developer Experience**: Automated OpenAPI documentation generation and Pydantic-based payload validation reduce frontend-backend synchronization delays.

---

## Considered Options

1.  **FastAPI**: A modern, fast (high-performance), web framework for building APIs with Python based on standard Python type hints.
2.  **Django REST Framework (DRF)**: A powerful and flexible toolkit for building Web APIs, built on top of Django.

---

## Decision Outcome

We chose **FastAPI** combined with **SQLAlchemy** (as the ORM) and **Alembic** (for migrations).

### Consequences

*   **Positive (Pros)**:
    *   **Performance**: Extremely low latency compared to Django, enabling near zero-delay annotation saves.
    *   **Async Support**: Native ASGI asynchronous execution allows the `/events/stream` SSE generator loop to maintain hundreds of concurrent connections using very little memory.
    *   **Auto Docs**: Instantly generates interactive OpenAPI (Swagger) specs at `/docs`, which helps frontend integration.
    *   **Type Safety**: Pydantic validations catch formatting errors (like malformed GeoJSON polygons) at the gateway layer before touching database models.
*   **Negative (Cons)**:
    *   **No Admin Panel**: Django provides a built-in admin dashboard. With FastAPI, we must write custom management routes or build administration dashboards manually in the React client.
    *   **No Built-in Auth/ORM**: We had to manually write cookie authentication handlers, CSRF middlewares, and configure SQLAlchemy engines, whereas Django ships with these features pre-configured.
