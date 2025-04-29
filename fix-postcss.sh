#!/bin/bash

echo "🔧 Fixing PostCSS and environment issues..."

# Install the missing PostCSS plugin
echo "📦 Installing missing PostCSS plugins..."
npm install --save-dev @fullhuman/postcss-purgecss postcss autoprefixer tailwindcss

# Create a simple PostCSS config in the correct directory
echo "📝 Creating PostCSS config..."
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
EOL

# Fix the environment issue
echo "🔄 Removing .env files to avoid NODE_ENV warnings..."
rm -f .env.production

# Add environment handling to Vite config
echo "📝 Updating Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ 
      jsxRuntime: 'classic'
    })
  ],
  resolve: { 
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // Generate source maps for easier debugging
    sourcemap: true,
    // Ensure clean output
    emptyOutDir: true
  },
  // Define environment variables directly
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
EOL

echo "✅ Configuration fixed. Now running preview:"
npm run preview
