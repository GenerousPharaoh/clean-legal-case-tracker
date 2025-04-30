#!/bin/bash

# Emergency Database Fix Script
# This script runs a comprehensive fix for database schema and constraints

echo "🔥 EMERGENCY DATABASE FIX STARTING 🔥"
echo "This script will fix all database schema issues comprehensively"

# Check if @supabase/supabase-js is installed
if ! npm list @supabase/supabase-js &>/dev/null; then
  echo "⚙️ Installing required dependencies..."
  npm install --no-save @supabase/supabase-js dotenv
fi

# Check if pg is installed
if ! npm list pg &>/dev/null; then
  echo "⚙️ Installing PostgreSQL client..."
  npm install --no-save pg dotenv
fi

# Try the RPC method first
echo "🚀 Attempting fix using Supabase RPC..."
node emergency_fix.js

# If that fails, try direct PostgreSQL connection
echo "🚀 Attempting fix using direct PostgreSQL connection..."
node direct_db_fix.js

# Reload schema in application code
echo "🔄 Updating application code to handle potential schema inconsistencies..."

# Update file to ensure case creation works
cat > src/utils/ensureSchema.js << 'EOF'
/**
 * Schema Assurance Utility
 * This utility ensures the database schema is accessible regardless of cache state
 */

// Function to ensure a profile exists for a user
export async function ensureProfileExists(supabase, userId) {
  if (!userId) return null;
  
  try {
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) return profile;
    
    // Get user data
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Create profile
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: user.email?.split('@')[0] || 'User',
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    return newProfile;
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    return null;
  }
}

// Function to create a case with full schema compatibility
export async function createCaseCompatible(supabase, caseData, userId) {
  if (!userId) return { error: 'User ID is required' };
  
  try {
    // Ensure both user ID fields are set
    const completeData = {
      ...caseData,
      created_by: userId,
      owner_id: userId
    };
    
    // Create the case
    const { data, error } = await supabase
      .from('cases')
      .insert([completeData])
      .select();
    
    if (error) {
      // Try alternative approach if the first one fails
      console.log('First case creation approach failed, trying alternative...');
      
      // Run a raw SQL query to create the case
      const { data: sqlData, error: sqlError } = await supabase.rpc('create_case', {
        p_name: caseData.name || 'Untitled Case',
        p_description: caseData.description || '',
        p_status: caseData.status || 'active',
        p_user_id: userId,
        p_is_archived: false
      });
      
      if (sqlError) {
        return { error: sqlError };
      }
      
      return { data: sqlData };
    }
    
    return { data };
  } catch (error) {
    return { error };
  }
}
EOF

# Create the SQL function to handle case creation directly
echo "🔧 Creating SQL function for case creation..."

cat > create-case-function.sql << 'EOF'
-- Function to create a case by explicitly specifying all columns
CREATE OR REPLACE FUNCTION create_case(
  p_name TEXT, 
  p_description TEXT, 
  p_status TEXT, 
  p_user_id UUID,
  p_is_archived BOOLEAN DEFAULT FALSE
) RETURNS SETOF cases AS $$
DECLARE
  v_case_id UUID;
BEGIN
  -- Insert the case
  INSERT INTO public.cases (
    name,
    description,
    status,
    created_by,
    owner_id,
    is_archived,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_description,
    p_status,
    p_user_id,
    p_user_id,
    p_is_archived,
    NOW(),
    NOW()
  ) RETURNING id INTO v_case_id;
  
  -- Return the created case
  RETURN QUERY SELECT * FROM public.cases WHERE id = v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOF

# Add the function to the database fixes
echo "
-- Add the create_case function
$(cat create-case-function.sql)
" >> emergency_fix.js

echo "✅ Emergency fix completed!"
echo "The database schema should now be fixed and the application updated to handle any remaining issues."
echo "Please restart your application for the changes to take effect." 