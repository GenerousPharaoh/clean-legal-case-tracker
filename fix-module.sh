#!/bin/bash

echo "🔧 Fixing module format issues..."

# Remove the incorrect postcss.config.js
echo "🧹 Removing incorrect PostCSS config..."
rm -f postcss.config.js

# Create the correct .cjs version (already created separately)
echo "📝 Created postcss.config.cjs with CommonJS syntax"

# Remove the parent directory PostCSS config if possible
echo "🔍 Checking for parent directory PostCSS config..."
if [ -f "/Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js" ]; then
  echo "⚠️ Found parent PostCSS config that's causing issues"
  echo "Creating a simple script to disable it temporarily..."
  
  cat > disable_parent_postcss.sh << 'EOL'
#!/bin/bash
if [ -f "/Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js" ]; then
  mv /Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js /Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/postcss.config.js.bak
  echo "✅ Temporarily disabled parent PostCSS config"
else
  echo "⚠️ Parent PostCSS config not found"
fi
EOL
  
  chmod +x disable_parent_postcss.sh
  ./disable_parent_postcss.sh
fi

# Create a simpler Vite config without PostCSS
echo "📝 Creating simpler Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
  ],
  css: {
    postcss: null, // Disable PostCSS processing completely
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
EOL

echo "✅ Configuration fixed. Now running preview:"
npm run preview
