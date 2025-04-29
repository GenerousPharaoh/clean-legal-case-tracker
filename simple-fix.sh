#!/bin/bash

echo "🛠️ Applying minimal fix for Legal Case Tracker"

# Step 1: Copy the core-fix.js to public directory
echo "📁 Ensuring core-fix.js is in public directory"
cp public/core-fix.js public/core-fix.js

# Step 2: Backup the original package.json
echo "💾 Backing up package.json"
cp package.json package.json.bak

# Step 3: Check if framer-motion is at the correct version
echo "🔍 Checking framer-motion version"
FRAMER_VERSION=$(grep '"framer-motion"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "not found")

if [ "$FRAMER_VERSION" != "10.12.16" ]; then
  echo "⚠️ Need to update framer-motion version to 10.12.16"
  
  # Update the package.json with the correct framer-motion version
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update direct dependency
    pkg.dependencies['framer-motion'] = '10.12.16';
    
    // Add overrides if they don't exist
    pkg.overrides = pkg.overrides || {};
    pkg.overrides['framer-motion'] = '10.12.16';
    
    // Write back the updated package.json
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
  
  echo "✅ Updated package.json with framer-motion 10.12.16"
else
  echo "✅ framer-motion is already at version 10.12.16"
fi

# Step 4: Build the application
echo "🏗️ Building the application"
npm run build

echo "✅ Done! Test locally with: npm run preview"
echo "   If it works, deploy to Vercel with: vercel --prod"
