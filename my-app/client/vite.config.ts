import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'es2020',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-router': ['react-router-dom'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-oauth': ['@react-oauth/google'],
          'vendor-mui-icons': [
            '@mui/icons-material/Star', '@mui/icons-material/StarBorder',
            '@mui/icons-material/StarHalf', '@mui/icons-material/Home',
            '@mui/icons-material/Close', '@mui/icons-material/CheckCircle',
            '@mui/icons-material/CloudUpload', '@mui/icons-material/Menu',
            '@mui/icons-material/Language', '@mui/icons-material/MailOutline',
            '@mui/icons-material/ArrowBack'
          ],
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
