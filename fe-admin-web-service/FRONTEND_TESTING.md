# 🧪 Frontend Testing Documentation

This document provides comprehensive information about the testing system implemented for the BKP Commerce frontend application.

## 📋 Overview

The testing suite includes:
- **Unit Tests** - Test individual components, utilities, and API clients
- **Integration Tests** - Test page components and user interactions
- **End-to-End Tests** - Test complete user workflows across the application
- **Stress Tests** - Performance and load testing for API endpoints
- **Coverage Reports** - Code coverage analysis and reporting

## 🏗️ Testing Architecture

### Frontend Application
- **React Application** (Port 3001) - Admin dashboard with role-based access
- **Testing Framework** - Vitest for unit/integration tests, Playwright for E2E
- **Mock Service Worker** - API mocking for consistent test environments

### Testing Frameworks
- **Vitest** - Fast unit test runner with native ES modules support
- **React Testing Library** - Component testing with user-centric approach
- **Playwright** - Cross-browser end-to-end testing
- **Artillery** - Load and performance testing
- **MSW (Mock Service Worker)** - API request mocking

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

### Running Tests

#### All Tests
```bash
# Run all unit and integration tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run stress tests (requires backend services running)
npm run test:stress
```

#### Test Categories
```bash
# Unit tests only
npm test -- src/components/__tests__
npm test -- src/api/__tests__

# Integration tests only  
npm test -- src/pages/__tests__

# Specific test files
npm test -- Toast.test.jsx
npm test -- Login.test.jsx

# E2E tests with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
```

## 📁 Test Structure

### Directory Layout
```
fe-admin-web-service/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── Toast.test.jsx
│   │   │   ├── Modal.test.jsx
│   │   │   └── ProtectedRoute.test.jsx
│   │   └── ...
│   ├── api/
│   │   ├── __tests__/
│   │   │   ├── client.test.js
│   │   │   ├── productClient.test.js
│   │   │   └── orderClient.test.js
│   │   └── ...
│   ├── pages/
│   │   ├── __tests__/
│   │   │   ├── Login.test.jsx
│   │   │   └── ...
│   │   └── ...
│   └── test/
│       ├── setup.js
│       └── mocks/
│           ├── handlers.js
│           └── server.js
├── e2e/
│   ├── login.spec.js
│   └── ...
├── stress-tests/
│   ├── load-test.yml
│   └── stress-test-processor.js
├── vitest.config.js
├── playwright.config.js
└── .github/workflows/test.yml
```

## 🧪 Test Categories

### Unit Tests

#### Components (`src/components/__tests__/`)
- **Toast System** - Toast notifications, context provider, error formatting
- **Modal Component** - Modal rendering, interactions, accessibility
- **ProtectedRoute** - Authentication checks, role-based redirects
- **Layout Components** - Header, Sidebar, SimpleLayout

#### API Clients (`src/api/__tests__/`)
- **Main Client** - Request/response interceptors, token refresh flow
- **Product Client** - Product service API interactions
- **Order Client** - Order service API interactions
- **Error Handling** - Network errors, timeouts, authentication failures

#### Utilities and Helpers
- **Test Helpers** - Mock data generators, localStorage mocking
- **Error Formatters** - User-friendly error message formatting
- **Authentication Utils** - JWT token handling, role extraction

### Integration Tests

#### Page Components (`src/pages/__tests__/`)
- **Login Page** - Form interactions, authentication flow, role-based redirects
- **Dashboard** - Admin dashboard functionality, stats display
- **User Management** - CRUD operations, search, filtering
- **Product Management** - Product CRUD, inventory management
- **Order Management** - Order processing, status updates

#### User Workflows
- **Authentication Flow** - Login, logout, token refresh
- **Admin Operations** - User and role management
- **Sales Operations** - Product and promotion management
- **Customer Operations** - Product browsing, order placement

### End-to-End Tests (`e2e/`)

#### Critical User Flows
- **Login Flow** - Complete authentication process
- **Admin Workflow** - User management, role assignment
- **Sales Workflow** - Product management, promotion creation
- **Error Scenarios** - Network failures, validation errors
- **Responsive Design** - Mobile and desktop compatibility

#### Cross-Browser Testing
- **Chromium** - Primary browser testing
- **Firefox** - Alternative browser compatibility
- **Safari/WebKit** - Apple ecosystem compatibility
- **Mobile Browsers** - Touch interactions, responsive design

### Stress Tests (`stress-tests/`)

#### Load Testing Scenarios
- **Authentication Load** - Login/logout stress testing
- **API Endpoint Load** - CRUD operations under load
- **Concurrent Users** - Multiple simultaneous user sessions
- **Database Stress** - High-volume data operations

#### Performance Metrics
- **Response Times** - P95 and P99 response time tracking
- **Success Rates** - Error rate monitoring under load
- **Resource Usage** - Memory and CPU utilization
- **Throughput** - Requests per second capacity

## 📊 Coverage Reports

### Coverage Thresholds
- **Branches**: 70% minimum
- **Functions**: 70% minimum  
- **Lines**: 70% minimum
- **Statements**: 70% minimum

### Viewing Coverage
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# View coverage in terminal
npm run test:coverage -- --reporter=text
```

### Coverage Configuration
```javascript
// vitest.config.js
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

## 🔧 Configuration

### Vitest Configuration (`vitest.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      // Coverage configuration
    }
  }
})
```

### Playwright Configuration (`playwright.config.js`)
```javascript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
```

### MSW Configuration (`src/test/mocks/`)
```javascript
// handlers.js - API route mocking
export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    // Mock login logic
  }),
  // ... other handlers
]

// server.js - Test server setup
export const server = setupServer(...handlers)
```

## 🎯 Test Helpers and Utilities

### Global Test Helpers (`src/test/setup.js`)
```javascript
global.testHelpers = {
  createMockUser: (overrides = {}) => ({ /* ... */ }),
  createMockProduct: (overrides = {}) => ({ /* ... */ }),
  createMockOrder: (overrides = {}) => ({ /* ... */ }),
  mockAuthToken: 'mock-jwt-token',
  mockLocalStorage: (data = {}) => { /* ... */ }
}
```

### Custom Matchers
```javascript
// Extended Jest DOM matchers
expect(element).toBeInTheDocument()
expect(element).toHaveClass('active')
expect(element).toHaveAttribute('aria-label', 'Close')
```

### Mock Patterns
```javascript
// API mocking
vi.mock('../api/client')
const mockedApi = vi.mocked(api)

// Component mocking
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// localStorage mocking
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})
```

## 🐛 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npm test -- Login.test.jsx

# Run tests in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose

# Debug specific test
npm test -- --no-coverage Login.test.jsx
```

### Debug Mode
```bash
# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/vitest --run

# Debug Playwright tests
npx playwright test --debug
```

### Common Debugging Techniques
```javascript
// Console debugging
console.log(screen.debug()) // Print DOM structure

// Breakpoint debugging
debugger // Pause execution

// Query debugging
screen.logTestingPlaygroundURL() // Get testing playground URL

// Wait debugging
await waitFor(() => {
  console.log('Waiting for element...')
  expect(element).toBeInTheDocument()
})
```

## 📝 Writing New Tests

### Component Test Template
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Component from '../Component'

describe('Component', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    render(<Component />)
    await user.click(screen.getByRole('button'))
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

### API Client Test Template
```javascript
import { describe, it, expect, vi } from 'vitest'
import apiClient from '../apiClient'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should make successful API calls', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true } })
    
    const result = await apiClient.get('/endpoint')
    
    expect(result.data.success).toBe(true)
    expect(mockedAxios.get).toHaveBeenCalledWith('/endpoint')
  })
})
```

### E2E Test Template
```javascript
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test('should complete user workflow', async ({ page }) => {
    await page.goto('/feature')
    
    await page.getByRole('button', { name: 'Action' }).click()
    
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

## 🔄 Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)
- **Unit Tests** - Run on Node.js 18.x and 20.x
- **E2E Tests** - Cross-browser testing with Playwright
- **Coverage Reports** - Upload to Codecov
- **Build Tests** - Verify application builds successfully
- **Security Scans** - Dependency vulnerability checks

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

### CI/CD Pipeline Stages
1. **Lint and Format** - Code quality checks
2. **Unit Tests** - Component and utility testing
3. **Integration Tests** - Page component testing
4. **Build Test** - Application build verification
5. **E2E Tests** - End-to-end workflow testing
6. **Security Scan** - Dependency vulnerability assessment
7. **Performance Test** - Lighthouse CI performance testing

## 🛠️ Troubleshooting

### Common Issues

#### Test Environment Setup
```bash
# Clear test cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Mock Service Worker Issues
```bash
# Ensure MSW is properly configured
npm test -- --verbose src/test/setup.js
```

#### Playwright Browser Issues
```bash
# Reinstall browsers
npx playwright install --force

# Check browser installation
npx playwright install-deps
```

#### Coverage Issues
```bash
# Generate coverage with specific reporter
npm run test:coverage -- --reporter=verbose

# Check coverage thresholds
npm run test:coverage -- --coverage.thresholds.global.lines=60
```

## 📈 Performance Testing

### Load Testing with Artillery
```bash
# Run basic load test
npm run test:stress

# Run with custom configuration
npx artillery run stress-tests/load-test.yml --output report.json

# Generate HTML report
npx artillery report report.json
```

### Lighthouse Performance Testing
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run performance audit
lhci autorun
```

## 🎉 Best Practices

### Test Organization
- ✅ Group related tests in describe blocks
- ✅ Use descriptive test names that explain behavior
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent and isolated
- ✅ Mock external dependencies consistently

### Test Data Management
- ✅ Use test helpers for consistent mock data
- ✅ Generate random data to avoid test conflicts
- ✅ Clean up test data after each test
- ✅ Use factories for complex object creation

### Assertions and Expectations
- ✅ Test both success and error scenarios
- ✅ Verify all important component properties
- ✅ Use specific matchers (toBeInTheDocument, toHaveClass)
- ✅ Test edge cases and boundary conditions
- ✅ Ensure accessibility requirements are met

### Mocking Guidelines
- ✅ Mock external services and API calls
- ✅ Clear mocks between tests
- ✅ Verify mock calls when behavior is important
- ✅ Use realistic mock data that matches production
- ✅ Mock at the appropriate level (component vs service)

### E2E Testing Guidelines
- ✅ Focus on critical user workflows
- ✅ Test across multiple browsers and devices
- ✅ Use page object patterns for maintainability
- ✅ Handle async operations properly
- ✅ Take screenshots on failures for debugging

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Happy Testing! 🧪✨**

For questions or issues, please refer to the troubleshooting section or create an issue in the project repository.
