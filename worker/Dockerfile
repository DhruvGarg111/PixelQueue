FROM python:3.12-slim

WORKDIR /workspace

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/workspace/api

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt /workspace/api-requirements.txt
COPY worker/requirements.txt /workspace/worker-requirements.txt
RUN pip install --no-cache-dir -r /workspace/api-requirements.txt -r /workspace/worker-requirements.txt

COPY . /workspace

CMD ["celery", "-A", "worker.worker_tasks:celery", "worker", "--loglevel=INFO", "--concurrency=2"]
