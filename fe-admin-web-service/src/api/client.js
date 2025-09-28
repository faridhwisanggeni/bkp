import axios from 'axios'

// Use relative baseURL so requests hit Vite dev server and get proxied
const api = axios.create({
  baseURL: '/',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Simple refresh flow example (optional: add robust queueing in real apps)
    const original = error.config
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true
      try {
        const refreshRes = await axios.post('/auth/refresh', {
          refreshToken: localStorage.getItem('refreshToken'),
        })
        const newAccess = refreshRes.data.accessToken
        localStorage.setItem('accessToken', newAccess)
        original.headers['Authorization'] = `Bearer ${newAccess}`
        return api(original)
      } catch (_) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('role')
        // Don't use window.location.href, let React Router handle navigation
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
