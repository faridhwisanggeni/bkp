// Test setup file - NO REAL DATABASE ACCESS
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';

// Global test timeout
jest.setTimeout(10000);

// Global mock for database pool - PREVENT ANY REAL DB ACCESS
jest.mock('../src/db/pool', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }
}));

// Global mock for config database
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
}));

// Mock external services - NO EXTERNAL CALLS
jest.mock('../src/middlewares/logger', () => ({
  httpLogger: (req, res, next) => next()
}));

jest.mock('../src/middlewares/timeout', () => ({
  timeoutGuard: () => (req, res, next) => next()
}));

jest.mock('../src/middlewares/error', () => ({
  errorHandler: (err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  },
  notFoundHandler: (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
}));

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
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
    role_id: 2,
    is_active: true,
    ...overrides
  }),

  createTestRole: (overrides = {}) => ({
    role_name: 'test_role',
    is_active: true,
    ...overrides
  }),

  generateRandomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,

  generateRandomString: (length = 10) => Math.random().toString(36).substr(2, length)
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
