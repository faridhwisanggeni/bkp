# BKP Commerce - Order Management System

Sistem ini terkait order management sistem yang dibuat secara sederhana dengan arsitektur microservices menggunakan API Gateway sebagai single entry point.

## 🚨 Keterbatasan Sistem

Beberapa fitur memiliki kekurangan sesuai dengan scope yang ada, seperti:
1. **Fitur pembayaran** menggunakan kartu kredit yang dipastikan akan selalu berhasil, demi kelancaran dari pengujian transaksi.
2. **Fitur delivery atau pengiriman** tidak tersedia saat ini.
3. **Fitur RBAC** saat ini tidak diimplementasikan secara penuh.

## 🎯 Fitur Yang Tersedia

### 👨‍💼 Fitur Admin
1. Admin dapat melakukan maintenance terhadap data user
2. Admin dapat melakukan maintenance terhadap data role

### 👨‍💻 Fitur Sales Team 
1. Sales dapat melakukan maintenance terhadap data product
2. Sales dapat melakukan maintenance terhadap data promotion
3. Sales dapat melakukan maintenance terhadap data order

### 👤 Fitur Customer
1. Customer dapat melihat produk dan promotion yang ada pada page utama
2. Customer dapat melakukan checkout pada page utama
3. Customer dapat melakukan pembayaran secara fake sehingga transaksi akan selalu berhasil dan status order completed

## 🛠️ Teknologi Stack

1. **Frontend**: ReactJS
2. **Backend**: NodeJS (Express)
3. **Database**: PostgreSQL
4. **Message Queue**: RabbitMQ
5. **In-memory Database**: Redis
6. **Container**: Docker & Docker Compose
7. **API Gateway**: Custom Express Gateway

## 🏗️ Arsitektur Sistem

### Konsep General
1. **Frontend-First**: Semua kegiatan akan dilakukan menggunakan frontend
2. **API Gateway Pattern**: Frontend berkomunikasi dengan gateway sebagai single entry point
3. **Microservices**: Gateway meneruskan request ke microservice yang sesuai
4. **Asynchronous Communication**: Order-service dan product-service berkomunikasi via RabbitMQ dan Redis

### Konsep Spesifik

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│   Frontend  │───▶│ API Gateway │───▶│   Microservices │
│  (Port 5173)│    │ (Port 8080) │    │                 │
└─────────────┘    └─────────────┘    └─────────────────┘
                           │                     │
                           ▼                     ▼
                   ┌─────────────┐    ┌─────────────────┐
                   │ Rate Limit  │    │  User Service   │
                   │ Auth & JWT  │    │   (Port 3000)   │
                   │ Monitoring  │    │                 │
                   └─────────────┘    │ Product Service │
                                      │   (Port 3002)   │
                                      │                 │
                                      │  Order Service  │
                                      │   (Port 3003)   │
                                      └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   RabbitMQ      │
                                    │   (Port 5672)   │
                                    │                 │
                                    │     Redis       │
                                    │   (Port 6379)   │
                                    │                 │
                                    │   PostgreSQL    │
                                    │   (Port 5432+)  │
                                    └─────────────────┘
```

## 📦 Services Overview

### API Gateway (Port 8080)
- **Single Entry Point** untuk semua API calls
- **JWT Authentication & Authorization**
- **Rate Limiting** (1000 req/15min per IP)
- **Request Proxying** ke backend services
- **Health Monitoring** semua services

### User Service (Port 3000)
- **Authentication** (login/refresh token)
- **User Management** (CRUD operations)
- **Role Management** (CRUD operations)

### Order Processing Flow
1. Order Created → RabbitMQ → Order Service (Validation Response)
2. Order Service → RabbitMQ → Product Service (Stock Validation)
3. Product Service → RabbitMQ → Order Service (Validation Response)
1. Order Created → RabbitMQ → Product Service (Stock Validation)
2. Product Service → RabbitMQ → Order Service (Validation Response)
3. Order Service → Payment Processing → Stock Reduction
4. Final Status: processed/cancelled/failed
```

### Key Exchanges & Queues
- **Exchanges**: `order.events`, `stock.events`
- **Queues**: `order.created`, `stock.validation.response`, `stock.limit.response`
- **Features**: Message persistence, acknowledgment, retry logic

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Git
- Make (optional, untuk convenience commands)

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd bkp

# First time setup (builds and starts all services)
make up

# Access the application
# Frontend: http://localhost:5173
# API Gateway: http://localhost:8080
# RabbitMQ Management: http://localhost:15672 (admin/admin123)
```

## 📋 Make Commands

### ⚠️ PERHATIAN PENTING
**Mohon diperhatikan point-point dibawah ini, karena akan berpotensi menghilangkan data yang sudah anda buat jika anda salah dalam menggunakan command.**

### Basic Commands
```bash
# First time setup
make up                 # Build dan start semua services

# Service management
make restart           # Restart services only (keep databases)
make restart-full      # Restart everything including databases
make down             # Stop dan remove ALL containers & images

# Monitoring
make status           # Check service status
make logs             # View all service logs
make health           # Check service health
```

### Testing Commands
```bash
# Backend Testing
make test             # Run all backend tests
make test-unit        # Unit tests only
make test-coverage    # Tests with coverage
make test-integration # Integration tests

# Service-specific tests
make test-user        # Test user-service
make test-product     # Test product-service  
make test-order       # Test order-service

# Frontend Testing
make test-frontend           # All frontend tests
make test-frontend-unit      # Frontend unit tests
make test-frontend-coverage  # Frontend coverage
make test-frontend-e2e       # End-to-end tests
make test-frontend-stress    # Load/stress tests
make test-frontend-lint      # Code quality checks

# Backend Stress Testing
make test-backend-stress       # All backend stress tests
make test-stress-api-gateway   # API Gateway stress test
make test-stress-user-service  # User Service stress test
make test-stress-product-service # Product Service stress test
make test-stress-order-service # Order Service stress test
make test-stress-rabbitmq      # RabbitMQ message queue stress test

# Combined Testing
make test-all         # Backend + Frontend tests
```

### Development Commands
```bash
# Database operations
make db-reset         # Reset all databases
make db-seed          # Seed databases with test data

# Cleanup
make clean            # Deep clean Docker resources
make clean-volumes    # Remove all volumes (⚠️ DATA LOSS)
```

## 🔐 Authentication & Authorization

### Default Users
```bash
# Admin User
Email: admin@example.com
Password: ChangeMeAdmin123!
Role: admin

# Sales User  
Email: sales@example.com
Password: ChangeMeSales123!
Role: sales

# Customer User
Email: customer@example.com
Password: ChangeMeCustomer123!
Role: customer
```

### JWT Token Flow
1. **Login** → API Gateway → User Service
2. **Response**: `{success: true, data: {accessToken, refreshToken}}`
3. **Protected Requests**: `Authorization: Bearer <accessToken>`
4. **Token Refresh**: Automatic via interceptors

## 🧪 Testing Infrastructure

### Backend Testing
- **Framework**: Jest + Supertest
- **Coverage**: 70%+ threshold
- **Types**: Unit, Integration, API tests
- **Mocking**: Database and external services

### Frontend Testing  
- **Framework**: Vitest + React Testing Library
- **E2E**: Playwright (Chrome, Firefox, Safari, Mobile)
- **Stress**: Artillery load testing
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: 70%+ threshold

### Backend Stress Testing
- **Framework**: Artillery.io for load testing
- **Services Covered**: API Gateway, User Service, Product Service, Order Service, RabbitMQ
- **Test Phases**: Warm-up → Ramp-up → Sustained → Peak → Cool-down
- **Performance Thresholds**: P95 < 1-3s, Success rate > 85-95%
- **Reports**: Automated HTML report generation

#### Stress Test Configurations

| Service | Peak Load | P95 Target | Success Rate | Special Features |
|---------|-----------|------------|--------------|------------------|
| API Gateway | 50 req/s | < 1000ms | > 95% | Authentication, Protected endpoints |
| User Service | 100 req/s | < 800ms | > 95% | CRUD operations, Role management |
| Product Service | 120 req/s | < 1000ms | > 95% | Stock validation, Promotions |
| Order Service | 80 req/s | < 1500ms | > 90% | RabbitMQ integration, Payment processing |
| RabbitMQ | 50 req/s | < 3000ms | > 85% | Message flood, Stock validation, Daily limits |

#### Running Stress Tests

```bash
# Prerequisites: All services must be running
make up

# Run all backend stress tests
make test-backend-stress

# Run individual service stress tests
make test-stress-api-gateway
make test-stress-user-service
make test-stress-product-service
make test-stress-order-service
make test-stress-rabbitmq

# Direct script usage
./run-stress-tests.sh all
./run-stress-tests.sh api-gateway
```

#### Stress Test Reports

After running stress tests, HTML reports are automatically generated:
- `api-gateway-report.html`
- `user-service-report.html`
- `product-service-report.html`
- `order-service-report.html`
- `rabbitmq-report.html`

### API Testing
- **Tools**: cURL, Postman collections
- **Authentication**: JWT token testing
- **Load Testing**: RabbitMQ message processing
- **Health Checks**: All services monitoring

## 📊 Monitoring & Health Checks

### Health Endpoints
```bash
# API Gateway health (includes all services)
curl http://localhost:8080/health

# Individual service health
curl http://localhost:3000/health  # User Service
curl http://localhost:3002/health  # Product Service  
curl http://localhost:3003/health  # Order Service
```

### Monitoring Tools
- **RabbitMQ Management**: http://localhost:15672
- **Service Logs**: `make logs`
- **Resource Usage**: `docker stats`
- **Database Connections**: Health check endpoints

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :5173  # Frontend
   lsof -i :8080  # API Gateway
   lsof -i :3000  # User Service
   ```

2. **Database Connection Issues**
   ```bash
   # Reset databases
   make db-reset
   
   # Check database logs
   docker compose logs db-user
   ```

3. **RabbitMQ Connection Issues**
   ```bash
   # Restart RabbitMQ
   docker compose restart rabbitmq
   
   # Check RabbitMQ logs
   docker compose logs rabbitmq
   ```

4. **Frontend Build Issues**
   ```bash
   # Rebuild frontend
   docker compose up fe-admin-web-service --build
   ```

### Debug Commands
```bash
# Service status
make status

# View logs
make logs

# Check containers
docker compose ps

# Check networks
docker network ls

# Check volumes  
docker volume ls
```

## 🔄 Development Workflow

### Making Changes
1. **Code Changes**: Edit source files
2. **Restart Services**: `make restart`
3. **Run Tests**: `make test`
4. **Check Health**: `make health`

### Database Changes
1. **Schema Changes**: Update migration files
2. **Reset Database**: `make db-reset`
3. **Seed Data**: `make db-seed`

### Adding New Features
1. **Backend**: Add to appropriate microservice
2. **Frontend**: Update React components
3. **API Gateway**: Add routing if needed
4. **Tests**: Add unit/integration tests
5. **Documentation**: Update README

## 📚 Additional Documentation

### API Documentation
- **Swagger/OpenAPI**: Available in each service
- **Postman Collection**: Import from `/docs` folder
- **API Gateway Routes**: See `/api-gateway/README.md`

### Architecture Details
- **RabbitMQ Flow**: See `RABBITMQ_FLOW.md`
- **Database Schema**: See `DATABASE_SETUP.md`
- **Testing Guide**: See `TESTING.md`

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎯 Quick Reference

### Service URLs
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **User Service**: http://localhost:3000  
- **Product Service**: http://localhost:3002
- **Order Service**: http://localhost:3003
- **RabbitMQ Management**: http://localhost:15672

### Key Commands
```bash
make up           # Start everything
make restart      # Restart services
make test-all     # Run all tests
make health       # Check health
make down         # Stop everything
```

### Default Login
```
Email: admin@example.com
Password: ChangeMeAdmin123!
```

**Happy Coding! 🚀**
