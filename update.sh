#!/bin/bash
# Clear node_modules and lock file
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
npm install

# Build the application
npm run build

# Run the preview server
echo "Build completed. Run 'npm run preview' to preview your application."
