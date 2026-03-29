import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const LIVE_API_BASE = 'https://b4zyhqawrk.execute-api.us-east-1.amazonaws.com/dev';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-mui': ['@mui/icons-material', '@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-oauth': ['@react-oauth/google'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: LIVE_API_BASE,
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: LIVE_API_BASE,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
