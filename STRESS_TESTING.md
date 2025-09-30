# Backend Stress Testing Guide

## Overview

This document describes the comprehensive stress testing infrastructure implemented for the BKP Commerce backend services. The stress testing system uses Artillery.io to simulate high-load scenarios and validate system performance under stress.

## Architecture

### Services Tested
- **API Gateway** (Port 8080) - Single entry point stress testing
- **User Service** (Port 3000) - Authentication and user management load
- **Product Service** (Port 3002) - Product CRUD and stock validation stress
- **Order Service** (Port 3003) - Order processing and RabbitMQ integration
- **RabbitMQ** (Port 5672) - Message queue performance testing

## Test Configurations

### 1. API Gateway Load Test (`api-gateway-load-test.yml`)

**Test Phases:**
- Warm-up: 30s @ 5 req/s
- Ramp-up: 60s @ 10-30 req/s
- Sustained: 120s @ 30 req/s
- Peak: 60s @ 50 req/s
- Cool-down: 30s @ 5 req/s

**Scenarios:**
- Authentication Load Test (30% weight)
- Health Check Load Test (20% weight)
- Protected Endpoints Load Test (50% weight)

**Performance Thresholds:**
- P95 < 1000ms
- P99 < 2000ms
- Median < 500ms
- 95% success rate

### 2. User Service Load Test (`user-service-load-test.yml`)

**Test Phases:**
- Warm-up: 30s @ 10 req/s
- Ramp-up: 60s @ 20-50 req/s
- Sustained: 120s @ 50 req/s
- Peak: 60s @ 100 req/s
- Cool-down: 30s @ 10 req/s

**Scenarios:**
- Authentication Load Test (40% weight)
- User CRUD Load Test (40% weight)
- Role Management Load Test (20% weight)

**Performance Thresholds:**
- P95 < 800ms
- P99 < 1500ms
- Median < 300ms
- 95% success rate

### 3. Product Service Load Test (`product-service-load-test.yml`)

**Test Phases:**
- Warm-up: 30s @ 15 req/s
- Ramp-up: 60s @ 25-60 req/s
- Sustained: 120s @ 60 req/s
- Peak: 60s @ 120 req/s
- Cool-down: 30s @ 15 req/s

**Scenarios:**
- Product CRUD Load Test (50% weight)
- Promotion CRUD Load Test (30% weight)
- Stock Validation Load Test (20% weight)

**Performance Thresholds:**
- P95 < 1000ms
- P99 < 2000ms
- Median < 400ms
- 95% success rate

### 4. Order Service Load Test (`order-service-load-test.yml`)

**Test Phases:**
- Warm-up: 30s @ 10 req/s
- Ramp-up: 60s @ 20-40 req/s
- Sustained: 120s @ 40 req/s
- Peak: 60s @ 80 req/s
- Cool-down: 30s @ 10 req/s

**Scenarios:**
- Order Creation Load Test (40% weight) - RabbitMQ intensive
- Order Retrieval Load Test (30% weight)
- Order Status Update Load Test (20% weight)
- Payment Processing Load Test (10% weight)

**Performance Thresholds:**
- P95 < 1500ms (order processing)
- P99 < 3000ms
- Median < 500ms
- 90% success rate (some orders may fail due to stock)

### 5. RabbitMQ Load Test (`rabbitmq-load-test.yml`)

**Test Phases:**
- Warm-up: 30s @ 5 req/s
- Ramp-up: 60s @ 10-25 req/s
- Sustained: 180s @ 25 req/s (longer for message processing)
- Peak: 60s @ 50 req/s
- Cool-down: 30s @ 5 req/s

**Scenarios:**
- RabbitMQ Message Flood Test (60% weight)
- Stock Validation Message Test (25% weight)
- Daily Limit Message Test (15% weight)

**Performance Thresholds:**
- P95 < 3000ms (message processing)
- P99 < 5000ms
- Median < 1000ms
- 85% success rate (stock/limit failures expected)

## Usage

### Prerequisites

1. **All services must be running:**
   ```bash
   make up
   ```

2. **Artillery installed globally:**
   ```bash
   npm install -g artillery
   ```

3. **netcat installed** (for service health checks)

### Running Stress Tests

#### Using Make Commands (Recommended)

```bash
# Run all backend stress tests
make test-backend-stress

# Run individual service tests
make test-stress-api-gateway
make test-stress-user-service
make test-stress-product-service
make test-stress-order-service
make test-stress-rabbitmq
```

#### Using Direct Script

```bash
# Run all tests
./run-stress-tests.sh

# Run specific test
./run-stress-tests.sh api-gateway
./run-stress-tests.sh user-service
./run-stress-tests.sh product-service
./run-stress-tests.sh order-service
./run-stress-tests.sh rabbitmq
```

#### Using Artillery Directly

```bash
# Run specific test file
npx artillery run stress-tests/api-gateway-load-test.yml
npx artillery run stress-tests/user-service-load-test.yml
npx artillery run stress-tests/product-service-load-test.yml
npx artillery run stress-tests/order-service-load-test.yml
npx artillery run stress-tests/rabbitmq-load-test.yml
```

### Generating Reports

The stress test runner automatically generates HTML reports:

```bash
# Reports are saved as:
api-gateway-report.html
user-service-report.html
product-service-report.html
order-service-report.html
rabbitmq-report.html
```

## Interpreting Results

### Key Metrics to Monitor

1. **Response Times:**
   - P50 (Median): 50% of requests complete within this time
   - P95: 95% of requests complete within this time
   - P99: 99% of requests complete within this time

2. **Success Rates:**
   - HTTP 200: Successful requests
   - HTTP 401: Authentication failures (expected in some tests)
   - HTTP 500: Server errors (should be minimal)

3. **Throughput:**
   - Requests per second (RPS)
   - Total requests completed

4. **RabbitMQ Specific:**
   - Message processing time
   - Queue depth
   - Message acknowledgment rate

### Performance Benchmarks

| Service | P95 Target | P99 Target | Success Rate |
|---------|------------|------------|--------------|
| API Gateway | < 1000ms | < 2000ms | > 95% |
| User Service | < 800ms | < 1500ms | > 95% |
| Product Service | < 1000ms | < 2000ms | > 95% |
| Order Service | < 1500ms | < 3000ms | > 90% |
| RabbitMQ | < 3000ms | < 5000ms | > 85% |

## Troubleshooting

### Common Issues

1. **Services Not Running:**
   ```bash
   # Check service status
   make status
   
   # Start services
   make up
   ```

2. **Artillery Not Found:**
   ```bash
   # Install globally
   npm install -g artillery
   ```

3. **High Error Rates:**
   - Check service logs: `make logs`
   - Verify database connections
   - Check RabbitMQ status

4. **Slow Response Times:**
   - Monitor system resources
   - Check database performance
   - Verify network connectivity

### Monitoring During Tests

```bash
# Monitor service logs
make logs

# Check system resources
docker stats

# Monitor RabbitMQ
# Access: http://localhost:15672 (admin/admin123)
```

## Customization

### Modifying Test Parameters

Edit the YAML files in `stress-tests/` directory:

- **Phases**: Adjust duration and arrival rates
- **Scenarios**: Modify test scenarios and weights
- **Thresholds**: Update performance expectations
- **Variables**: Change test data

### Adding New Tests

1. Create new YAML configuration file
2. Add scenario to `run-stress-tests.sh`
3. Add make command to `Makefile`
4. Update documentation

## Integration with CI/CD

The stress tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Backend Stress Tests
  run: |
    make up
    sleep 30  # Wait for services to be ready
    make test-backend-stress
```

## Best Practices

1. **Run tests in isolated environment**
2. **Monitor system resources during tests**
3. **Establish baseline performance metrics**
4. **Run tests regularly to catch performance regressions**
5. **Adjust thresholds based on production requirements**
6. **Use realistic test data**
7. **Test different load patterns**

## Conclusion

This stress testing infrastructure provides comprehensive coverage of all backend services, including the critical RabbitMQ message processing system. Regular execution of these tests ensures the system can handle production load and helps identify performance bottlenecks before they impact users.
