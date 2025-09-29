// Test setup file for Product Service
const { Pool } = require('pg');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5433';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'test_db_product';
process.env.DB_USER = process.env.TEST_DB_USER || 'product-service-db';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'product@!4';
process.env.RABBITMQ_URL = process.env.TEST_RABBITMQ_URL || 'amqp://localhost:5672';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test helpers
global.testHelpers = {
  createTestProduct: (overrides = {}) => ({
    product_name: 'Test Product',
    price: 99.99,
    qty: 10,
    is_active: true,
    ...overrides
  }),

  createTestPromotion: (overrides = {}) => ({
    product_id: 1,
    promotion_name: 'Test Promotion',
    promotion_type: 'discount',
    discount: 10,
    qty_max: 5,
    is_active: true,
    started_at: new Date(),
    ended_at: new Date(Date.now() + 86400000), // 1 day from now
    ...overrides
  }),

  generateRandomProductName: () => `Test Product ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,

  generateRandomPrice: (min = 10, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,

  generateRandomQty: (min = 1, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min
};

// Setup and teardown hooks
beforeAll(async () => {
  // Global setup if needed
});

afterAll(async () => {
  // Global cleanup if needed
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test if needed
});

// Dummy test to prevent "no tests" error
describe('Setup', () => {
  it('should configure test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
