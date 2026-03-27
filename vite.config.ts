import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /blackboard/* → http://localhost:2223/blackboard/*
      // This avoids CORS issues when fetching the blackboard log from the browser.
      '/blackboard': {
        target: 'http://localhost:2223',
        changeOrigin: true,
      },
    },
  },
})
