import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      // Forward API calls to backend service name in Docker network
      '/api': {
        target: 'http://user-service:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://user-service:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://user-service:3000',
        changeOrigin: true,
      },
    },
  },
})
