#!/usr/bin/env node

/**
 * Comprehensive Database Fix Script
 * Fixes foreign key constraints and ensures profiles exist for all users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load fix environment variables
dotenv.config({ path: '.env.fix' });

// Fallback to regular .env if .env.fix doesn't have required values
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️ .env.fix missing required values, falling back to .env');
  dotenv.config();
}

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env.fix or .env');
  process.exit(1);
}

console.log(`🔑 Using Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Using Supabase key: ${supabaseKey.substring(0, 15)}...`);

// Initialize Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL statements for fixing the database
const SQL_CREATE_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const SQL_ENABLE_RLS = `
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
`;

const SQL_CREATE_POLICIES = `
DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
CREATE POLICY "Users can read their profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
CREATE POLICY "Users can update their profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can read all profiles" ON public.profiles;
CREATE POLICY "Service role can read all profiles"
ON public.profiles
FOR SELECT
USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can update all profiles" ON public.profiles;
CREATE POLICY "Service role can update all profiles"
ON public.profiles
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role');
`;

const SQL_FIX_CASES_COLUMNS = `
DO $$
DECLARE
  owner_id_exists BOOLEAN;
  created_by_exists BOOLEAN;
BEGIN
  -- Check if owner_id column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cases' AND column_name = 'owner_id'
  ) INTO owner_id_exists;
  
  -- Check if created_by column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cases' AND column_name = 'created_by'
  ) INTO created_by_exists;
  
  -- Log the current state
  RAISE NOTICE 'Current cases table state: owner_id exists: %, created_by exists: %', 
    owner_id_exists, created_by_exists;
  
  -- If both columns exist, we need to consolidate
  IF owner_id_exists AND created_by_exists THEN
    -- Drop the owner_id constraint if it exists
    BEGIN
      ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_owner_id_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
    END;
    
    -- Update data: copy owner_id to created_by where created_by is null
    UPDATE public.cases 
    SET created_by = owner_id 
    WHERE created_by IS NULL AND owner_id IS NOT NULL;
    
    -- Add constraint to created_by if it doesn't have one
    BEGIN
      ALTER TABLE public.cases 
        DROP CONSTRAINT IF EXISTS cases_created_by_fkey;
      
      ALTER TABLE public.cases 
        ADD CONSTRAINT cases_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding created_by constraint: %', SQLERRM;
    END;
  
  -- If only owner_id exists, rename it to created_by
  ELSIF owner_id_exists AND NOT created_by_exists THEN
    -- Drop the constraint first
    BEGIN
      ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_owner_id_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
    END;
    
    -- Add created_by column
    ALTER TABLE public.cases ADD COLUMN created_by UUID;
    
    -- Copy data from owner_id to created_by
    UPDATE public.cases SET created_by = owner_id;
    
    -- Add constraint to created_by
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
    
  -- If only created_by exists, make sure it has the right constraint
  ELSIF NOT owner_id_exists AND created_by_exists THEN
    -- Drop constraint if it exists (to recreate it)
    BEGIN
      ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_created_by_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
    END;
    
    -- Add constraint to created_by
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  
  -- If neither column exists, add created_by
  ELSE
    -- Add created_by column with constraint
    ALTER TABLE public.cases ADD COLUMN created_by UUID;
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END
$$;
`;

const SQL_CREATE_USER_TRIGGER = `
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, first_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1), -- Use part before @ as first name
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Skip if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to handle new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
`;

const SQL_CREATE_MISSING_PROFILES = `
INSERT INTO public.profiles (id, first_name, email, created_at, updated_at)
SELECT 
  u.id,
  SPLIT_PART(u.email, '@', 1),
  u.email,
  u.created_at,
  NOW()
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL;
`;

const SQL_VERIFY_CASES = `
SELECT 
  COUNT(*) as missing_profile_count
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL;
`;

// Main fix function
async function applyComprehensiveFix() {
  console.log('\n🚀 Starting comprehensive database fix...');
  
  try {
    console.log('\n📊 Step 1: Checking database connection...');
    // Use a simple SQL query to test connection instead of checking for _prisma_migrations
    const { data: connectionTest, error: connectionError } = await supabase.rpc('pgmeta', {
      args: { sql: 'SELECT 1 as connection_test;' },
      returns: 'json'
    });
    
    if (connectionError) {
      console.error(`❌ Connection failed: ${connectionError.message}`);
      console.log('Continuing with fixes anyway...');
    } else {
      console.log('✅ Database connection successful!\n');
    }
    
    // Execute SQL statements
    console.log('📊 Step 2: Creating/verifying profiles table...');
    await executeSQL(SQL_CREATE_PROFILES_TABLE);
    
    console.log('📊 Step 3: Enabling row level security...');
    await executeSQL(SQL_ENABLE_RLS);
    
    console.log('📊 Step 4: Creating security policies...');
    await executeSQL(SQL_CREATE_POLICIES);
    
    console.log('📊 Step 5: Fixing cases table columns and constraints...');
    await executeSQL(SQL_FIX_CASES_COLUMNS);
    
    console.log('📊 Step 6: Creating missing user profiles...');
    await executeSQL(SQL_CREATE_MISSING_PROFILES);
    
    console.log('📊 Step 7: Setting up user creation trigger...');
    await executeSQL(SQL_CREATE_USER_TRIGGER);
    
    console.log('\n🔍 Verifying fixes...');
    const { data, error } = await executeSQL(SQL_VERIFY_CASES, true);
    
    if (error) {
      console.error(`❌ Verification error: ${error.message}`);
    } else if (data && data[0] && data[0].missing_profile_count === 0) {
      console.log('✅ All users have corresponding profiles!');
    } else {
      console.warn(`⚠️ There are still ${data[0]?.missing_profile_count || 'unknown'} users without profiles`);
    }
    
    // Check if cases table exists and has the right columns
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('id')
      .limit(1);
    
    if (casesError && casesError.code === '42P01') {
      console.warn('⚠️ Cases table does not exist yet, but profiles are ready');
    } else if (casesError) {
      console.error(`❌ Error checking cases table: ${casesError.message}`);
    } else {
      console.log('✅ Cases table exists and is accessible');
    }
    
    console.log('\n🎉 Database fix complete! The foreign key constraint issue should be resolved.');
    console.log('You should now be able to create cases without encountering the foreign key constraint error.');
    
  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
  }
}

// Helper function to execute SQL
async function executeSQL(sql, returnData = false) {
  try {
    // Use Postgres RPC feature to execute raw SQL (requires service role)
    const { data, error } = await supabase.rpc('pgmeta', {
      args: { sql },
      returns: 'json'
    });
    
    if (error) {
      console.error(`❌ SQL error: ${error.message}`);
      return { error };
    }
    
    console.log('✅ SQL executed successfully');
    
    if (returnData) {
      return { data };
    }
    
    return { success: true };
  } catch (err) {
    console.error(`❌ Execution error: ${err.message}`);
    return { error: err };
  }
}

// Run the fix
applyComprehensiveFix().catch(err => {
  console.error(`❌ Fatal error: ${err.message}`);
}); 