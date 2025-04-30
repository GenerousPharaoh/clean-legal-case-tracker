import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: process.cwd(), // Explicitly set root to current working directory
  define: {
    // Ensure React is globally available
    'window.React': 'React',
    'global.React': 'React' 
  },
  plugins: [
    react({
      // Recommended: Remove React DevTools in production builds
      removeDevtoolsInProd: true,
      // Force the classic JSX runtime to ensure React is available globally
      jsxRuntime: 'classic',
      // Consider enabling Fast Refresh strictly for development if issues arise
      // fastRefresh: process.env.NODE_ENV !== 'production'
    })
  ],
  server: {
    port: 8000,
    strictPort: true, // Fail if port is already in use
    host: true, // Listen on all addresses
  },
  build: {
    // Increase the warning limit to suppress warnings for larger chunks
    chunkSizeWarningLimit: 3500,
    // Enable source maps for debugging
    sourcemap: true,
    // Ensure Rollup has the correct configuration
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Improved chunking strategy
        manualChunks: (id) => {
          // React and related packages
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          
          // UI Libraries
          if (id.includes('node_modules/@mui') ||
              id.includes('node_modules/@emotion')) {
            return 'vendor-ui';
          }
          
          // Editors
          if (id.includes('node_modules/tinymce') ||
              id.includes('node_modules/@tinymce') ||
              id.includes('node_modules/monaco-editor') ||
              id.includes('node_modules/@monaco-editor')) {
            return 'vendor-editors';
          }
          
          // Other libraries
          if (id.includes('node_modules/')) {
            return 'vendor-others';
          }
        }
      }
    }
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Explicitly optimizing critical dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/icons-material/AudioTrack',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
      'date-fns'
    ]
  },
  // Add external modules that Vite should not try to bundle
  ssr: {
    noExternal: ['@mui/icons-material']
  }
})