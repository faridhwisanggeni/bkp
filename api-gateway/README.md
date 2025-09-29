# API Gateway - BKP Commerce

## Overview

API Gateway berfungsi sebagai **single entry point** untuk semua komunikasi antara Frontend dan Backend services. Gateway ini menyediakan centralized authentication, routing, rate limiting, dan monitoring.

## Architecture

```
Frontend (Port 5173) → API Gateway (Port 8080) → Backend Services
                                                 ├── User Service (Port 3000)
                                                 ├── Product Service (Port 3002)
                                                 └── Order Service (Port 3003)
```

## Features

### 🔐 **Authentication & Authorization**
- JWT token validation
- Automatic token refresh handling
- Role-based access control
- User context forwarding to downstream services

### 🚦 **Rate Limiting**
- 1000 requests per 15 minutes per IP
- Configurable rate limits
- DDoS protection

### 🔄 **Load Balancing & Proxy**
- HTTP proxy middleware
- Request/response logging
- Error handling and fallback
- Timeout management (10s)

### 📊 **Health Monitoring**
- Gateway health endpoint: `/health`
- Individual service health checks
- Service availability monitoring
- Response time tracking

### 🛡️ **Security**
- Helmet.js security headers
- CORS configuration
- Request compression
- Input validation

## API Endpoints

### Public Endpoints (No Authentication)
```
POST /api/auth/login     → user-service:/auth/login
POST /api/auth/refresh   → user-service:/auth/refresh
GET  /health            → Gateway health status
```

### Protected Endpoints (Requires JWT Token)
```
# User Management
GET    /api/users       → user-service:/api/users
POST   /api/users       → user-service:/api/users
PUT    /api/users/:id   → user-service:/api/users/:id

# Role Management  
GET    /api/roles       → user-service:/api/roles
POST   /api/roles       → user-service:/api/roles
PUT    /api/roles/:id   → user-service:/api/roles/:id

# Product Management
GET    /api/products    → product-service:/api/products
POST   /api/products    → product-service:/api/products
PUT    /api/products/:id → product-service:/api/products/:id

# Promotion Management
GET    /api/promotions  → product-service:/api/promotions
POST   /api/promotions  → product-service:/api/promotions
PUT    /api/promotions/:id → product-service:/api/promotions/:id

# Order Management
GET    /api/orders      → order-service:/api/orders
POST   /api/orders      → order-service:/api/orders
PUT    /api/orders/:id  → order-service:/api/orders/:id
```

## Environment Variables

```env
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=dev_access_secret_change_me
USER_SERVICE_URL=http://user-service:3000
PRODUCT_SERVICE_URL=http://product-service:3002
ORDER_SERVICE_URL=http://order-service:3003
```

## Usage Examples

### 1. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMeAdmin123!"}'
```

### 2. Get Users (with JWT token)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/users
```

### 3. Health Check
```bash
curl http://localhost:8080/health
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "pagination": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-09-29T22:58:00.000Z",
  "uptime": 120.5,
  "responseTime": "5ms",
  "services": [
    {
      "service": "user-service",
      "status": "healthy",
      "responseTime": "3ms",
      "statusCode": 200
    }
  ],
  "summary": {
    "total": 3,
    "healthy": 2,
    "unhealthy": 1
  }
}
```

## Error Handling

### Authentication Errors
- `401 MISSING_TOKEN` - No Authorization header
- `401 TOKEN_EXPIRED` - JWT token expired
- `401 INVALID_TOKEN` - Invalid JWT token
- `401 AUTH_FAILED` - General authentication failure

### Proxy Errors
- `503 PROXY_ERROR` - Service temporarily unavailable
- `404 API endpoint not found` - Invalid route
- `500 Internal gateway error` - Gateway internal error

## Monitoring & Logging

### Request Logging
```
🔄 Proxying POST /api/auth/login to http://user-service:3000/auth/login
✅ Response 200 for POST /api/auth/login
🔐 Authenticated user: admin@example.com (admin)
```

### Health Monitoring
- Automatic health checks every request to `/health`
- Service availability tracking
- Response time monitoring
- Error rate tracking

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Docker Development
```bash
# Build and start
docker compose up api-gateway -d --build

# View logs
docker compose logs api-gateway -f

# Restart service
docker compose restart api-gateway
```

## Security Considerations

1. **JWT Secrets**: Change default JWT secrets in production
2. **CORS**: Configure appropriate CORS origins
3. **Rate Limiting**: Adjust rate limits based on usage patterns
4. **HTTPS**: Use HTTPS in production
5. **Monitoring**: Implement proper monitoring and alerting

## Performance

- **Request Timeout**: 10 seconds
- **Rate Limit**: 1000 requests/15 minutes per IP
- **Compression**: Gzip compression enabled
- **Connection Pooling**: HTTP keep-alive enabled

## Troubleshooting

### Common Issues

1. **Service Unavailable (503)**
   - Check if backend services are running
   - Verify service URLs in environment variables
   - Check network connectivity between containers

2. **Authentication Failed (401)**
   - Verify JWT secret matches across services
   - Check token expiration
   - Ensure proper Authorization header format

3. **CORS Errors**
   - Verify CORS_ORIGIN environment variable
   - Check frontend URL configuration

### Debug Commands
```bash
# Check service status
docker compose ps

# View gateway logs
docker compose logs api-gateway --tail=50

# Test health endpoint
curl http://localhost:8080/health

# Test authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMeAdmin123!"}'
```

## Future Enhancements

- [ ] Request/Response caching
- [ ] API versioning support
- [ ] WebSocket proxy support
- [ ] Metrics collection (Prometheus)
- [ ] Circuit breaker pattern
- [ ] Request transformation
- [ ] API documentation generation
- [ ] Advanced rate limiting (per user/role)
