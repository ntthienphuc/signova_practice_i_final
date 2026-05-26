#!/bin/bash
set -e

echo "[SIGNOVA] Running database migrations..."
alembic upgrade head

echo "[SIGNOVA] Seeding database curriculum..."
python scripts/seed_curriculum.py

# Detect the number of CPU cores/vCPUs (fallback to 2 if not found or 0)
CORES=$(python -c "import os; print(os.cpu_count() or 2)")
echo "[SIGNOVA] Detected $CORES CPU cores. Starting Uvicorn with $CORES workers..."
exec uvicorn api:app --host 0.0.0.0 --port ${PORT:-7860} --workers $CORES
