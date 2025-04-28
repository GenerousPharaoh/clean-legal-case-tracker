import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic runtime for better compatibility
      jsxRuntime: 'classic',
      // Disable Fast Refresh in production
      fastRefresh: process.env.NODE_ENV !== 'production',
      // Disable babel plugins that might cause issues
      babel: {
        plugins: [
          // No additional plugins to avoid conflicts
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // Generate source maps for easier debugging
    sourcemap: true,
    // More compatible output format
    target: 'es2015',
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom',
            'react-router-dom'
          ],
          'mui': [
            '@mui/material',
            '@mui/system',
            '@mui/icons-material'
          ]
        }
      }
    },
    // Compatibility settings
    terserOptions: {
      compress: {
        // Don't use advanced optimizations that might cause issues
        arrows: false,
        passes: 1
      }
    }
  },
  // Prevent potential polyfill issues
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  // Retain console logs in production for debugging
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
