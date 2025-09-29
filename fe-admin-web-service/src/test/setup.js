import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage
const localStorageMock = {
  getItem: (key) => {
    return localStorageMock[key] || null
  },
  setItem: (key, value) => {
    localStorageMock[key] = value
  },
  removeItem: (key) => {
    delete localStorageMock[key]
  },
  clear: () => {
    Object.keys(localStorageMock).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete localStorageMock[key]
      }
    })
  }
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
})

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})

// Clean up after the tests are finished
afterAll(() => server.close())

// Global test helpers
global.testHelpers = {
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    ...overrides
  }),
  
  createMockProduct: (overrides = {}) => ({
    id: 1,
    name: 'Test Product',
    price: 100,
    stock: 10,
    description: 'Test description',
    ...overrides
  }),
  
  createMockOrder: (overrides = {}) => ({
    id: 1,
    userId: 1,
    products: [{ id: 1, quantity: 2 }],
    total: 200,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  mockAuthToken: 'mock-jwt-token',
  
  mockLocalStorage: (data = {}) => {
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]))
    })
  }
}
