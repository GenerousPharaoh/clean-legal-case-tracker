#!/bin/bash

echo "🔧 Installing missing dependencies..."

# Make sure we're in the project directory
cd /Users/kareemhassanein/Desktop/legal-case-tracker/legal-case-tracker/legal-case-tracker-v2

# Install the missing Vite plugin
npm install --save-dev @vitejs/plugin-react

# Now try to preview
echo "✅ Dependency installed. Now running preview:"
npm run preview
