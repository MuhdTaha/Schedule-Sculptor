#!/bin/bash
# start.sh
echo "Starting Schedule Sculptor API..."
cd /app/web
echo "Starting Gunicorn..."
export GUNICORN_PRELOAD="true" # Set environment variable for app.py logic
exec gunicorn app:app \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers 1 \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    --preload