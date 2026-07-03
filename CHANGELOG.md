# Changelog

All notable changes to the PixelQueue project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-07-03

### Added
*   **Comprehensive Documentation Hub**: Added detailed setup guides, architecture manuals, data models, developer manuals (backend, frontend, worker), API version 1 references, and a central index inside the `/docs` directory.
*   **Contributing Guidelines**: Created a detailed instruction manual (`CONTRIBUTING.md`) for developer onboarding, branch naming conventions, coding standards, and conventional commits.

### Security
*   **CSRF Protection**: Added double-submit cookie middleware validations for session cookie authentication.
*   **Authentication Throttling**: Implemented rate-limiting, brute-force protection, and lockout policies on authentication endpoints.
*   **Metrics Endpoint Security**: Restricted access to the `/metrics` endpoint behind custom API token authorization.
*   **Database Credentials Enforcement**: Added verification to reject default MinIO credentials in production configuration.
*   **Git Tracking Cleanup**: Removed unneeded local caches, agent temporary files, and dot-directories from version control tracking.

### Performance
*   **Canvas Stage Memoization**: Optimized canvas workspace stage performance by memoizing rendering arrays using React `useMemo` and optimizing drawing events to minimize unnecessary React-Konva component reconciliations.
*   **State History Optimization**: Replaced deep copy procedures in Zustand undo-redo state history with $O(1)$ state references.
*   **Database Flush Reductions**: Avoided redundant `db.flush()` database roundtrips during `commit_upload` tasks and in the auto-label worker loop to improve write performance.

### Refactored
*   **Async OAuth Callback**: Converted Google OAuth callback logic to run asynchronously with connection pool sharing.

## [0.1.0] - 2026-07-02

### Added
*   **Decoupled Microservices Topology**: Configured standard Docker Compose deployment orchestrating 7 services (FastAPI API, Celery Worker, FastAPI ML Service, React Frontend, PostgreSQL, Redis, MinIO).
*   **Role-Based Access Control (RBAC)**: Implemented 3 project-specific member roles (`admin`, `reviewer`, `annotator`) enforced via FastAPI custom dependencies.
*   **Asynchronous AI Auto-Labeling**: Integrated PyTorch YOLOv8 segmentation and OpenCV fallback providers into background Celery workers.
*   **Interactive Annotation Canvas**: Built hardware-accelerated KonvaJS workspace stage supporting zoom, panning, polygon editing, and bounding box drawing.
*   **Dataset Exports Engine**: Implemented asynchronous converters compiling approved annotations into YOLO text annotations and COCO JSON format archives.
*   **Server-Sent Events stream**: Established unidirectional real-time push events to keep the frontend canvas and dashboards in sync with worker task states.
*   **CSRF Protection**: Added double-submit cookie middleware validations for session cookie authentication security.
