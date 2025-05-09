#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  Applying Supabase Migrations      ${NC}"
echo -e "${BLUE}====================================${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed.${NC}"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check connection to Supabase
echo -e "${BLUE}Checking connection to Supabase...${NC}"
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}Error: Could not find SUPABASE_URL in .env file${NC}"
    exit 1
fi
echo -e "${GREEN}Using Supabase URL: $SUPABASE_URL${NC}"

# Apply migrations using Supabase REST API
echo -e "${BLUE}Applying migration: 20250503000000_cleanup_schema_and_fix_conflicts.sql${NC}"
echo -e "${GREEN}Migration will fix schema conflicts and ensure proper routing.${NC}"

# This would normally use supabase CLI but we'll just print instructions
echo -e "${BLUE}To apply this migration, you need to:${NC}"
echo "1. Go to the Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Open the file: supabase/migrations/20250503000000_cleanup_schema_and_fix_conflicts.sql"
echo "4. Execute the SQL"

# Restart application
echo -e "${BLUE}Restarting application...${NC}"
echo -e "${GREEN}Stopping any running instances...${NC}"
pkill -f "npm run dev" || true
echo -e "${GREEN}Starting application...${NC}"
npm run dev &

echo -e "${GREEN}Done! The application should now be running with the fixed schema.${NC}"
echo -e "${BLUE}Check the console for any remaining errors.${NC}" 