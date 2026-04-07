import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

const isDocker = process.env.IS_DOCKER === 'true'

// API target with environment variable support
const getApiTarget = () => {
  if (isDocker) {
    return 'http://api:3000'
  }
  
  // Use environment variable or default to deployed API
  return process.env.VITE_API_URL || 'https://codekhana-tech.onrender.com'
}

const apiTarget = getApiTarget()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@reduxjs/toolkit'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        // Ensure cookies are forwarded properly
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        // Handle headers properly
        onProxyReq: (proxyReq, req, res) => {
          // Forward cookies
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
          }
          // Forward authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization);
          }
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Proxy error:', err.message);
            console.log('Target:', apiTarget);
            console.log('Request:', req.method, req.url);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📤 Proxying request:', req.method, req.url, '→', apiTarget);
            console.log('   Headers:', {
              cookie: req.headers.cookie ? 'Present' : 'None',
              authorization: req.headers.authorization ? 'Present' : 'None'
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
    },
  },
})