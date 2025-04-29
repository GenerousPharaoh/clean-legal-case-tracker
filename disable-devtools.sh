#!/bin/bash

echo "🚀 Final Deploy with TinyMCE and Map.clear Fixes..."

# Step 1: Build with fixes integrated
echo "🏗️ Building the project in production mode..."
export NODE_ENV=production
npx vite build --mode production

echo "✅ Build completed!"
echo "📁 Files in dist directory:"
ls -la dist
ls -la dist/assets

echo "🚀 Ready to deploy to Vercel!"
echo "Run: vercel --prod"

echo "⚠️ NOTE: The React DevTools errors in the console are from the Chrome extension"
echo "and can be ignored. They don't affect the actual functionality of your app."
echo "To eliminate these errors completely, disable the React DevTools extension"
echo "in Chrome before your presentation."
