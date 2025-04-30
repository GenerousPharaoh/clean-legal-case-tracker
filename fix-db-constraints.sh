#!/bin/bash

# Fix Database Constraints Script
# This script runs the comprehensive database fix

echo "🔧 Starting database constraint fix process..."

# Check if @supabase/supabase-js is installed
if ! npm list @supabase/supabase-js > /dev/null 2>&1; then
  echo "⚙️ Installing required dependencies..."
  npm install --no-save @supabase/supabase-js dotenv
fi

# Run the fix script
echo "🚀 Running database fix script..."
node comprehensive_db_fix.js

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Database fix completed!"
  echo "You should now be able to create cases without foreign key constraint errors."
else
  echo "❌ Database fix failed. Please check the logs above for errors."
fi

echo "Done!" 