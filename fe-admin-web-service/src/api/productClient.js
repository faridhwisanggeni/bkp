import axios from 'axios'

// Product service API client via API Gateway
const productApi = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
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
        // Use API Gateway for refresh
        const refreshRes = await axios.post('http://localhost:8080/api/auth/refresh', {
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
