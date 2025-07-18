# ---- Base image ----
FROM python:3.11-slim

# Install system dependencies for OpenCV
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python packages
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy all backend code
COPY . .

# Expose port (adjust as needed)
EXPOSE 8000

# Command to run Python server
CMD ["python", "src/python/posture_analyzer.py"]
