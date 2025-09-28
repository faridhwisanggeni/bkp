#!/bin/bash

echo "🛑 Stopping all services..."

# Stop and remove all containers
docker compose down --remove-orphans

echo "🧹 Cleaning up project resources..."

# Remove all images related to this project
echo "Removing project images..."
docker rmi -f $(docker images -q --filter "reference=bkp*") 2>/dev/null || true

# Remove all volumes for this project
echo "Removing project volumes..."
docker volume rm bkp_db_user_data bkp_db_product_data 2>/dev/null || true

# Remove unused networks
echo "Cleaning up networks..."
docker network prune -f

# Remove unused build cache (optional)
echo "Cleaning up build cache..."
docker builder prune -f

echo "✅ All project resources have been cleaned up!"
echo ""
echo "📊 Current Docker status:"
docker system df
