import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import api from '../client'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock window.location
const mockLocation = {
  pathname: '/',
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLocation.pathname = '/'
    mockLocation.href = ''
    
    // Mock axios.create to return our mocked instance
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: {},
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('API Instance Creation', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: '/',
        timeout: 10000
      })
    })
  })

  describe('Request Interceptor', () => {
    let requestInterceptor

    beforeEach(() => {
      // Get the request interceptor function
      const mockInstance = mockedAxios.create.mock.results[0].value
      requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
    })

    it('should add Authorization header when token exists', () => {
      localStorage.setItem('accessToken', 'test-token')
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })

    it('should not add Authorization header when token does not exist', () => {
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBeUndefined()
    })

    it('should return config unchanged except for headers', () => {
      localStorage.setItem('accessToken', 'test-token')
      
      const config = { 
        headers: {},
        url: '/test',
        method: 'GET',
        data: { test: 'data' }
      }
      const result = requestInterceptor(config)
      
      expect(result.url).toBe('/test')
      expect(result.method).toBe('GET')
      expect(result.data).toEqual({ test: 'data' })
    })
  })

  describe('Response Interceptor', () => {
    let responseInterceptor
    let errorInterceptor
    let mockApiInstance

    beforeEach(() => {
      mockApiInstance = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }
      mockedAxios.create.mockReturnValue(mockApiInstance)
      
      // Re-import to get fresh interceptors
      delete require.cache[require.resolve('../client')]
      const freshApi = require('../client').default
      
      // Get the interceptor functions
      const interceptorCall = mockApiInstance.interceptors.response.use.mock.calls[0]
      responseInterceptor = interceptorCall[0]
      errorInterceptor = interceptorCall[1]
    })

    it('should pass through successful responses', () => {
      const response = { data: { success: true }, status: 200 }
      const result = responseInterceptor(response)
      
      expect(result).toBe(response)
    })

    describe('Error Handling', () => {
      it('should reject non-401 errors without retry', async () => {
        const error = {
          response: { status: 500 },
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
          data: { accessToken: 'new-token' }
        })
        
        // Mock successful retry
        mockApiInstance.mockResolvedValue({ data: 'success' })
        
        const result = await errorInterceptor(error)
        
        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh', {
          refreshToken: 'refresh-token'
        })
        expect(localStorage.getItem('accessToken')).toBe('new-token')
        expect(error.config.headers['Authorization']).toBe('Bearer new-token')
        expect(error.config._retry).toBe(true)
      })

      it('should clear tokens and redirect on refresh failure', async () => {
        localStorage.setItem('refreshToken', 'refresh-token')
        localStorage.setItem('accessToken', 'old-token')
        localStorage.setItem('role', 'user')
        
        const error = {
          response: { status: 401 },
          config: { headers: {} }
        }
        
        // Mock failed refresh
        mockedAxios.post.mockRejectedValue(new Error('Refresh failed'))
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(localStorage.getItem('refreshToken')).toBeNull()
        expect(localStorage.getItem('role')).toBeNull()
        expect(window.location.href).toBe('/login')
      })

      it('should not redirect to login when already on login page', async () => {
        localStorage.setItem('refreshToken', 'refresh-token')
        mockLocation.pathname = '/login'
        
        const error = {
          response: { status: 401 },
          config: { headers: {} }
        }
        
        // Mock failed refresh
        mockedAxios.post.mockRejectedValue(new Error('Refresh failed'))
        
        await expect(errorInterceptor(error)).rejects.toBe(error)
        
        expect(window.location.href).toBe('')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete request-response cycle', async () => {
      localStorage.setItem('accessToken', 'test-token')
      
      // Mock successful response
      const mockResponse = { data: { success: true }, status: 200 }
      const mockGet = vi.fn().mockResolvedValue(mockResponse)
      
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        },
        get: mockGet
      })
      
      // Re-import to get fresh instance
      delete require.cache[require.resolve('../client')]
      const freshApi = require('../client').default
      
      const result = await freshApi.get('/test')
      
      expect(result).toBe(mockResponse)
    })

    it('should handle token refresh flow end-to-end', async () => {
      localStorage.setItem('refreshToken', 'refresh-token')
      localStorage.setItem('accessToken', 'old-token')
      
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce({
          response: { status: 401 },
          config: { headers: {} }
        })
        .mockResolvedValueOnce({ data: 'success' })
      
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        },
        get: mockApiCall
      })
      
      // Mock successful refresh
      mockedAxios.post.mockResolvedValue({
        data: { accessToken: 'new-token' }
      })
      
      // Re-import to get fresh instance
      delete require.cache[require.resolve('../client')]
      const freshApi = require('../client').default
      
      // This should trigger the refresh flow
      const result = await freshApi.get('/test')
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh-token'
      })
      expect(localStorage.getItem('accessToken')).toBe('new-token')
      expect(result.data).toBe('success')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null localStorage values', () => {
      localStorage.setItem('accessToken', null)
      
      const mockInstance = mockedAxios.create.mock.results[0].value
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBeUndefined()
    })

    it('should handle empty string tokens', () => {
      localStorage.setItem('accessToken', '')
      
      const mockInstance = mockedAxios.create.mock.results[0].value
      const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      
      const config = { headers: {} }
      const result = requestInterceptor(config)
      
      expect(result.headers['Authorization']).toBeUndefined()
    })

    it('should handle missing error response', async () => {
      const error = { config: {} }
      
      const mockInstance = mockedAxios.create.mock.results[0].value
      const errorInterceptor = mockInstance.interceptors.response.use.mock.calls[0][1]
      
      await expect(errorInterceptor(error)).rejects.toBe(error)
    })

    it('should handle missing error config', async () => {
      const error = { response: { status: 401 } }
      
      const mockInstance = mockedAxios.create.mock.results[0].value
      const errorInterceptor = mockInstance.interceptors.response.use.mock.calls[0][1]
      
      await expect(errorInterceptor(error)).rejects.toBe(error)
    })
  })
})
