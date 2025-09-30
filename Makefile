.PHONY: up down restart logs status clean test test-coverage test-unit test-integration test-user test-product test-order test-user-coverage test-product-coverage test-order-coverage test-frontend test-frontend-unit test-frontend-coverage test-frontend-e2e test-frontend-stress test-frontend-lint test-backend-stress test-stress-api-gateway test-stress-user-service test-stress-product-service test-stress-order-service test-stress-rabbitmq test-all setup-permissions help

# Default target
help:
	@echo "🐳 Docker Management Commands:"
	@echo ""
	@echo "  make up      - Clean build and start all services"
	@echo "  make down    - Stop and clean all project resources"
	@echo "  make restart - Restart services (keep databases)"
	@echo "  make restart-full - Full restart (including databases)"
	@echo "  make logs    - Show logs from all services"
	@echo "  make status  - Show status of all containers"
	@echo "  make clean   - Deep clean (remove everything)"
	@echo ""
	@echo ""
	@echo "  make test           - Run all backend tests (unit + integration)"
	@echo "  make test-unit      - Run backend unit tests only"
	@echo "  make test-coverage  - Run backend tests with coverage report"
	@echo "  make test-integration - Run backend integration tests only"
	@echo "# Service-specific tests"
	@echo "  make test-gateway     - Test api-gateway"
	@echo "  make test-user        - Test user-service"
	@echo "  make test-product     - Test product-service"
	@echo "  make test-order       - Test order-service only"
	@echo ""
	@echo "  make test-user-coverage    - User service with coverage"
	@echo "  make test-product-coverage - Product service with coverage"
	@echo "  make test-order-coverage   - Order service with coverage"
	@echo ""
	@echo "🎨 Frontend Testing Commands:"
	@echo ""
	@echo "  make test-frontend         - Run all frontend tests"
	@echo "  make test-frontend-coverage - Run frontend tests with coverage"
	@echo "  make test-frontend-e2e     - Run frontend E2E tests"
	@echo "  make test-frontend-stress  - Run frontend stress tests"
	@echo "  make test-frontend-lint    - Run frontend code quality checks"
	@echo ""
	@echo "⚡ Backend Stress Testing Commands:"
	@echo "  make test-backend-stress       - Run all backend stress tests"
	@echo "  make test-stress-api-gateway   - Run API Gateway stress test"
	@echo "  make test-stress-user-service  - Run User Service stress test"
	@echo "  make test-stress-product-service - Run Product Service stress test"
	@echo "  make test-stress-order-service - Run Order Service stress test"
	@echo "  make test-stress-rabbitmq      - Run RabbitMQ message queue stress test"
	@echo ""
	@echo "🚀 Combined Testing Commands:"
	@echo "  make test-all          - Run all tests (backend + frontend)"
	@echo ""
	@echo "🔧 Utility Commands:"
	@echo ""
	@echo "  make setup-permissions - Set execute permissions for all .sh files"
	@echo ""
	@echo ""

# Start services with cleanup
up:
	@chmod +x docker-up.sh
	@./docker-up.sh

# Stop services with cleanup
down:
	@chmod +x docker-down.sh
	@./docker-down.sh

# Restart services (keep databases)
restart:
	@chmod +x docker-restart.sh
	@./docker-restart.sh

# Full restart (including databases)
restart-full: down up

# Show logs
logs:
	@docker compose logs -f

# Show container status
status:
	@echo "📊 Container Status:"
	@docker compose ps
	@echo ""
	@echo "💾 Volume Usage:"
	@docker volume ls | grep bkp || echo "No project volumes found"
	@echo ""
	@echo "🖼️  Image Usage:"
	@docker images | grep bkp || echo "No project images found"

# Deep clean everything
clean:
	@echo "🧹 Deep cleaning all Docker resources..."
	@docker system prune -af --volumes
	@echo "✅ Deep clean completed!"

# Testing commands
test:
	@echo "🧪 Running all tests (unit + integration)..."
	@chmod +x run-tests.sh
	@./run-tests.sh unit all
	@echo "✅ All tests completed!"

test-unit:
	@echo "🧪 Running unit tests only..."
	@chmod +x run-tests.sh
	@./run-tests.sh unit all
	@echo "✅ Unit tests completed!"

# Backend Stress Testing Commands
test-backend-stress:
	@echo "⚡ Running all backend stress tests..."
	@chmod +x run-stress-tests.sh
	@./run-stress-tests.sh all
	@echo "✅ All backend stress tests completed!"

test-stress-api-gateway:
	@echo "🌐 Running API Gateway stress test..."
	@chmod +x run-stress-tests.sh
	@./run-stress-tests.sh api-gateway
	@echo "✅ API Gateway stress test completed!"

test-stress-user-service:
	@echo "👤 Running User Service stress test..."
	@chmod +x run-stress-tests.sh
	@./run-stress-tests.sh user-service
	@echo "✅ User Service stress test completed!"

test-stress-product-service:
	@echo "📦 Running Product Service stress test..."
	@chmod +x run-stress-tests.sh
	@./run-stress-tests.sh product-service
	@echo "✅ Product Service stress test completed!"

test-stress-order-service:
	@echo "🛒 Running Order Service stress test..."
	@chmod +x run-stress-tests.sh
	@./run-stress-tests.sh order-service
	@echo "✅ Order Service stress test completed!"

test-stress-rabbitmq:
	@echo "🐰 Running RabbitMQ message queue stress test..."
	@chmod +x run-stress-tests.sh
	@./run-stress-tests.sh rabbitmq
	@echo "✅ RabbitMQ stress test completed!"

test-coverage:
	@echo "📊 Running tests with coverage report..."
	@chmod +x run-tests.sh
	@./run-tests.sh coverage all
	@echo "✅ Coverage tests completed!"

test-integration:
	@echo "🔗 Running integration tests only..."
	@chmod +x run-tests.sh
	@./run-tests.sh integration all
	@echo "✅ Integration tests completed!"

# Test specific services
test-user:
	@echo "🧪 Testing user-service..."
	@chmod +x run-tests.sh
	@./run-tests.sh unit user-service
test-product:
	@echo "🧪 Testing product-service..."
	@chmod +x run-tests.sh
	@./run-tests.sh unit product-service

test-gateway:
	@echo "🌐 Testing api-gateway..."
	@cd api-gateway && npm test
	@echo "✅ API Gateway tests completed!"

test-order:
	@echo "🛒 Testing order-service..."
	@cd order-service && npm test
	@echo "✅ Order service tests completed!"

# Coverage for specific services
test-user-coverage:
	@echo "📊 Testing user-service with coverage..."
	@chmod +x run-tests.sh
	@./run-tests.sh coverage user-service

test-product-coverage:
	@echo "📊 Testing product-service with coverage..."
	@chmod +x run-tests.sh
	@./run-tests.sh coverage product-service

test-order-coverage:
	@echo "📊 Testing order-service with coverage..."
	@chmod +x run-tests.sh
	@./run-tests.sh coverage order-service

# Frontend testing commands
test-frontend:
	@echo "🎨 Running all frontend tests..."
	@cd fe-admin-web-service && chmod +x run-tests.sh && ./run-tests.sh all

test-frontend-unit:
	@echo "🧪 Running frontend unit tests..."
	@cd fe-admin-web-service && chmod +x run-tests.sh && ./run-tests.sh unit

test-frontend-coverage:
	@echo "📊 Running frontend tests with coverage..."
	@cd fe-admin-web-service && chmod +x run-tests.sh && ./run-tests.sh coverage

test-frontend-e2e:
	@echo "🔗 Running frontend E2E tests..."
	@cd fe-admin-web-service && chmod +x run-tests.sh && ./run-tests.sh e2e

test-frontend-stress:
	@echo "⚡ Running frontend stress tests..."
	@cd fe-admin-web-service && chmod +x run-tests.sh && ./run-tests.sh stress

test-frontend-lint:
	@echo "🔍 Running frontend code quality checks..."
	@cd fe-admin-web-service && chmod +x run-tests.sh && ./run-tests.sh lint

# Combined testing command
test-all:
	@echo "🚀 Running ALL tests (backend + frontend)..."
	@echo ""
	@echo "📋 Step 1: Backend Tests"
	@make test
	@echo ""
	@echo "📋 Step 2: Frontend Tests"
	@make test-frontend-unit
	@make test-frontend-coverage
	@echo ""
	@echo "🎉 All tests completed successfully!"

# Setup file permissions
setup-permissions:
	@echo "🔧 Setting up file permissions..."
	@chmod +x setup-permissions.sh
	@./setup-permissions.sh
	@chmod +x fe-admin-web-service/run-tests.sh
