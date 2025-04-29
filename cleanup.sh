#!/bin/bash

echo "🚀 Starting emergency cleanup..."

# Step 1: Remove all ad-hoc fixes
echo "🧹 Removing ad-hoc fixes and polyfills..."
rm -f public/react-global-fix.js public/core-fix.js public/universal-polyfill.js public/mui-timeout-fix.js public/emergency-fix.js

# Find and remove all fix and polyfill files from src/utils
find src/utils -name "*-fix.js" -o -name "*polyfill*.js" -o -name "*timeout*.js" | xargs rm -f

echo "✅ Removed ad-hoc fixes and polyfills"

# Step 2: Clean up dependencies
echo "🧹 Cleaning up dependencies..."
rm -rf node_modules package-lock.json

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 4: Build with production mode
echo "🏗️ Building the project in production mode..."
NODE_ENV=production npm run build

# Step 5: Verify the bundle
echo "🔍 Verifying the bundle..."
echo "Running a simple check for jsxDEV in the build..."
grep -r "jsxDEV(" dist/assets || echo "✅ No jsxDEV found in the build - good sign!"

echo "✅ Build completed! You can preview it with: npm run preview"
echo "   If it works, deploy to Vercel with: vercel --prod"
