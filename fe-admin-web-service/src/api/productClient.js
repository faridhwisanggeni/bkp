import axios from 'axios'

// Product service API client
const productApi = axios.create({
  baseURL: import.meta.env.VITE_PRODUCT_API_BASE_URL || 'http://localhost:3002',
  timeout: 10000,
})

productApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

productApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true
      try {
        // Use user service for refresh
        const refreshRes = await axios.post('http://localhost:3000/auth/refresh', {
          refreshToken: localStorage.getItem('refreshToken'),
        })
        const newAccess = refreshRes.data.accessToken
        localStorage.setItem('accessToken', newAccess)
        original.headers['Authorization'] = `Bearer ${newAccess}`
        return productApi(original)
      } catch (_) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default productApi
