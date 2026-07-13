FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxrender1 libxext6 curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create directory for heatmaps output
RUN mkdir -p /app/backend/public/heatmaps
RUN chmod -R 777 /app/backend

ENV FLASK_PORT=7860
EXPOSE 7860

CMD ["python", "app.py"]
