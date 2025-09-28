#!/bin/bash

echo "🧹 Cleaning up existing containers and images..."

# Stop and remove all containers for this project
docker compose down --remove-orphans

# Remove all images related to this project
docker rmi -f $(docker images -q --filter "reference=bkp*") 2>/dev/null || true

# Remove all volumes for this project
docker volume rm bkp_db_user_data bkp_db_product_data 2>/dev/null || true

# Prune unused networks
docker network prune -f

echo "🏗️  Building and starting services..."

# Build and start all services
docker compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for databases to be healthy
echo "Waiting for databases..."
docker compose exec db-user pg_isready -U user-service-db -d db-user
docker compose exec db-product pg_isready -U product-service-db -d db-product

echo "✅ All services are up and running!"
echo ""
echo "🌐 Services available at:"
echo "   - Frontend: http://localhost:5173"
echo "   - User Service: http://localhost:3000"
echo "   - Product Service: http://localhost:3002"
echo "   - User DB: localhost:5432"
echo "   - Product DB: localhost:5433"