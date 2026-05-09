FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install build deps and uv-style fast install via pip
COPY pyproject.toml /app/pyproject.toml
RUN pip install --upgrade pip && pip install \
    "fastapi[standard]>=0.115" \
    "uvicorn[standard]>=0.30" \
    "sqlalchemy>=2.0" \
    "pydantic>=2.7" \
    "pydantic-settings>=2.3" \
    "bcrypt>=4.1" \
    "pyjwt>=2.8" \
    "python-multipart>=0.0.9"

COPY app /app/app
COPY static /app/static

# Persistent SQLite database lives under /data so it survives restarts when a
# volume is mounted (Fly.io: `[mounts]`, HF Spaces: persistent storage, etc.).
ENV DATABASE_URL="sqlite:////data/casino.db" \
    STATIC_DIR=/app/static \
    PORT=8080

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
