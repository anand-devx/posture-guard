# --------------------
# Base Python image
# --------------------
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        ffmpeg \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .

# Upgrade pip and install Python packages
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy Python backend code
COPY ./src/python ./src/python

# --------------------
# Node build stage
# --------------------
FROM node:20-alpine AS node-build

WORKDIR /app

# Copy Node files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all Node source
COPY ./src ./src

# Build if you have a build step (like React)
RUN npm run build

# --------------------
# Final stage — merge both
# --------------------
FROM python:3.11-slim

# Install system dependencies again for Python runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        ffmpeg \
        curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed Python environment
COPY --from=base /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=base /usr/local/bin /usr/local/bin

# Copy Python code
COPY ./src/python ./src/python

# Copy Node build artifacts and node_modules
COPY --from=node-build /app /app

# Expose both ports — adjust as needed
EXPOSE 8000 3000

# Use a simple process manager to run both — install `tini` or `supervisord`
# For simplicity, here’s an example using `sh`:
CMD ["sh", "-c", "node ./src/server.js & python ./src/python/posture_analyzer.py"]

