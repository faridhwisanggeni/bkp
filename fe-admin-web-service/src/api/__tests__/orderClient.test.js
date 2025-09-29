import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import orderApi from '../orderClient'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_ORDER_API_BASE_URL: undefined
  }
}))

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('Order API Client', () => {
  let mockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLocation.href = ''
    
    mockInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: {},
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
    
    mockedAxios.create.mockReturnValue(mockInstance)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('API Instance Creation', () => {
    it('should create axios instance with default baseURL when env var not set', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3003',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should create axios instance with env baseURL when set', () => {
      // Mock environment variable
      vi.doMock('import.meta', () => ({
        env: {
          VITE_ORDER_API_BASE_URL: 'https://orders.example.com'
        }
      }))
      
      // Re-import to get fresh instance with new env
      delete require.cache[require.resolve('../orderClient')]
      
      mockedAxios.create.mockClear()
      require('../orderClient')
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://orders.example.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('Request Interceptor', () => {
    let requestInterceptor
    let requestErrorHandler

    beforeEach(() => {
      const interceptorCall = mockInstance.interceptors.request.use.mock.calls[0]
      requestInterceptor = interceptorCall[0]
      requestErrorHandler = interceptorCall[1]
    })

    it('should add Authorization header when token exists', () => {
      localStorage.setItem('token', 'order-token')
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers.Authorization).toBe('Bearer order-token')
    })

    it('should not add Authorization header when token does not exist', () => {
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should preserve existing config properties', () => {
      localStorage.setItem('token', 'order-token')
      
      const config = { 
        headers: { 'Custom-Header': 'custom-value' },
        url: '/orders',
        method: 'GET',
        params: { status: 'pending' }
      }
      const result = requestInterceptor(config)
      
      expect(result.headers['Custom-Header']).toBe('custom-value')
      expect(result.headers.Authorization).toBe('Bearer order-token')
      expect(result.url).toBe('/orders')
      expect(result.method).toBe('GET')
      expect(result.params).toEqual({ status: 'pending' })
    })

    it('should handle request errors', async () => {
      const error = new Error('Request error')
      
      await expect(requestErrorHandler(error)).rejects.toBe(error)
    })

    it('should handle null token', () => {
      localStorage.setItem('token', null)
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle empty string token', () => {
      localStorage.setItem('token', '')
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('Response Interceptor', () => {
    let responseInterceptor
    let errorInterceptor

    beforeEach(() => {
      const interceptorCall = mockInstance.interceptors.response.use.mock.calls[0]
      responseInterceptor = interceptorCall[0]
      errorInterceptor = interceptorCall[1]
    })

    it('should pass through successful responses', () => {
      const response = { 
        data: { success: true, orders: [] }, 
        status: 200 
      }
      const result = responseInterceptor(response)
      
      expect(result).toBe(response)
    })

    describe('Error Handling', () => {
      it('should reject non-401 errors without special handling', async () => {
        const error = {
          response: { status: 404 },
          config: {}
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
      })

      it('should handle 401 errors by clearing tokens and redirecting', async () => {
        localStorage.setItem('token', 'expired-token')
        localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }))
        
        const error = {
          response: { status: 401 },
          config: {}
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
        expect(window.location.href).toBe('/login')
      })

      it('should handle 401 errors when tokens do not exist', async () => {
        const error = {
          response: { status: 401 },
          config: {}
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        expect(window.location.href).toBe('/login')
      })

      it('should handle errors without response', async () => {
        const error = { config: {} }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        // Should not redirect or clear tokens
        expect(window.location.href).toBe('')
      })

      it('should handle errors without response status', async () => {
        const error = {
          response: {},
          config: {}
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        // Should not redirect or clear tokens
        expect(window.location.href).toBe('')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle successful API calls', async () => {
      localStorage.setItem('token', 'order-token')
      
      const mockResponse = { 
        data: { 
          success: true, 
          orders: [
            { id: 1, userId: 1, total: 100, status: 'pending' }
          ] 
        }, 
        status: 200 
      }
      
      mockInstance.get.mockResolvedValue(mockResponse)
      
      const result = await orderApi.get('/api/orders')
      
      expect(result).toBe(mockResponse)
      expect(mockInstance.get).toHaveBeenCalledWith('/api/orders')
    })

    it('should handle 401 errors during API calls', async () => {
      localStorage.setItem('token', 'expired-token')
      localStorage.setItem('user', JSON.stringify({ id: 1 }))
      
      const error = {
        response: { status: 401 },
        config: {}
      }
      
      mockInstance.get.mockRejectedValue(error)
      
      await expect(orderApi.get('/api/orders')).rejects.toBe(error)
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(window.location.href).toBe('/login')
    })
  })

  describe('API Methods', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'order-token')
    })

    it('should support GET requests', async () => {
      const mockResponse = { data: { orders: [] } }
      mockInstance.get.mockResolvedValue(mockResponse)
      
      const result = await orderApi.get('/api/orders')
      
      expect(mockInstance.get).toHaveBeenCalledWith('/api/orders')
      expect(result).toBe(mockResponse)
    })

    it('should support POST requests', async () => {
      const orderData = { 
        userId: 1, 
        products: [{ id: 1, quantity: 2 }], 
        total: 200 
      }
      const mockResponse = { data: { success: true, id: 1 } }
      mockInstance.post.mockResolvedValue(mockResponse)
      
      const result = await orderApi.post('/api/orders', orderData)
      
      expect(mockInstance.post).toHaveBeenCalledWith('/api/orders', orderData)
      expect(result).toBe(mockResponse)
    })

    it('should support PUT requests', async () => {
      const orderData = { status: 'processed' }
      const mockResponse = { data: { success: true } }
      mockInstance.put.mockResolvedValue(mockResponse)
      
      const result = await orderApi.put('/api/orders/1', orderData)
      
      expect(mockInstance.put).toHaveBeenCalledWith('/api/orders/1', orderData)
      expect(result).toBe(mockResponse)
    })

    it('should support DELETE requests', async () => {
      const mockResponse = { data: { success: true } }
      mockInstance.delete.mockResolvedValue(mockResponse)
      
      const result = await orderApi.delete('/api/orders/1')
      
      expect(mockInstance.delete).toHaveBeenCalledWith('/api/orders/1')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockInstance.get.mockRejectedValue(networkError)
      
      await expect(orderApi.get('/api/orders')).rejects.toBe(networkError)
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded')
      mockInstance.get.mockRejectedValue(timeoutError)
      
      await expect(orderApi.get('/api/orders')).rejects.toBe(timeoutError)
    })

    it('should handle server errors', async () => {
      const serverError = {
        response: { 
          status: 500, 
          data: { message: 'Internal Server Error' } 
        }
      }
      mockInstance.get.mockRejectedValue(serverError)
      
      await expect(orderApi.get('/api/orders')).rejects.toBe(serverError)
    })

    it('should handle validation errors', async () => {
      const validationError = {
        response: { 
          status: 400, 
          data: { 
            message: 'Validation failed',
            errors: ['Invalid user ID', 'Invalid product quantity']
          } 
        }
      }
      mockInstance.post.mockRejectedValue(validationError)
      
      await expect(orderApi.post('/api/orders', {})).rejects.toBe(validationError)
    })
  })

  describe('Headers and Configuration', () => {
    it('should include Content-Type header by default', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should have correct timeout configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000
        })
      )
    })

    it('should preserve custom headers in requests', () => {
      localStorage.setItem('token', 'order-token')
      
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { 
        headers: { 
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'application/xml' // Override default
        } 
      }
      const result = requestInterceptor(config)
      
      expect(result.headers['X-Custom-Header']).toBe('custom-value')
      expect(result.headers['Content-Type']).toBe('application/xml')
      expect(result.headers.Authorization).toBe('Bearer order-token')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing localStorage', () => {
      // Mock localStorage to be undefined
      const originalLocalStorage = window.localStorage
      delete window.localStorage
      
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {} }
      
      expect(() => {
        requestInterceptor(config)
      }).not.toThrow()
      
      // Restore localStorage
      window.localStorage = originalLocalStorage
    })

    it('should handle localStorage errors', () => {
      // Mock localStorage.getItem to throw
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {} }
      
      expect(() => {
        requestInterceptor(config)
      }).not.toThrow()
      
      // Restore original method
      localStorage.getItem = originalGetItem
    })
  })
})
