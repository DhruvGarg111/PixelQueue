<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=800&size=34&pause=1000&color=38bdf8&center=true&vCenter=true&width=800&height=80&lines=Collaborative+Image+Annotation;AI-Assisted+Auto-Labeling;Human-in-the-Loop+Review;Seamless+Dataset+Exports" alt="Typing SVG" />

<p align="center">
  <img src="https://img.shields.io/badge/React-18-0ea5e9?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<em>A production-grade, full-stack image annotation platform powered by seamless collaboration, AI-driven labeling, and robust observability.</em>

</div>

<br />

<div align="center">
  <a href="#sparkles-features">Features</a> &nbsp;&bull;&nbsp;
  <a href="#rocket-quick-start">Quick Start</a> &nbsp;&bull;&nbsp;
  <a href="#books-architecture">Architecture</a> &nbsp;&bull;&nbsp;
  <a href="#gear-api-quick-reference">API</a> &nbsp;&bull;&nbsp;
  <a href="#wrench-troubleshooting">Troubleshooting</a>
</div>

<hr />

## :sparkles: Features

<table width="100%">
  <tr>
    <td width="50%">
      <h3>👥 Role-Based Collaboration</h3>
      <p>Secure workspaces divided into <code>annotator</code>, <code>reviewer</code>, and <code>admin</code> roles. Streamlined workflow ensures quality control and accountability.</p>
    </td>
    <td width="50%">
      <h3>🤖 Auto-Labeling (AI)</h3>
      <p>Seamlessly integrate ML services (like YOLO segmentations or OpenCV) via Celery background jobs to accelerate the annotation process.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔁 Human-in-the-loop</h3>
      <p>Dedicated review queues. Annotations can be approved or rejected with revision checks to maintain the absolute highest dataset quality.</p>
    </td>
    <td width="50%">
      <h3>📦 Dataset Exporting</h3>
      <p>One-click asynchronous dataset generation. Export approved data uniformly to industry-standard <strong>COCO</strong> and <strong>YOLO</strong> formats.</p>
    </td>
  </tr>
</table>

## :rocket: Quick Start

**Prerequisites:** Docker + Docker Compose

```powershell
# 1. Initialize environment
Copy-Item .env.example .env

# 2. Build and orchestrate services
docker compose up --build -d

# 3. Bootstrap initial database state (users, project, model)
docker compose --profile tools run --rm bootstrap
```

### :globe_with_meridians: Access Points

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) | Main application interface |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | OpenAPI specification |
| **MinIO Console**| [http://localhost:9001](http://localhost:9001) | Object storage UI |
| **Flower** | [http://localhost:5555](http://localhost:5555) | Celery task monitoring |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | System metrics dashboard |

<br />

## :books: Architecture

<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Vite-Dark.svg" height="40" /> 
  <span>&rarr;</span>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Nginx.svg" height="40" /> 
  <span>&rarr;</span>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/FastAPI.svg" height="40" /> 
  <span>&darr;</span>
</div>

<div align="center">
  <table align="center" style="text-align: center;">
    <tr>
      <td><img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/PostgreSQL-Dark.svg" height="30" /><br><b>Core Data</b></td>
      <td><img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Redis-Dark.svg" height="30" /><br><b>Redis Broker</b></td>
      <td><img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Docker.svg" height="30" /><br><b>MinIO Storage</b></td>
      <td><img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Python-Dark.svg" height="30" /><br><b>ML Pipeline</b></td>
    </tr>
  </table>
</div>

### Core Lifecycle:
1. 📤 Image imported -> task initialized (`open`).
2. 🖌️ Manual/AI annotation (`in_progress`) with autosave.
3. ⏳ Submitted for review (`in_review`).
4. ✅ Reviewer evaluates (Accept/Reject).
5. 🎊 All approved -> task transitions to `done`.
6. 🗄️ Annotations exported to COCO/YOLO.

<br />

## :beginner: First-Run Workflow

### Bootstrapped Users
| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Reviewer | `reviewer@example.com` | `reviewer123` |
| Annotator| `annotator@example.com` | `annotator123` |

<details>
<summary><strong>View typical user flow</strong></summary>

1. **Login as Admin**: Create a new project or verify bootstrapped one.
2. **Login as Annotator**: Jump into the `Annotate` tab, draw boxes/polygons, or click `Auto-Label` for AI assistance. Submit to review.
3. **Login as Reviewer**: Visit `Review` tab to QA the output.
4. **Export**: Visit `Exports` tab to generate dataset artifacts, downloading them via presigned MinIO links once complete.
</details>

<br />

## :gear: API Quick Reference

Base URL proxy: `http://localhost:8000`

- **Authentication**: `POST /api/v1/auth/login`, `GET /api/v1/me`
- **Projects**: `POST /api/v1/projects`, `POST /api/v1/projects/{id}/members`
- **Images**: `POST /api/v1/projects/{id}/images/presign-upload`
- **Annotations**: `GET /api/v1/images/{id}/annotations`, `POST /api/v1/images/{id}/auto-label`
- **Export Jobs**: `POST /api/v1/projects/{id}/exports`

> **Note**: A full interactive swagger UI is available at `/docs` once the server is actively running.

<br />

## :microscope: Training Pipeline

A complete suite for MLOps is provided directly in `scripts/`:

```bash
# Data Prep
python scripts/prepare_dataset.py

# YOLO v8 Training
python scripts/train_yolo.py

# Evaluation metrics
python scripts/evaluate.py

# Final registry & artifact upload
python scripts/register_model.py
```

<br />

## :wrench: Troubleshooting

<details>
<summary><b>Empty Annotate Queue / "No available task"</b></summary>
There are no tasks available for your assigned role in the project. Either you lack the Annotator role, or all tasks have been completed.
</details>

<details>
<summary><b>Exports stuck in queue or failed</b></summary>
Check Celery worker logs:
<code>docker compose logs -f worker</code>. Ensure your Redis message broker is healthy and accessible.
</details>

<details>
<summary><b>MinIO Images Not Loading</b></summary>
Ensure <code>MINIO_PUBLIC_ENDPOINT=localhost:9000</code> is appropriately configured in your <code>.env</code> file to allow browser-rendered presigned URLs.
</details>

<div align="center">
  <br>
  <i>Built with the future of collaborative vision intelligence in mind.</i>
</div>
