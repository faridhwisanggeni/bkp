#!/bin/bash

echo "🛑 Stopping all services..."

# Stop and remove all containers
docker compose down --remove-orphans --volumes

# Force remove any remaining containers
echo "Force removing any remaining project containers..."
docker ps -aq --filter "name=bkp" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=user-service" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=product-service" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=order-service" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=fe-admin-web-service" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=db-user" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=db-product" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=db-order" | xargs -r docker rm -f 2>/dev/null || true
docker ps -aq --filter "name=rabbitmq" | xargs -r docker rm -f 2>/dev/null || true

echo "🧹 Cleaning up project resources..."

# Remove all images related to this project
echo "Removing project images..."
docker rmi -f $(docker images -q --filter "reference=bkp*") 2>/dev/null || true
docker rmi -f $(docker images -q --filter "reference=*user-service*") 2>/dev/null || true
docker rmi -f $(docker images -q --filter "reference=*product-service*") 2>/dev/null || true
docker rmi -f $(docker images -q --filter "reference=*order-service*") 2>/dev/null || true
docker rmi -f $(docker images -q --filter "reference=*fe-admin-web-service*") 2>/dev/null || true

# Remove all volumes for this project
echo "Removing project volumes..."
docker volume rm bkp_db_user_data bkp_db_product_data bkp_db_order_data bkp_rabbitmq_data 2>/dev/null || true

# Also remove any volumes that might be created with different naming
echo "Removing any remaining project volumes..."
docker volume ls -q | grep -E "(bkp|user|product|order|rabbitmq)" | xargs -r docker volume rm 2>/dev/null || true

# Remove unused networks
echo "Cleaning up networks..."
docker network prune -f

# Remove unused build cache (optional)
echo "Cleaning up build cache..."
docker builder prune -f

echo "✅ All project resources have been cleaned up!"
echo ""

# Verify volumes are removed
echo "🔍 Verifying volumes are removed..."
REMAINING_VOLUMES=$(docker volume ls -q | grep -E "(bkp|user|product|order|rabbitmq)" | wc -l)
if [ "$REMAINING_VOLUMES" -eq 0 ]; then
    echo "✅ All project volumes successfully removed"
else
    echo "⚠️  Warning: $REMAINING_VOLUMES project volumes still exist"
    docker volume ls | grep -E "(bkp|user|product|order|rabbitmq)"
fi

echo ""
echo "📊 Current Docker status:"
docker system df
