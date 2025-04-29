#!/bin/bash

echo "🚀 Starting React Compatibility Fix Process..."

# Step 1: Update the public React global fix script
echo "📝 Creating enhanced React global fix..."
cat > public/react-global-fix.js << 'EOL'
/**
 * Enhanced React compatibility fix for Classic JSX Runtime
 */

(function() {
  console.log('[REACT COMPAT] Applying React compatibility fixes');
  
  // Create a global React object if not already present
  if (typeof window !== 'undefined' && !window.React) {
    window.React = {
      // These are the minimal methods needed for classic JSX runtime
      createElement: function() {
        console.warn('[REACT COMPAT] Placeholder createElement called before React loaded');
        return document.createElement('div');
      },
      Fragment: Symbol('Fragment'),
      StrictMode: Symbol('StrictMode')
    };
    
    console.log('[REACT COMPAT] Created placeholder React object');
  }
  
  // Patch the JSX runtime
  const originalCreateElement = window.React && window.React.createElement;
  if (originalCreateElement) {
    // Save original for debugging
    window.React._originalCreateElement = originalCreateElement;
  }
  
  // Set up a listener for the real React to load
  if (typeof window !== 'undefined') {
    window._reactLoadAttempts = 0;
    
    const checkReactLoaded = function() {
      window._reactLoadAttempts++;
      
      // Check if real React is loaded
      if (window.React && typeof window.React.createElement === 'function' 
          && window.React.createElement.toString().indexOf('native code') === -1
          && window._reactLoadAttempts < 20) {
        
        console.log('[REACT COMPAT] React detected and looks valid');
        
        // Ensure createElement is working properly
        try {
          const testElement = window.React.createElement('div', null, 'test');
          if (testElement && testElement.type === 'div') {
            console.log('[REACT COMPAT] React.createElement is working properly');
          }
        } catch (e) {
          console.error('[REACT COMPAT] Error testing React.createElement:', e);
        }
        
        clearInterval(reactCheckInterval);
      }
    };
    
    // Check every 50ms for the first second
    const reactCheckInterval = setInterval(checkReactLoaded, 50);
  }
})();
EOL

# Step 2: Update Vite config to use classic JSX runtime
echo "📝 Updating Vite config for classic JSX runtime..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic runtime instead of automatic
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
    // Set minify explicitly to esbuild for better performance
    minify: 'esbuild',
    // Compatibility settings
    terserOptions: {
      compress: {
        // Don't use advanced optimizations that might cause issues
        arrows: false,
        passes: 1
      }
    }
  },
  // Retain console logs in production for debugging
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
EOL

# Step 3: Create a React compatibility module
echo "📝 Creating React compatibility module..."
mkdir -p src/utils
cat > src/utils/reactCompat.js << 'EOL'
/**
 * React Compatibility Module for Classic JSX Runtime
 */

import React from 'react';

// This module ensures React is available globally with all necessary methods
if (typeof window !== 'undefined') {
  // Add the real React to window
  window.React = React;
  
  // Log compatibility check
  console.log('[REACT COMPAT] Loaded React compatibility module');
  
  // Sanity check React.createElement
  try {
    const testElement = React.createElement('div', null, 'test');
    if (testElement && testElement.type === 'div') {
      console.log('[REACT COMPAT] React.createElement verified');
    }
  } catch (e) {
    console.error('[REACT COMPAT] Error in React.createElement check:', e);
  }
}

export default React;
EOL

# Step 4: Update main.tsx to import React compatibility module
echo "📝 Updating main.tsx to import React compatibility module..."
# Create a backup of the original file
cp src/main.tsx src/main.tsx.bak

# Use sed to replace the first import line with our compatibility module
sed -i.bak '1s/^/import React from ".\/utils\/reactCompat.js";\n/' src/main.tsx

# Make sure React import is first
sed -i.bak '/^import \.\/utils\/ensureReact/d' src/main.tsx

# Step 5: Update index.html
echo "📝 Updating index.html..."
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Tracker</title>
    
    <!-- REACT COMPAT: Enhanced React compatibility for Classic JSX Runtime -->
    <script src="/react-global-fix.js"></script>
    
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

# Step 6: Clean up and rebuild
echo "🧹 Cleaning up node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building the project..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "✅ React compatibility fix completed! Try running 'npm run preview' to test locally."
echo "    If it works, deploy to Vercel with 'vercel --prod'"
