import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:8080'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const { email, password } = await request.json()
    
    if (email === 'admin@example.com' && password === 'ChangeMeAdmin123!') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      })
    }
    
    if (email === 'malformed@example.com') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'malformed-jwt',
          refreshToken: 'malformed-refresh'
        }
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE_URL}/api/auth/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json()
    
    if (refreshToken === 'mock-refresh-token') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'new-mock-jwt-token'
        }
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid refresh token' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ success: true, message: 'Logged out successfully' })
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/api/users`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
        { id: 2, username: 'user1', email: 'user1@example.com', role: 'user' },
        { id: 3, username: 'user2', email: 'user2@example.com', role: 'user' }
      ]
    })
  }),

  http.post(`${API_BASE_URL}/api/users`, async ({ request }) => {
    const userData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: Date.now(), ...userData }
    })
  }),

  http.put(`${API_BASE_URL}/api/users/:id`, async ({ request, params }) => {
    const userData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: parseInt(params.id), ...userData }
    })
  }),

  // Product endpoints
  http.get('http://localhost:3002/api/products', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'Product 1', price: 100, stock: 10, description: 'Test product 1' },
        { id: 2, name: 'Product 2', price: 200, stock: 5, description: 'Test product 2' },
        { id: 3, name: 'Product 3', price: 300, stock: 15, description: 'Test product 3' }
      ]
    })
  }),

  http.post('http://localhost:3002/api/products', async ({ request }) => {
    const productData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: Date.now(), ...productData }
    })
  }),

  http.put('http://localhost:3002/api/products/:id', async ({ request, params }) => {
    const productData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: parseInt(params.id), ...productData }
    })
  }),

  // Promotion endpoints
  http.get('http://localhost:3002/api/promotions', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { 
          id: 1, 
          name: 'Summer Sale', 
          discount: 20, 
          startDate: '2024-01-01', 
          endDate: '2024-12-31',
          isActive: true 
        },
        { 
          id: 2, 
          name: 'Winter Sale', 
          discount: 15, 
          startDate: '2024-01-01', 
          endDate: '2024-12-31',
          isActive: false 
        }
      ]
    })
  }),

  http.post('http://localhost:3002/api/promotions', async ({ request }) => {
    const promotionData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: Date.now(), ...promotionData }
    })
  }),

  http.put('http://localhost:3002/api/promotions/:id', async ({ request, params }) => {
    const promotionData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: parseInt(params.id), ...promotionData }
    })
  }),

  // Order endpoints
  http.get('http://localhost:3003/api/orders', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          userId: 1,
          products: [{ id: 1, quantity: 2, name: 'Product 1', price: 100 }],
          total: 200,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          userId: 2,
          products: [{ id: 2, quantity: 1, name: 'Product 2', price: 200 }],
          total: 200,
          status: 'processed',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]
    })
  }),

  http.post('http://localhost:3003/api/orders', async ({ request }) => {
    const orderData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { 
        id: Date.now(), 
        ...orderData, 
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    })
  }),

  // Role endpoints
  http.get(`${API_BASE_URL}/api/roles`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'admin', permissions: ['read', 'write', 'delete'] },
        { id: 2, name: 'user', permissions: ['read'] },
        { id: 3, name: 'manager', permissions: ['read', 'write'] }
      ]
    })
  }),

  http.post(`${API_BASE_URL}/api/roles`, async ({ request }) => {
    const roleData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: Date.now(), ...roleData }
    })
  }),

  http.put(`${API_BASE_URL}/api/roles/:id`, async ({ request, params }) => {
    const roleData = await request.json()
    return HttpResponse.json({
      success: true,
      data: { id: parseInt(params.id), ...roleData }
    })
  }),

  // Error simulation endpoints
  http.get(`${API_BASE_URL}/api/error/500`, () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE_URL}/api/error/404`, () => {
    return HttpResponse.json(
      { success: false, message: 'Not found' },
      { status: 404 }
    )
  }),

  http.get(`${API_BASE_URL}/api/error/401`, () => {
    return HttpResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  })
]
