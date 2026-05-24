import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api/* requests from the frontend are proxied to the Spring Boot backend.
      // This makes both frontend and backend appear on the same origin (localhost:5173),
      // which means cookies are set and sent correctly without any CORS or SameSite issues.
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
