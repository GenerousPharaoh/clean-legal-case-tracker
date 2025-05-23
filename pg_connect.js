#!/usr/bin/env node

/**
 * Direct PostgreSQL Fix Script
 * Fixes foreign key constraints and ensures profiles exist for all users
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Connection parameters
const connectionString = process.env.DATABASE_URL || 
                         'postgresql://postgres:e3OeeMm1OnnVvGpc@db.pzzplqdeoqrpeyzkqqzo.supabase.co:5432/postgres';

console.log(`🔌 Connecting to PostgreSQL database...`);
console.log(`🔑 Using connection string: ${connectionString.substring(0, 35)}...`);

// Create a client instance
const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase and many cloud databases
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

const SQL_VERIFY_PROFILES = `
SELECT 
  COUNT(*) as missing_profile_count
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL;
`;

const SQL_CHECK_TABLES = `
SELECT 
  table_name
FROM 
  information_schema.tables
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name;
`;

// Main fix function
async function applyDatabaseFixes() {
  try {
    // Connect to the database
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Check available tables
    console.log('\n📊 Step 1: Checking database tables...');
    const tablesResult = await client.query(SQL_CHECK_TABLES);
    console.log('Available tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    
    // Create profiles table if it doesn't exist
    console.log('\n📊 Step 2: Creating/verifying profiles table...');
    await client.query(SQL_CREATE_PROFILES_TABLE);
    console.log('✅ Profiles table created/verified');
    
    // Enable row level security
    console.log('\n📊 Step 3: Enabling row level security...');
    await client.query(SQL_ENABLE_RLS);
    console.log('✅ Row level security enabled');
    
    // Create security policies
    console.log('\n📊 Step 4: Creating security policies...');
    await client.query(SQL_CREATE_POLICIES);
    console.log('✅ Security policies created');
    
    // Check if cases table exists
    const casesTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cases'
      );
    `);
    
    if (casesTableResult.rows[0].exists) {
      console.log('\n📊 Step 5: Fixing cases table columns and constraints...');
      await client.query(SQL_FIX_CASES_COLUMNS);
      console.log('✅ Cases table columns and constraints fixed');
    } else {
      console.log('\n⚠️ Cases table does not exist, skipping cases table fixes');
    }
    
    // Create missing user profiles
    console.log('\n📊 Step 6: Creating missing user profiles...');
    await client.query(SQL_CREATE_MISSING_PROFILES);
    console.log('✅ Missing user profiles created');
    
    // Set up user creation trigger
    console.log('\n📊 Step 7: Setting up user creation trigger...');
    await client.query(SQL_CREATE_USER_TRIGGER);
    console.log('✅ User creation trigger set up');
    
    // Verify fixes
    console.log('\n🔍 Verifying fixes...');
    const verifyResult = await client.query(SQL_VERIFY_PROFILES);
    const missingProfileCount = parseInt(verifyResult.rows[0].missing_profile_count);
    
    if (missingProfileCount === 0) {
      console.log('✅ All users have corresponding profiles! Foreign key constraints should now work correctly.');
    } else {
      console.warn(`⚠️ There are still ${missingProfileCount} users without profiles`);
    }
    
    console.log('\n🎉 Database fix complete! The foreign key constraint issue should be resolved.');
    console.log('You should now be able to create cases without encountering the foreign key constraint error.');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    // Close the database connection
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
applyDatabaseFixes().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
    