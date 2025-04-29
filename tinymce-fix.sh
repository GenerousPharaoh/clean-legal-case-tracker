#!/bin/bash

echo "🚀 Applying TinyMCE CDN Fix..."

# Step 1: Remove any previous build artifacts
echo "🧹 Cleaning up old build files..."
rm -rf dist

# Step 2: Build the project with the updated TinyMCE configuration
echo "🏗️ Building the project..."
NODE_ENV=production npm run build

echo "✅ Build completed! Testing with preview server..."
NODE_ENV=production npm run preview

echo "🚀 If the app works correctly, deploy to Vercel:"
echo "vercel --prod"

echo "⚠️ NOTE: Ignore React DevTools errors in the console (renderer.setTraceUpdatesEnabled)."
echo "These are coming from the browser extension and don't affect your app."
