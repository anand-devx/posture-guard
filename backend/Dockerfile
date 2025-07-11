# ---- Base image ----
FROM python:3.11-slim

# Install system dependencies for OpenCV
RUN apt-get update && \
    apt-get install -y python3-dev build-essential cmake libglib2.0-0 libsm6 libxext6 libxrender-dev ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy requirements
COPY backend/requirements.txt .

# Install Python packages
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy all backend code
COPY backend/ .

# If you have Node/Express too, install Node
# FROM node:20-alpine AS node
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# Expose port (adjust as needed)
EXPOSE 8000

# Command to run Python server
CMD ["python", "src/python/posture_analyzer.py"]
