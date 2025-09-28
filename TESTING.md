# 🧪 Testing Documentation

This document provides comprehensive information about the testing system implemented for the BKP Commerce backend services.

## 📋 Overview

The testing suite includes:
- **Unit Tests** - Test individual components (controllers, models, services)
- **Integration Tests** - Test API endpoints and database interactions
- **Coverage Reports** - Code coverage analysis
- **RabbitMQ Tests** - Message queue integration testing

## 🏗️ Testing Architecture

### Services Covered
- **user-service** (Port 3000) - Authentication, user management
- **product-service** (Port 3002) - Products, promotions, stock validation
- **order-service** (Port 3003) - Order management, RabbitMQ integration

### Testing Framework
- **Jest** - Testing framework
- **Supertest** - HTTP endpoint testing
- **Mocking** - Database and external service mocking

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure all services have dependencies installed
cd user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
```

### Running Tests

#### All Tests
```bash
# Run all unit tests for all services
make test

# Run tests with coverage report
make test-coverage

# Run integration tests only
make test-integration
```

#### Service-Specific Tests
```bash
# Test individual services
make test-user           # User service unit tests
make test-product        # Product service unit tests
make test-order          # Order service unit tests

# Coverage for individual services
make test-user-coverage     # User service with coverage
make test-product-coverage  # Product service with coverage
make test-order-coverage    # Order service with coverage
```

#### Direct Script Usage
```bash
# Using the test runner script directly
./run-tests.sh unit all                    # All unit tests
./run-tests.sh coverage all                # All coverage tests
./run-tests.sh integration all             # All integration tests
./run-tests.sh unit user-service           # Specific service
./run-tests.sh coverage product-service    # Specific service with coverage
```

## 📁 Test Structure

### Directory Layout
```
service-name/
├── __tests__/
│   ├── setup.js                    # Test configuration
│   ├── controllers/
│   │   ├── auth.controller.test.js
│   │   ├── user.controller.test.js
│   │   └── ...
│   ├── models/
│   │   ├── user.model.test.js
│   │   └── ...
│   └── integration/
│       ├── auth.integration.test.js
│       ├── api.integration.test.js
│       └── rabbitmq.integration.test.js
├── jest.config.js                  # Jest configuration
└── package.json                    # Test scripts
```

## 🧪 Test Categories

### Unit Tests

#### Controllers
- HTTP request/response handling
- Input validation
- Business logic
- Error handling
- Authentication/authorization

#### Models
- Database operations (CRUD)
- Query building
- Data validation
- Transaction handling
- Relationship management

#### Services
- Business logic
- External API calls
- Data transformation
- Caching mechanisms

### Integration Tests

#### API Endpoints
- End-to-end request/response flow
- Database persistence
- Authentication workflows
- Error scenarios
- Data consistency

#### Database Integration
- Real database operations
- Transaction rollbacks
- Constraint validation
- Performance testing

#### RabbitMQ Integration
- Message publishing
- Message consumption
- Queue management
- Error handling
- Message persistence

## 📊 Coverage Reports

### Coverage Thresholds
- **Branches**: 70% minimum
- **Functions**: 70% minimum
- **Lines**: 70% minimum
- **Statements**: 70% minimum

### Viewing Coverage
```bash
# Generate coverage report
make test-coverage

# View HTML report (generated in coverage/ directory)
open user-service/coverage/lcov-report/index.html
open product-service/coverage/lcov-report/index.html
open order-service/coverage/lcov-report/index.html
```

## 🔧 Configuration

### Jest Configuration
Each service has its own `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Environment Variables
Test environment variables are set in `__tests__/setup.js`:

```javascript
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'test_db_name';
// ... other test-specific variables
```

## 🎯 Test Helpers

### Global Test Helpers
Each service includes test helpers in `__tests__/setup.js`:

```javascript
global.testHelpers = {
  createTestUser: (overrides = {}) => ({ /* ... */ }),
  createTestProduct: (overrides = {}) => ({ /* ... */ }),
  generateRandomEmail: () => `test-${Date.now()}@example.com`,
  // ... other helpers
};
```

### Mock Patterns
```javascript
// Database mocking
jest.mock('../../src/config/database');

// Service mocking
jest.mock('../../src/services/rabbitmq.service');

// Before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 🐛 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
cd user-service
npm test -- __tests__/controllers/auth.controller.test.js

# Run tests in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose
```

### Debug Mode
```bash
# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📝 Writing New Tests

### Controller Test Template
```javascript
const request = require('supertest');
const app = require('../../src/app');
const Model = require('../../src/models/model');

jest.mock('../../src/models/model');

describe('Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /endpoint', () => {
    it('should handle success case', async () => {
      Model.method.mockResolvedValue(mockData);
      
      const response = await request(app)
        .post('/endpoint')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### Model Test Template
```javascript
const Model = require('../../src/models/model');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database');

describe('Model', () => {
  beforeEach(() => {
    pool.query = jest.fn();
    jest.clearAllMocks();
  });

  describe('method', () => {
    it('should perform database operation', async () => {
      pool.query.mockResolvedValue({ rows: [mockData] });
      
      const result = await Model.method(params);
      
      expect(result).toEqual(mockData);
      expect(pool.query).toHaveBeenCalledWith(expectedQuery, expectedParams);
    });
  });
});
```

## 🔄 Continuous Integration

### Pre-commit Hooks
```bash
# Run tests before commit
npm test

# Run linting
npm run lint

# Run type checking (if applicable)
npm run type-check
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Ensure test database is running
docker compose up -d db-user db-product db-order

# Check connection settings in __tests__/setup.js
```

#### RabbitMQ Connection Errors
```bash
# Ensure RabbitMQ is running
docker compose up -d rabbitmq

# Check RabbitMQ management interface
open http://localhost:15672
```

#### Permission Errors
```bash
# Fix file permissions
make setup-permissions
```

#### Module Not Found Errors
```bash
# Install dependencies
cd service-name && npm install
```

## 📈 Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

### Memory Leak Detection
```bash
# Run tests with memory monitoring
node --inspect --expose-gc node_modules/.bin/jest --detectLeaks
```

## 🎉 Best Practices

### Test Organization
- ✅ Group related tests in describe blocks
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent and isolated
- ✅ Mock external dependencies

### Test Data
- ✅ Use test helpers for consistent data
- ✅ Generate random data to avoid conflicts
- ✅ Clean up test data after tests
- ✅ Use factories for complex objects

### Assertions
- ✅ Test both success and error cases
- ✅ Verify all important properties
- ✅ Use specific matchers (toBe, toEqual, etc.)
- ✅ Test edge cases and boundary conditions

### Mocking
- ✅ Mock external services and databases
- ✅ Clear mocks between tests
- ✅ Verify mock calls when important
- ✅ Use realistic mock data

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)

---

**Happy Testing! 🧪✨**
