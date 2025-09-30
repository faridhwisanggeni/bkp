// Test setup for API Gateway
const { beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8081'; // Different port for testing
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret';

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown
beforeAll(async () => {
  console.log('🧪 Setting up API Gateway tests...');
});

afterAll(async () => {
  console.log('✅ API Gateway tests completed');
});

beforeEach(() => {
  // Clear any cached modules
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'gateway.js',
    'middleware/**/*.js',
    '!node_modules/**',
    '!__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
