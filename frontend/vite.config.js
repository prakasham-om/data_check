import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window' // 👈 Fix for simple-peer/randombytes
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis' // 👈 extra safeguard for deps that expect global
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
     allowedHosts: [
      'data-check-1.onrender.com',
      // add other hosts you want to allow here
    ]
  }
})
