# Monitoring & Telemetry Guide

PixelQueue provides built-in instrumentation to track API performance, worker health, queue latency, and database query states. 

---

## 📈 Prometheus Metrics Scraping

The core API and background worker processes expose metrics in the Prometheus format.

### API Metrics Endpoint
*   **Endpoint**: `GET /metrics`
*   **Authentication**: Restrictive. Requires a user session with a **Global Admin** role (`GlobalRole.admin`).
*   **Scraping Configuration (`prometheus.yml` example)**:
    ```yaml
    scrape_configs:
      - job_name: 'pixelqueue-api'
        metrics_path: '/metrics'
        bearer_token: 'if_configured_or_admin_cookie'
        static_configs:
          - targets: ['api:8000']
    ```

### Worker Metrics Endpoint
The Celery worker processes expose metrics on an isolated HTTP server running inside the container.
*   **Port**: `9101` (Configured via `WORKER_METRICS_PORT` env variable).
*   **Scraping Target**: `worker:9101/metrics`.

---

## 📊 Exposed Metrics List

The following metrics are exported for telemetry aggregation:

### 1. Backend API Metrics
*   `annotation_api_requests_total` (Counter):
    *   **Labels**: `method`, `path`, `status`
    *   **Description**: Total count of processed HTTP requests.
*   `annotation_api_request_duration_seconds` (Histogram):
    *   **Labels**: `method`, `path`
    *   **Buckets**: `0.005`, `0.01`, `0.025`, `0.05`, `0.1`, `0.3`, `0.5`, `1.0`, `2.0`, `5.0`
    *   **Description**: HTTP request-response latency profile.
*   `annotation_jobs_total` (Counter):
    *   **Labels**: `job_type`, `status`
    *   **Description**: Count of asynchronous job transitions (auto-label, export).

### 2. Celery Worker Metrics
*   `annotation_worker_jobs_total` (Counter):
    *   **Labels**: `job_type` (`auto_label`, `export`), `status` (`completed`, `failed`, `missing_job`)
    *   **Description**: Background tasks processed by Celery nodes.
*   `annotation_worker_job_duration_seconds` (Histogram):
    *   **Labels**: `job_type`
    *   **Buckets**: `0.05`, `0.1`, `0.2`, `0.5`, `1.0`, `2.0`, `5.0`, `10.0`, `30.0`, `60.0`
    *   **Description**: Time taken for worker task execution (includes ML inference call and zipping latency).

---

## 🚨 Alerting Recommendations

Configure Prometheus alert rules to monitor the following failure thresholds:

### 1. API Error Spike
Triggers if the percentage of HTTP `5xx` responses exceeds 2% over a 5-minute interval:
```yaml
alert: ApiHighErrorRate
expr: sum(rate(annotation_api_requests_total{status=~"5.."}[5m])) / sum(rate(annotation_api_requests_total[5m])) * 100 > 2
for: 2m
labels:
  severity: critical
annotations:
  summary: "API Error rate is high ({{ $value }}%)"
```

### 2. Auto-Label Task Failure rate
Triggers if background inference failures spike:
```yaml
alert: AutoLabelWorkerFailures
expr: sum(rate(annotation_worker_jobs_total{job_type="auto_label", status="failed"}[10m])) > 1
for: 5m
labels:
  severity: warning
annotations:
  summary: "Auto-label worker is failing tasks"
```

### 3. ML Inference Latency
Triggers if average ML inference execution time exceeds 10 seconds:
```yaml
alert: WorkerSlowInference
expr: histogram_quantile(0.95, sum(rate(annotation_worker_job_duration_seconds_bucket{job_type="auto_label"}[5m])) by (le)) > 10
for: 5m
labels:
  severity: warning
annotations:
  summary: "95th percentile auto-label duration is high ({{ $value }}s)"
```

---

## 🌸 Flower Queue Monitoring

Flower provides a real-time web dashboard for Celery queues.

*   **Access Port**: `5555` (Mapped when deploying compose profiles or starting Flower locally).
*   **Key Monitoring Tasks**:
    *   **Active Workers**: Check number of worker nodes currently online.
    *   **Task State Tracking**: View lists of `Succeeded`, `Failed`, and `Processed` tasks.
    *   **Queue Lengths**: Monitor queue backlog to determine if horizontal scaling (`--scale worker=N`) is required.
    *   **Task Details**: Inspect runtime arguments and stack traces for failed background jobs.
