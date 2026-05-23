#!/bin/bash
set -e

echo "[SIGNOVA] Running database migrations..."
alembic upgrade head

echo "[SIGNOVA] Seeding database curriculum..."
python scripts/seed_curriculum.py

echo "[SIGNOVA] Starting FastAPI application on port ${PORT:-7860}..."
exec uvicorn api:app --host 0.0.0.0 --port ${PORT:-7860}
