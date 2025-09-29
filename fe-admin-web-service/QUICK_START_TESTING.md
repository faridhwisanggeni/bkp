# 🚀 Quick Start - Frontend Testing

This guide helps you get started with testing the BKP Commerce frontend application quickly.

## ⚡ Prerequisites

```bash
# 1. Install Node.js 18+ 
node --version  # Should be 18.x or higher

# 2. Install dependencies
npm install

# 3. For E2E tests, install Playwright browsers
npx playwright install
```

## 🧪 Running Tests

### Quick Commands

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run stress tests (requires backend services)
npm run test:stress
```

### Using Make Commands (from project root)

```bash
# Frontend unit tests
make test-frontend-unit

# Frontend tests with coverage
make test-frontend-coverage

# Frontend E2E tests
make test-frontend-e2e

# All frontend tests
make test-frontend

# ALL tests (backend + frontend)
make test-all
```

## 📊 Test Coverage

After running `npm run test:coverage`, open the coverage report:

```bash
# View coverage report in browser
open coverage/index.html
```

**Coverage Targets:**
- Lines: 70%+
- Functions: 70%+
- Branches: 70%+
- Statements: 70%+

## 🎯 Test Categories

### ✅ Unit Tests (`src/**/__tests__/`)
- **Components**: Toast, Modal, ProtectedRoute
- **API Clients**: client.js, productClient.js, orderClient.js
- **Utilities**: Error formatting, test helpers

### 🔗 Integration Tests (`src/pages/__tests__/`)
- **Login Page**: Authentication flow, role-based redirects
- **Dashboard**: Admin interface, user management
- **CRUD Operations**: Users, products, orders

### 🌐 End-to-End Tests (`e2e/`)
- **User Workflows**: Complete login-to-action flows
- **Cross-browser**: Chrome, Firefox, Safari
- **Mobile**: Responsive design testing

### ⚡ Stress Tests (`stress-tests/`)
- **API Load Testing**: High-volume requests
- **Performance Metrics**: Response times, success rates
- **Concurrent Users**: Multiple simultaneous sessions

## 🐛 Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- Login.test.jsx

# Run in watch mode
npm run test:watch

# Debug with verbose output
npm test -- --verbose
```

### E2E Test Debugging
```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Debug specific test
npx playwright test login.spec.js --debug
```

## 🔧 Common Issues & Solutions

### Issue: Tests fail with "Cannot find module"
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Playwright browsers not found
```bash
# Solution: Reinstall browsers
npx playwright install --force
```

### Issue: MSW handlers not working
```bash
# Solution: Check test setup
npm test -- src/test/setup.js --verbose
```

### Issue: Coverage thresholds not met
```bash
# Solution: Run coverage with details
npm run test:coverage -- --reporter=verbose
```

## 📈 Performance Testing

### Prerequisites for Stress Tests
```bash
# 1. Start backend services
cd .. && make up

# 2. Verify services are running
curl http://localhost:3000/health
curl http://localhost:3002/health  
curl http://localhost:3003/health

# 3. Run stress tests
npm run test:stress
```

### Load Test Results
- **Response Time P95**: < 1000ms
- **Response Time P99**: < 2000ms
- **Success Rate**: > 95%
- **Error Rate**: < 5%

## 🎉 Success Indicators

### ✅ All Tests Passing
```
✅ Unit Tests: 45 passed
✅ Integration Tests: 12 passed  
✅ E2E Tests: 8 passed
✅ Coverage: 75%+ on all metrics
```

### ✅ Quality Checks
```
✅ ESLint: No errors
✅ Prettier: Code formatted
✅ TypeScript: No type errors
✅ Build: Successful
```

## 🚀 CI/CD Integration

Tests run automatically on:
- **Push to main/develop**
- **Pull requests**
- **Scheduled runs** (nightly)

View results in GitHub Actions tab.

## 📚 Next Steps

1. **Add More Tests**: Extend coverage for new components
2. **Performance Optimization**: Improve slow tests
3. **Visual Testing**: Add screenshot comparisons
4. **Accessibility Testing**: Add a11y test suite

## 🆘 Need Help?

- **Documentation**: See `FRONTEND_TESTING.md` for detailed info
- **Issues**: Check troubleshooting section in main docs
- **Support**: Create issue in project repository

---

**Happy Testing! 🧪✨**
