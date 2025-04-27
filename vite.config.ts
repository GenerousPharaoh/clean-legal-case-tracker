import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 8000,
    strictPort: true, // Fail if port is already in use
    host: true, // Listen on all addresses
  },
  build: {
    // Increase the warning limit to suppress warnings for slightly larger chunks
    chunkSizeWarningLimit: 600,
    // Enable source maps for debugging
    sourcemap: true
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}) 