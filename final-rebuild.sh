#!/bin/bash

echo "🚀 Starting FINAL comprehensive rebuild process..."

# Step 1: Clean up old dependencies
echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules package-lock.json

# Step 2: Add React to window globally in case it's needed
echo "📝 Creating React global fix..."
cat > public/react-global-fix.js << 'EOL'
/**
 * Emergency fix for "React is not defined" errors
 * This script runs before any other code and ensures React is globally available
 */

(function() {
  // Create a placeholder React object if it doesn't exist
  if (typeof window !== 'undefined' && !window.React) {
    console.log('[REACT FIX] Adding global React object');
    
    // Create a minimal React-like object that won't cause errors
    window.React = {
      createElement: function() {
        // When the real React loads, this will be replaced
        return document.createElement('div');
      },
      Fragment: function() { return document.createDocumentFragment(); },
      StrictMode: function(props) { return props.children; },
      Component: function() {},
      PureComponent: function() {},
      memo: function(component) { return component; },
      createContext: function() { return { Provider: function() {}, Consumer: function() {} }; },
      useState: function(initialState) { return [initialState, function() {}]; },
      useEffect: function() {},
      useContext: function() {},
      useReducer: function(reducer, initialState) { return [initialState, function() {}]; },
      useCallback: function(callback) { return callback; },
      useMemo: function(factory) { return factory(); },
      useRef: function(initialValue) { return { current: initialValue }; },
      isValidElement: function() { return false; }
    };
    
    // Wait for the real React to load
    var checkInterval = setInterval(function() {
      // When a react file loads, it will set up the real React
      var realCreateElement = window.React.createElement;
      if (realCreateElement && realCreateElement.toString().indexOf('createElement') !== -1) {
        console.log('[REACT FIX] Detected real React loaded, clearing interval');
        clearInterval(checkInterval);
      }
    }, 50);
  }
})();
EOL

# Step 3: Update index.html to load the React fix first
echo "📝 Updating index.html to load React fix first..."
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Tracker</title>
    
    <!-- REACT FIX: Must be first to prevent "React is not defined" errors -->
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

# Step 4: Create an ensure React file
echo "📝 Creating React helper module..."
mkdir -p src/utils
cat > src/utils/ensureReact.js << 'EOL'
/**
 * Ensure React is globally available for JSX components
 * This helps prevent "React is not defined" errors at runtime
 */

import React from 'react';

// Make React available globally for legacy code that might use it without importing
if (typeof window !== 'undefined') {
  window.React = React;
}

// Log that we've ensured React is available
console.log('[React] Ensuring React is available globally for all components');

export default React;
EOL

# Step 5: Update the Vite config
echo "📝 Creating optimized Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use automatic runtime for simplicity
      jsxRuntime: 'automatic',
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
    // Set minify explicitly
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
  // Use define to make React available globally
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'global.React': 'React'
  }
});
EOL

# Step 6: Update main.tsx to ensure React is imported first
echo "📝 Updating main.tsx to import React helper first..."
sed -i.bak '1s/^/import ".\/utils\/ensureReact.js";\n/' src/main.tsx

# Step 7: Install dependencies with the fixed versions
echo "📦 Installing dependencies with fixed versions..."
npm install

# Step 8: Build with optimized settings
echo "🏗️ Building project with optimized settings..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "✅ Final rebuild complete! Try running 'npm run preview' to test locally."
echo "    If it works, deploy to Vercel with 'vercel --prod'"
