FROM python:3.11-slim-bookworm

# Install system dependencies required for OpenCV, Mediapipe, ONNX Runtime, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set up environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

WORKDIR /code

# Copy requirements file
COPY requirements_api.txt .

# Install dependencies - Use PyTorch CPU-only wheels to keep the container size small
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements_api.txt

# Copy application source code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY scripts/ ./scripts/
COPY models/ ./models/
COPY outputs/ ./outputs/
COPY api.py .
COPY alembic.ini .
COPY gloss.csv .
COPY entrypoint.sh .

# Set execution permission for entrypoint script
RUN chmod +x entrypoint.sh

# Expose port 7860 as expected by Hugging Face Spaces
EXPOSE 7860

# Run entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
