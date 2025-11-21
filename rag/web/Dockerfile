FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model during build
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy application code
COPY . .

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Starting Schedule Sculptor API..."\n\
cd /app\n\
echo "Starting Gunicorn with main app..."\n\
exec gunicorn app:app --bind 0.0.0.0:8080 --workers 1 --timeout 120 --access-logfile - --error-logfile - --preload\n\
' > /start.sh && chmod +x /start.sh

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/test || exit 1

CMD ["/start.sh"]