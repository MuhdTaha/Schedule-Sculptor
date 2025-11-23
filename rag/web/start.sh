#!/bin/bash
# start.sh
echo "Starting Schedule Sculptor API..."
cd /app/web
echo "Starting Gunicorn..."
exec gunicorn app:app \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers 1 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --preload