import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8000,
    proxy: {
      '/proxy/blackboard': {
        target: 'https://blackboard.jass.school',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/blackboard/, ''),
      },
      '/api/vlm': {
        target: 'https://hub.nhr.fau.de/api/llmgw/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vlm/, ''),
        headers: {
          Authorization: `Bearer ${process.env.VITE_VLM_API_KEY || ''}`,
        },
      },
      '/api/drone': {
        target: process.env.VITE_DRONE_API_URL || 'http://192.168.1.109:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/drone/, ''),
      },
    },
  },
})
