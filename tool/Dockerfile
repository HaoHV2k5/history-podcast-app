# ==============================================================================
# Dockerfile for Whiteboard AI Rendering Tool & RAG Service (Python 3.11)
# ==============================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies (ffmpeg and ffprobe are critical for video/audio timeline processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Ensure runtime directories exist
RUN mkdir -p /app/web_app/outputs /app/data

EXPOSE 8000

WORKDIR /app/web_app

CMD ["python", "server.py"]
