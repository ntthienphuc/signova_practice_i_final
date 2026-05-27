#!/bin/bash
set -e

echo "[SIGNOVA] Running database migrations..."
alembic upgrade head

echo "[SIGNOVA] Seeding database curriculum..."
python scripts/seed_curriculum.py

# Detect the number of CPU cores/vCPUs, capped at 8 to avoid host-level overcommit in shared containers
CORES=$(python -c "import os; print(max(1, min(os.cpu_count() or 2, 8)))")
echo "[SIGNOVA] Detected $CORES CPU cores (capped at 8). Starting Uvicorn with $CORES workers..."
exec uvicorn api:app --host 0.0.0.0 --port ${PORT:-7860} --workers $CORES
