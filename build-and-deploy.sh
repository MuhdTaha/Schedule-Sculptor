#!/bin/bash
# build-and-deploy.sh

set -e  # Exit on any error

echo "🚀 Starting build and deployment process..."

# Copy data files to web directory for Docker context
echo "📁 Copying data files to web directory..."
mkdir -p rag/web/data/processed/index
cp rag/data/processed/index/faiss.index rag/web/data/processed/index/
cp rag/data/processed/index/chunks.csv rag/web/data/processed/index/
cp rag/data/processed/index/config.json rag/web/data/processed/index/

echo "✅ Data files copied successfully"

# Navigate to web directory
cd rag/web

# Test Docker build locally with the FULL app
echo "🐳 Testing Docker build locally with full app..."
docker build -t schedule-sculptor-full .

echo "🐳 Testing Docker container locally with full app..."
docker run -d -p 8080:8080 --name full-container schedule-sculptor-full

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 15

# Test the container health endpoint
echo "🔍 Testing container health..."
if curl -f http://localhost:8080/health; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed, checking logs..."
    docker logs full-container
    docker stop full-container
    docker rm full-container
    exit 1
fi

# Test the main endpoint
echo "🔍 Testing main endpoint..."
curl http://localhost:8080/

# Stop and remove test container
docker stop full-container
docker rm full-container

# Deploy to Google Cloud Run
echo "🏗️  Building and deploying to Google Cloud Run..."
gcloud run deploy schedule-sculptor \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 600s \
    --set-env-vars="PYTHONUNBUFFERED=1" \
    --max-instances=1

# Navigate back to project root
cd ../..

# Clean up copied files
echo "🧹 Cleaning up temporary files..."
rm -rf rag/web/data

echo "🎉 Deployment completed!"