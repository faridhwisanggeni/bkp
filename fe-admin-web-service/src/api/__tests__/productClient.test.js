import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import productApi from '../productClient'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_PRODUCT_API_BASE_URL: undefined
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

describe('Product API Client', () => {
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
        baseURL: 'http://localhost:3002',
        timeout: 10000
      })
    })

    it('should create axios instance with env baseURL when set', () => {
      // Mock environment variable
      vi.doMock('import.meta', () => ({
        env: {
          VITE_PRODUCT_API_BASE_URL: 'https://api.example.com'
        }
      }))
      
      // Re-import to get fresh instance with new env
      delete require.cache[require.resolve('../productClient')]
      
      mockedAxios.create.mockClear()
      require('../productClient')
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 10000
      })
    })
  })

  describe('Request Interceptor', () => {
    let requestInterceptor

    beforeEach(() => {
      requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
    })

    it('should add Authorization header when token exists', () => {
      localStorage.setItem('accessToken', 'product-token')
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBe('Bearer product-token')
    })

    it('should not add Authorization header when token does not exist', () => {
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBeUndefined()
    })

    it('should preserve existing config properties', () => {
      localStorage.setItem('accessToken', 'product-token')
      
      const config = { 
        headers: { 'Content-Type': 'application/json' },
        url: '/products',
        method: 'GET',
        params: { page: 1 }
      }
      const result = requestInterceptor(config)
      
      expect(result.headers['Content-Type']).toBe('application/json')
      expect(result.headers['Authorization']).toBe('Bearer product-token')
      expect(result.url).toBe('/products')
      expect(result.method).toBe('GET')
      expect(result.params).toEqual({ page: 1 })
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
        data: { success: true, products: [] }, 
        status: 200 
      }
      const result = responseInterceptor(response)
      
      expect(result).toBe(response)
    })

    describe('Error Handling', () => {
      it('should reject non-401 errors without retry', async () => {
        const error = {
          response: { status: 404 },
          config: {}
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
      })

      it('should reject 401 errors when no refresh token exists', async () => {
        const error = {
          response: { status: 401 },
          config: {}
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
      })

      it('should reject 401 errors when already retried', async () => {
        localStorage.setItem('refreshToken', 'refresh-token')
        
        const error = {
          response: { status: 401 },
          config: { _retry: true }
        }
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
      })

      it('should attempt token refresh on 401 with refresh token', async () => {
        localStorage.setItem('refreshToken', 'refresh-token')
        localStorage.setItem('accessToken', 'old-token')
        
        const error = {
          response: { status: 401 },
          config: { headers: {} }
        }
        
        // Mock successful refresh
        mockedAxios.post.mockResolvedValue({
          data: { accessToken: 'new-product-token' }
        })
        
        // Mock successful retry
        mockInstance.mockResolvedValue({ data: { products: [] } })
        
        const result = await errorInterceptor(error)
        
        expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/auth/refresh', {
          refreshToken: 'refresh-token'
        })
        expect(localStorage.getItem('accessToken')).toBe('new-product-token')
        expect(error.config.headers['Authorization']).toBe('Bearer new-product-token')
        expect(error.config._retry).toBe(true)
      })

      it('should clear tokens and redirect on refresh failure', async () => {
        localStorage.setItem('refreshToken', 'refresh-token')
        localStorage.setItem('accessToken', 'old-token')
        
        const error = {
          response: { status: 401 },
          config: { headers: {} }
        }
        
        // Mock failed refresh
        mockedAxios.post.mockRejectedValue(new Error('Refresh failed'))
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(localStorage.getItem('refreshToken')).toBeNull()
        expect(window.location.href).toBe('/login')
      })

      it('should use correct refresh endpoint', async () => {
        localStorage.setItem('refreshToken', 'refresh-token')
        
        const error = {
          response: { status: 401 },
          config: { headers: {} }
        }
        
        // Mock failed refresh to avoid further execution
        mockedAxios.post.mockRejectedValue(new Error('Refresh failed'))
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/auth/refresh', {
          refreshToken: 'refresh-token'
        })
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle successful API calls', async () => {
      localStorage.setItem('accessToken', 'product-token')
      
      const mockResponse = { 
        data: { 
          success: true, 
          products: [
            { id: 1, name: 'Product 1', price: 100 }
          ] 
        }, 
        status: 200 
      }
      
      mockInstance.get.mockResolvedValue(mockResponse)
      
      const result = await productApi.get('/api/products')
      
      expect(result).toBe(mockResponse)
      expect(mockInstance.get).toHaveBeenCalledWith('/api/products')
    })

    it('should handle token refresh during API calls', async () => {
      localStorage.setItem('refreshToken', 'refresh-token')
      localStorage.setItem('accessToken', 'old-token')
      
      // First call fails with 401, second succeeds
      mockInstance.get
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { headers: {}, url: '/api/products', method: 'get' }
        })
        .mockResolvedValueOnce({ 
          data: { success: true, products: [] } 
        })
      
      // Mock successful refresh
      mockedAxios.post.mockResolvedValue({
        data: { accessToken: 'new-product-token' }
      })
      
      const result = await productApi.get('/api/products')
      
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/auth/refresh', {
        refreshToken: 'refresh-token'
      })
      expect(localStorage.getItem('accessToken')).toBe('new-product-token')
      expect(result.data.success).toBe(true)
    })
  })

  describe('API Methods', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'product-token')
    })

    it('should support GET requests', async () => {
      const mockResponse = { data: { products: [] } }
      mockInstance.get.mockResolvedValue(mockResponse)
      
      const result = await productApi.get('/api/products')
      
      expect(mockInstance.get).toHaveBeenCalledWith('/api/products')
      expect(result).toBe(mockResponse)
    })

    it('should support POST requests', async () => {
      const productData = { name: 'New Product', price: 200 }
      const mockResponse = { data: { success: true, id: 1 } }
      mockInstance.post.mockResolvedValue(mockResponse)
      
      const result = await productApi.post('/api/products', productData)
      
      expect(mockInstance.post).toHaveBeenCalledWith('/api/products', productData)
      expect(result).toBe(mockResponse)
    })

    it('should support PUT requests', async () => {
      const productData = { name: 'Updated Product', price: 250 }
      const mockResponse = { data: { success: true } }
      mockInstance.put.mockResolvedValue(mockResponse)
      
      const result = await productApi.put('/api/products/1', productData)
      
      expect(mockInstance.put).toHaveBeenCalledWith('/api/products/1', productData)
      expect(result).toBe(mockResponse)
    })

    it('should support DELETE requests', async () => {
      const mockResponse = { data: { success: true } }
      mockInstance.delete.mockResolvedValue(mockResponse)
      
      const result = await productApi.delete('/api/products/1')
      
      expect(mockInstance.delete).toHaveBeenCalledWith('/api/products/1')
      expect(result).toBe(mockResponse)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockInstance.get.mockRejectedValue(networkError)
      
      await expect(productApi.get('/api/products')).rejects.toBe(networkError)
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded')
      mockInstance.get.mockRejectedValue(timeoutError)
      
      await expect(productApi.get('/api/products')).rejects.toBe(timeoutError)
    })

    it('should handle server errors', async () => {
      const serverError = {
        response: { 
          status: 500, 
          data: { message: 'Internal Server Error' } 
        }
      }
      mockInstance.get.mockRejectedValue(serverError)
      
      await expect(productApi.get('/api/products')).rejects.toBe(serverError)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing error response', async () => {
      const error = { config: {} }
      
      const errorInterceptor = mockInstance.interceptors.response.use.mock.calls[0][1]
      
      await expect(errorInterceptor(error)).rejects.toBe(error)
    })

    it('should handle missing error config', async () => {
      const error = { response: { status: 401 } }
      
      const errorInterceptor = mockInstance.interceptors.response.use.mock.calls[0][1]
      
      await expect(errorInterceptor(error)).rejects.toBe(error)
    })

    it('should handle null tokens in localStorage', () => {
      localStorage.setItem('accessToken', null)
      
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBeUndefined()
    })

    it('should handle empty string tokens', () => {
      localStorage.setItem('accessToken', '')
      
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBeUndefined()
    })
  })
})
