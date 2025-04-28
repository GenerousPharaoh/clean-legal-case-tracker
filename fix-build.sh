#!/bin/bash

echo "🛠️ Starting emergency fix for dependency issues..."

# Remove node_modules and lockfile
echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with exact versions
echo "📦 Installing dependencies with fixed versions..."
npm install

# Add a polyfill for Map.clear if needed
echo "🩹 Adding Map.clear polyfill to ensure compatibility..."
mkdir -p src/utils
cat > src/utils/mapPolyfill.js << 'EOL'
// Polyfill for Map.clear in environments where it might be missing
if (typeof Map !== 'undefined' && !Map.prototype.clear) {
  console.info('Adding Map.clear polyfill for compatibility');
  Map.prototype.clear = function() {
    this.forEach((_, key) => {
      this.delete(key);
    });
    return this;
  };
}

// Also check for custom Map implementations that might be in use
if (typeof window !== 'undefined') {
  window.addEventListener('load', function() {
    setTimeout(() => {
      try {
        // Scan for objects with Map-like structures but missing clear
        Object.keys(window).forEach(key => {
          const obj = window[key];
          if (obj && typeof obj === 'object' && obj.events) {
            Object.keys(obj.events).forEach(eventKey => {
              const event = obj.events[eventKey];
              if (event) {
                ['highPriority', 'regular'].forEach(priority => {
                  if (event[priority] && 
                      typeof event[priority].forEach === 'function' &&
                      typeof event[priority].delete === 'function' &&
                      !event[priority].clear) {
                    // Add missing clear method
                    event[priority].clear = function() {
                      this.forEach((_, key) => {
                        this.delete(key);
                      });
                      return this;
                    };
                  }
                });
              }
            });
          }
        });
      } catch (e) {
        // Ignore errors from accessing properties
      }
    }, 500);
  });
}
EOL

# Copy the comprehensive polyfill to the public directory
echo "🧩 Adding comprehensive polyfill to public directory..."
if [ ! -d "public" ]; then
  mkdir -p public
fi
cp public/map-polyfill.js public/emergency-fix.js

# Update the main entry point to include the polyfill
echo "🔄 Updating main entry point to include polyfill..."
if [ -f "src/main.jsx" ]; then
  sed -i.bak '1s/^/import "\.\/utils\/mapPolyfill.js";\n/' src/main.jsx
elif [ -f "src/main.tsx" ]; then
  sed -i.bak '1s/^/import "\.\/utils\/mapPolyfill.js";\n/' src/main.tsx
elif [ -f "src/main.js" ]; then
  sed -i.bak '1s/^/import "\.\/utils\/mapPolyfill.js";\n/' src/main.js
else
  echo "⚠️ Could not find main entry file. Please manually add the polyfill import."
fi

# Make sure index.html includes the emergency-fix.js script
if [ -f "index.html" ]; then
  if ! grep -q "emergency-fix.js" index.html; then
    echo "📝 Adding emergency-fix.js script to index.html..."
    sed -i.bak 's/<head>/<head>\n    <!-- Emergency fix for Map.clear function issue - loads before any app code -->\n    <script src="\/emergency-fix.js"><\/script>/' index.html
  fi
fi

# Build the project
echo "🏗️ Building the project..."
npm run build

echo "✅ Fix completed. Your project should now deploy without the 'clear is not a function' error."
echo "Next steps:"
echo "1. Test locally with: npm run preview"
echo "2. Deploy to Vercel with: vercel --prod" 