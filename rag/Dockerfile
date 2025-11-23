FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY web/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all code + data
COPY . /app

# Copy start script
COPY web/start.sh /start.sh
RUN chmod +x /start.sh

# Set working directory to web (where app.py is)
WORKDIR /app/web

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/test || exit 1

# Run start script
CMD ["/start.sh"]
