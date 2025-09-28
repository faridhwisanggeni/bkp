.PHONY: up down restart logs status clean help

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
	@echo "  make help    - Show this help message"
	@echo ""

# Start services with cleanup
up:
	@./docker-up.sh

# Stop services with cleanup
down:
	@./docker-down.sh

# Restart services (keep databases)
restart:
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
