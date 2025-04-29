#!/bin/bash

echo "🔄 Starting comprehensive rebuild process..."

# Step 1: Clean up old dependencies
echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules package-lock.json

# Step 2: Install with the fixed package.json
echo "📦 Installing dependencies with fixed versions..."
npm install

# Step 3: Build with optimized settings
echo "🏗️ Building project with optimized settings..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "✅ Rebuild complete! Try running 'npm run preview' to test locally."
echo "    If it works, deploy to Vercel with 'vercel --prod'"
