import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to disable HTML processing that's causing issues
    {
      name: 'disable-html-processing',
      enforce: 'pre',
      // Only apply during build
      apply: 'build',
      // This will bypass HTML processing for all HTML files
      transformIndexHtml(html) {
        return html // Return HTML unchanged
      },
      // Add an early hook to intercept HTML files
      resolveId(id) {
        if (id.endsWith('.html') && id !== 'index.html') {
          // Tell Vite to treat non-index HTML files as external
          return { id, external: true }
        }
        return null
      }
    }
  ],
  build: {
    // Prevent minification issues
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false
      },
      compress: {
        drop_console: true
      }
    },
    // Ensure proper output
    outDir: 'dist',
    assetsDir: 'assets',
    // Add rollup options for better control
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      // Improve output format
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  // Prevent esbuild transform errors
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  }
}) 