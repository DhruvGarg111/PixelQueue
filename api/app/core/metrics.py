import time
from typing import Callable

from fastapi import Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest


REQUEST_COUNTER = Counter(
    "annotation_api_requests_total",
    "Total API requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "annotation_api_request_duration_seconds",
    "API request duration in seconds",
    ["method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5),
)

JOB_COUNTER = Counter(
    "annotation_jobs_total",
    "Background job status transitions",
    ["job_type", "status"],
)


async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    start = time.perf_counter()
    method = request.method
    status = "500"
    try:
        response = await call_next(request)
        status = str(response.status_code)
        return response
    except Exception:
        status = "500"
        raise
    finally:
        route = request.scope.get("route")
        path = getattr(route, "path", "unmatched") if route else "unmatched"
        REQUEST_COUNTER.labels(method=method, path=path, status=status).inc()
        REQUEST_LATENCY.labels(method=method, path=path).observe(time.perf_counter() - start)


def metrics_response() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

