import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Preferred port - will use 5174, 5175, etc. if busy
    host: '0.0.0.0', // Expose to network for mobile testing
    proxy: {
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      }
    }
  }
})
