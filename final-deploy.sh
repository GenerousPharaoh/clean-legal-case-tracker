#!/bin/bash

echo "🚀 Final Deploy with Map.clear Fix..."

# Step 1: Build with the Map.clear fix integrated
echo "🏗️ Building the project in production mode..."
export NODE_ENV=production
npx vite build --mode production

echo "✅ Build completed!"
echo "📁 Files in dist directory:"
ls -la dist
ls -la dist/assets

echo "🚀 Ready to deploy to Vercel!"
echo "Run: vercel --prod"
