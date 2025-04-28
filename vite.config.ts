import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: process.cwd(), // Explicitly set root to current working directory
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
    sourcemap: true,
    // Ensure Rollup has the correct configuration
    rollupOptions: {
      input: './index.html'
    }
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}) 