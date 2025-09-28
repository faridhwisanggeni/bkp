.PHONY: up down restart logs status clean test test-coverage test-unit test-integration test-user test-product test-order test-user-coverage test-product-coverage test-order-coverage setup-permissions help

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
	@echo "🧪 Testing Commands:"
	@echo ""
	@echo "  make test           - Run all tests (unit + integration)"
	@echo "  make test-unit      - Run unit tests only"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo "  make test-integration - Run integration tests only"
	@echo ""
	@echo "  make test-user      - Test user-service only"
	@echo "  make test-product   - Test product-service only"
	@echo "  make test-order     - Test order-service only"
	@echo ""
	@echo "  make test-user-coverage    - User service with coverage"
	@echo "  make test-product-coverage - Product service with coverage"
	@echo "  make test-order-coverage   - Order service with coverage"
	@echo ""
	@echo "🔧 Utility Commands:"
	@echo ""
	@echo "  make setup-permissions - Set execute permissions for all .sh files"
	@echo ""
	@echo "  make help    - Show this help message"
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

test-order:
	@echo "🧪 Testing order-service..."
	@chmod +x run-tests.sh
	@./run-tests.sh unit order-service

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

# Setup file permissions
setup-permissions:
	@echo "🔧 Setting up file permissions..."
	@chmod +x setup-permissions.sh
	@./setup-permissions.sh
