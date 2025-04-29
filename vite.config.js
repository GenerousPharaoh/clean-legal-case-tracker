import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    })
  ],
  css: {
    // Completely disable PostCSS
    postcss: null,
    // Don't process CSS modules
    modules: false,
    // Don't extract CSS
    extract: false
  },
  build: {
    // Generate source maps for easier debugging
    sourcemap: true,
    // Don't minify CSS to avoid processing issues
    cssMinify: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})
