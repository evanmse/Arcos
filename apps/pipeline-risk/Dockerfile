# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for psycopg / lxml
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    build-essential libpq-dev libxml2-dev libxslt1-dev \
 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY src ./src
COPY data ./data
COPY alembic.ini ./
COPY alembic ./alembic

# Use uv for fast + robust dep resolution (pip's backtracking explodes on this graph)
RUN pip install --upgrade pip uv && uv pip install --system --no-cache .

USER 65532:65532

ENTRYPOINT ["python", "-m", "pipeline_risk.jobs.ingest_corpus"]
CMD ["--all"]
