# Top-level Dockerfile for hosts that build from the repo root
# (Hugging Face Spaces, Koyeb, etc.). It just delegates to the backend image.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN pip install --upgrade pip && pip install \
    "fastapi[standard]>=0.115" \
    "uvicorn[standard]>=0.30" \
    "sqlalchemy>=2.0" \
    "pydantic>=2.7" \
    "pydantic-settings>=2.3" \
    "bcrypt>=4.1" \
    "pyjwt>=2.8" \
    "python-multipart>=0.0.9"

COPY backend/app /app/app
COPY backend/static /app/static

ENV DATABASE_URL="sqlite:////data/casino.db" \
    STATIC_DIR=/app/static \
    PORT=7860

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
