#!/bin/bash

echo "🚀 Starting Clean Build Process..."

# Step 1: Build with the cleaned up main.tsx file
echo "🏗️ Building the project in production mode..."
export NODE_ENV=production
npx vite build --mode production

echo "✅ Build completed! Testing with preview server..."
NODE_ENV=production npx vite preview
