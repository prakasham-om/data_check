import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173
  }
})
