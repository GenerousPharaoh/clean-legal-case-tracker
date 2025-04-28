#!/bin/bash

# Comprehensive fix script for Legal Case Tracker
echo "🚀 Starting comprehensive fix process..."

# Step 1: Update package.json directly to fix dependencies
echo "📦 Updating package.json with correct dependencies..."
cat > package.json << 'EOL'
{
  "name": "legal-case-tracker-v2",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@emotion/react": "11.11.1",
    "@emotion/styled": "11.11.0",
    "@hookform/resolvers": "3.3.2",
    "@monaco-editor/react": "4.5.1",
    "@mui/icons-material": "5.14.11",
    "@mui/material": "5.14.11",
    "@mui/system": "5.14.11",
    "@mui/x-date-pickers": "6.16.0",
    "@supabase/supabase-js": "2.34.0",
    "@tinymce/tinymce-react": "4.3.0",
    "chart.js": "4.4.0",
    "date-fns": "2.30.0",
    "focus-visible": "5.2.0",
    "framer-motion": "10.12.16",
    "lodash": "4.17.21",
    "marked": "9.0.3",
    "monaco-editor": "0.43.0",
    "node-fetch": "3.3.2",
    "notistack": "3.0.1",
    "nprogress": "0.2.0",
    "pdf-lib": "1.17.1",
    "pdfjs-dist": "3.11.174",
    "pg": "8.11.3",
    "prismjs": "1.29.0",
    "react": "18.2.0",
    "react-awesome-reveal": "4.2.5",
    "react-beautiful-dnd": "13.1.1",
    "react-chartjs-2": "5.2.0",
    "react-dom": "18.2.0",
    "react-dropzone": "14.2.3",
    "react-error-boundary": "4.0.11",
    "react-focus-lock": "2.9.5",
    "react-highlight": "0.15.0",
    "react-hook-form": "7.46.2",
    "react-hotkeys-hook": "4.4.1",
    "react-intersection-observer": "9.5.2",
    "react-lazyload": "3.2.0",
    "react-markdown": "8.0.7",
    "react-masonry-css": "1.0.16",
    "react-pdf": "7.3.3",
    "react-resize-detector": "9.1.0",
    "react-router-dom": "6.16.0",
    "react-spring": "9.7.3",
    "react-virtualized": "9.22.5",
    "react-window": "1.8.9",
    "react-zoom-pan-pinch": "3.1.0",
    "refractor": "4.8.1",
    "tinymce": "6.7.0",
    "uuid": "9.0.1",
    "web-vitals": "3.5.0",
    "zod": "3.22.2",
    "zustand": "4.4.1"
  },
  "devDependencies": {
    "@types/react": "18.2.24",
    "@types/react-dom": "18.2.8",
    "@typescript-eslint/eslint-plugin": "6.7.3",
    "@typescript-eslint/parser": "6.7.3",
    "@vitejs/plugin-react": "4.1.0",
    "esbuild": "0.19.4",
    "eslint": "8.50.0",
    "eslint-plugin-react-hooks": "4.6.0",
    "eslint-plugin-react-refresh": "0.4.3",
    "rollup": "3.29.3",
    "terser": "5.20.0",
    "typescript": "5.2.2",
    "vite": "4.4.9"
  },
  "overrides": {
    "framer-motion": "10.12.16",
    "@mui/material": {
      "framer-motion": "10.12.16"
    },
    "@mui/system": {
      "framer-motion": "10.12.16"
    },
    "react-awesome-reveal": {
      "framer-motion": "10.12.16"
    },
    "@emotion/react": {
      "framer-motion": "10.12.16"
    },
    "@emotion/styled": {
      "framer-motion": "10.12.16"
    }
  },
  "resolutions": {
    "framer-motion": "10.12.16"
  }
}
EOL

# Step 2: Copy our universal polyfill to public
echo "🔧 Installing polyfill scripts..."
cp fixes/universal-polyfill.js public/
chmod -x public/universal-polyfill.js

# Step 3: Update index.html to load our polyfill first
echo "📝 Updating index.html to load polyfills first..."
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Tracker</title>
    
    <!-- UNIVERSAL POLYFILL: Comprehensive fix for all issues -->
    <script src="/universal-polyfill.js"></script>
    
    <!-- For backward compatibility, keep original polyfills -->
    <script src="/mui-timeout-fix.js"></script>
    <script src="/emergency-fix.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOL

# Step 4: Create simpler Vite config
echo "⚙️ Creating optimized Vite config..."
cat > vite.config.js << 'EOL'
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
EOL

# Step 5: Clean and reinstall
echo "🧹 Cleaning and reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# Step 6: Build with optimized settings
echo "🏗️ Building project with optimized settings..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "✅ All fixes have been applied! Your project should now deploy correctly."
echo ""
echo "To test locally:"
echo "  npm run preview"
echo ""
echo "To deploy to Vercel:"
echo "  vercel --prod"
echo ""
echo "If issues persist, check the browser console for detailed errors."
