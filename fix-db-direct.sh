#!/bin/bash

# Direct PostgreSQL Fix Script
# This script fixes database constraints by connecting directly to PostgreSQL

echo "🔧 Starting direct PostgreSQL database fix..."

# Check if pg library is installed
if ! npm list pg > /dev/null 2>&1; then
  echo "⚙️ Installing required dependencies..."
  npm install --no-save pg dotenv
fi

# Run the fix script
echo "🚀 Running PostgreSQL fix script..."
node pg_connect.js

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Database fix completed successfully!"
  echo "You should now be able to create cases without foreign key constraint errors."
else
  echo "❌ Database fix failed. Please check the logs above for errors."
fi

echo "Done!" 