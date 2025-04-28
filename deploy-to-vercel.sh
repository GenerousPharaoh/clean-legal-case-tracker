#!/bin/bash

echo "🚀 Preparing to deploy Legal Case Tracker to Vercel"

# Ensure we have a clean build
echo "🧹 Cleaning up previous builds..."
rm -rf dist

# Build the application
echo "🏗️ Building application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please fix the errors before deploying."
  exit 1
fi

# Run a quick verification
echo "🔍 Verifying build artifacts..."
if [ ! -d "dist" ]; then
  echo "❌ Build directory not found. Something went wrong with the build process."
  exit 1
fi

# Check for any remaining references to framer-motion in the build
if grep -r "framer-motion" dist; then
  echo "⚠️ Warning: framer-motion references found in the build. This might cause issues."
  echo "Continue anyway? (y/n)"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "Deployment canceled."
    exit 1
  fi
else
  echo "✅ No framer-motion references found in the build!"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "Would you like to:"
echo "1) Deploy to a preview environment"
echo "2) Deploy directly to production"
read -r deploy_type

if [ "$deploy_type" = "1" ]; then
  echo "Deploying to preview environment..."
  vercel
elif [ "$deploy_type" = "2" ]; then
  echo "Deploying directly to production..."
  vercel --prod
else
  echo "Invalid option. Deployment canceled."
  exit 1
fi

echo "✅ Deployment process complete!" 