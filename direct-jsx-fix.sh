#!/bin/bash

echo "🔥 Starting Direct JSX Runtime Fix..."

# Step 1: Remove all the polyfill scripts from HTML
echo "🧹 Removing all polyfills and fixes from HTML..."
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOL

# Step 2: Create a targeted Babel config
echo "📝 Creating Babel configuration..."
cat > babel.config.js << 'EOL'
module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        runtime: 'classic',
        development: false
      }
    ]
  ]
}
EOL

# Step 3: Create a special JSX transform plugin for Vite
echo "📝 Creating JSX plugin file..."
mkdir -p plugins
cat > plugins/jsx-plugin.js << 'EOL'
// Custom JSX plugin to ensure classic JSX transform
export default function customJsxPlugin() {
  return {
    name: 'custom-jsx-transform',
    enforce: 'pre',
    config(config) {
      // Ensure React plugin uses classic runtime
      const reactPlugin = config.plugins.find(p => 
        p.name === 'vite:react-jsx' || 
        (Array.isArray(p) && p[0]?.name === 'vite:react-jsx')
      );
      
      if (reactPlugin) {
        if (Array.isArray(reactPlugin)) {
          reactPlugin[1] = { ...reactPlugin[1], jsxRuntime: 'classic' };
        } else {
          reactPlugin.jsxRuntime = 'classic';
        }
      }
      
      // Force production mode
      config.mode = 'production';
      config.define = config.define || {};
      config.define['process.env.NODE_ENV'] = JSON.stringify('production');
      
      return config;
    }
  };
}
EOL

# Step 4: Create a minimal, focused vite.config.js
echo "📝 Creating minimal Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import customJsxPlugin from './plugins/jsx-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  mode: 'production',
  plugins: [
    customJsxPlugin(),
    react({
      jsxRuntime: 'classic',
      babel: {
        plugins: []
      }
    })
  ],
  build: {
    // Clean output directory
    emptyOutDir: true,
    // Force production mode
    minify: 'esbuild',
    rollupOptions: {
      // Output into separate chunks
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom']
        }
      }
    }
  },
  // Force production mode
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    // Ensure development flags are OFF
    '__DEV__': false,
    'process.env.NODE_ENV !== "production"': false
  },
  // Explicitly disable CSS processing to avoid PostCSS issues
  css: {
    postcss: false
  }
});
EOL

# Step 5: Clean build artifacts and dependencies
echo "🧹 Cleaning build artifacts..."
rm -rf dist node_modules/.vite

# Step 6: Clean and rebuild with explicit production flag
echo "🔄 Rebuilding with explicit production flag..."
export NODE_ENV=production
npx vite build --mode production

echo "✅ Build completed! Testing with preview server..."
NODE_ENV=production npx vite preview
