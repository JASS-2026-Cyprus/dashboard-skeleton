import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/vlm': {
        target: 'https://hub.nhr.fau.de/api/llmgw/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vlm/, ''),
        headers: {
          Authorization: `Bearer ${process.env.VITE_VLM_API_KEY || ''}`,
        },
      },
      '/api/drone': {
        target: process.env.VITE_DRONE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/drone/, ''),
      },
    },
  },
})
