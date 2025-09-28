#!/bin/bash

echo "🔄 Restarting services (keeping databases)..."

# Stop only the application services, not databases
echo "🛑 Stopping application services..."
docker compose stop fe-admin-web-service user-service product-service order-service

# Remove only the application containers
echo "🗑️  Removing application containers..."
docker compose rm -f fe-admin-web-service user-service product-service order-service

# Remove only application images to force rebuild
echo "🖼️  Removing application images..."
docker rmi -f bkp-fe-admin-web-service:latest 2>/dev/null || true
docker rmi -f bkp-user-service:latest 2>/dev/null || true
docker rmi -f bkp-product-service:latest 2>/dev/null || true
docker rmi -f bkp-order-service:latest 2>/dev/null || true

# Build and start only application services
echo "🔨 Building and starting application services..."
docker compose up -d --build fe-admin-web-service user-service product-service order-service

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if databases are still running
echo "🔍 Checking database status..."
if docker compose ps db-user | grep -q "Up"; then
    echo "✅ User database is running"
else
    echo "⚠️  User database is not running, starting it..."
    docker compose up -d db-user
fi

if docker compose ps db-product | grep -q "Up"; then
    echo "✅ Product database is running"
else
    echo "⚠️  Product database is not running, starting it..."
    docker compose up -d db-product
fi

if docker compose ps db-order | grep -q "Up"; then
    echo "✅ Order database is running"
else
    echo "⚠️  Order database is not running, starting it..."
    docker compose up -d db-order
fi

if docker compose ps rabbitmq | grep -q "Up"; then
    echo "✅ RabbitMQ is running"
else
    echo "⚠️  RabbitMQ is not running, starting it..."
    docker compose up -d rabbitmq
fi

# Wait for databases to be ready if they were started
echo "⏳ Ensuring databases are ready..."
sleep 3

# Test database connections
echo "🔌 Testing database connections..."
# Use gtimeout on macOS or timeout on Linux
if command -v gtimeout >/dev/null 2>&1; then
    TIMEOUT_CMD="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
    TIMEOUT_CMD="timeout"
else
    echo "⚠️  Timeout command not available, skipping connection test"
    TIMEOUT_CMD=""
fi

if [ -n "$TIMEOUT_CMD" ]; then
    $TIMEOUT_CMD 30 bash -c 'until docker exec db-user pg_isready -U postgres; do sleep 1; done' && echo "✅ User DB ready" || echo "❌ User DB timeout"
    $TIMEOUT_CMD 30 bash -c 'until docker exec db-product pg_isready -U postgres; do sleep 1; done' && echo "✅ Product DB ready" || echo "❌ Product DB timeout"
    $TIMEOUT_CMD 30 bash -c 'until docker exec db-order pg_isready -U postgres; do sleep 1; done' && echo "✅ Order DB ready" || echo "❌ Order DB timeout"
else
    # Simple check without timeout
    docker exec db-user pg_isready -U postgres && echo "✅ User DB ready" || echo "❌ User DB not ready"
    docker exec db-order pg_isready -U postgres && echo "✅ Order DB ready" || echo "❌ Order DB not ready"
fi

echo "✅ Service restart completed!"
echo ""
echo "🌐 Services available at:"
echo "   - Frontend: http://localhost:5173"
echo "   - User Service: http://localhost:3000"
echo "   - Product Service: http://localhost:3002"
echo "   - Order Service: http://localhost:3003"
echo "   - User DB: localhost:5432"
echo "   - Product DB: localhost:5433"
echo "   - Order DB: localhost:5434"
echo "   - RabbitMQ Management: http://localhost:15672 (admin/admin123)"
