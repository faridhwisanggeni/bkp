// Test setup file for Order Service
const { Pool } = require('pg');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5434';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'test_order_db';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.RABBITMQ_URL = process.env.TEST_RABBITMQ_URL || 'amqp://localhost:5672';

// Global test timeout
jest.setTimeout(15000);

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
  createTestOrder: (overrides = {}) => ({
    username: 'test-user',
    total_harga: 999.99,
    items: [
      {
        id_product: 1,
        qty: 1,
        original_price: 999.99,
        id_promo: null,
        deduct_price: 0,
        total_price: 999.99
      }
    ],
    ...overrides
  }),

  createTestOrderItem: (overrides = {}) => ({
    id_product: 1,
    qty: 1,
    original_price: 99.99,
    id_promo: null,
    deduct_price: 0,
    total_price: 99.99,
    ...overrides
  }),

  generateRandomUsername: () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,

  generateRandomOrderId: () => `order-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,

  generateRandomPrice: (min = 10, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,

  createOrderWithItems: (itemCount = 2) => {
    const items = [];
    let totalPrice = 0;

    for (let i = 0; i < itemCount; i++) {
      const price = testHelpers.generateRandomPrice(50, 500);
      const qty = Math.floor(Math.random() * 3) + 1;
      const itemTotal = price * qty;
      
      items.push({
        id_product: i + 1,
        qty: qty,
        original_price: price,
        id_promo: null,
        deduct_price: 0,
        total_price: itemTotal
      });
      
      totalPrice += itemTotal;
    }

    return {
      username: testHelpers.generateRandomUsername(),
      total_harga: totalPrice,
      items: items
    };
  }
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
