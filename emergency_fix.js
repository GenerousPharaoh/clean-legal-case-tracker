#!/usr/bin/env node

/**
 * EMERGENCY DATABASE FIX
 * Direct schema modification to resolve the 'created_by' column issue
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from all possible sources
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.fix' });
dotenv.config({ path: '.env.local' });

// Get Supabase credentials - using all possible variations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env files.');
  process.exit(1);
}

console.log('🔑 Using Supabase URL:', supabaseUrl);
console.log('🔑 Using Supabase key:', supabaseKey.substring(0, 10) + '...');

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Direct SQL commands to fix database schema
const SQL_COMMANDS = [
  // Reload configuration
  `SELECT pg_catalog.pg_reload_conf();`,
  
  // Force reset schema cache
  `NOTIFY pgrst, 'reload schema';`,
  
  // Ensure profiles table exists
  `CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Ensure cases table exists with ALL necessary columns
  `CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    owner_id UUID REFERENCES auth.users(id),
    project_id UUID,
    status TEXT DEFAULT 'active',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[]
  );`,
  
  // Make sure both columns exist (if table already exists)
  `DO $$
  BEGIN
    BEGIN
      ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_column THEN
      RAISE NOTICE 'created_by column already exists';
    END;
    
    BEGIN
      ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_column THEN
      RAISE NOTICE 'owner_id column already exists';
    END;
  END $$;`,
  
  // Create indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_cases_created_by ON public.cases(created_by);`,
  `CREATE INDEX IF NOT EXISTS idx_cases_owner_id ON public.cases(owner_id);`,
  
  // Make owner_id mirror created_by
  `UPDATE public.cases 
   SET owner_id = created_by 
   WHERE owner_id IS NULL AND created_by IS NOT NULL;`,
  
  `UPDATE public.cases 
   SET created_by = owner_id 
   WHERE created_by IS NULL AND owner_id IS NOT NULL;`,
  
  // Enable Row Level Security
  `ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
  
  // Create profiles for ALL users
  `INSERT INTO public.profiles (id, first_name, email, created_at, updated_at)
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
     p.id IS NULL;`,
  
  // Create trigger for new users
  `CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, first_name, created_at, updated_at)
     VALUES (
       NEW.id, 
       NEW.email, 
       split_part(NEW.email, '@', 1),
       NOW(),
       NOW()
     )
     ON CONFLICT (id) DO NOTHING;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;`,
  
  `DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;`,
  
  `CREATE TRIGGER create_profile_on_signup
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();`,
  
  // Create policies
  `DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
   CREATE POLICY "Users can view their own cases" 
   ON public.cases FOR SELECT 
   USING (created_by = auth.uid() OR owner_id = auth.uid());`,
  
  `DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
   CREATE POLICY "Users can update their own cases" 
   ON public.cases FOR UPDATE 
   USING (created_by = auth.uid() OR owner_id = auth.uid());`,
  
  `DROP POLICY IF EXISTS "Users can insert their own cases" ON public.cases;
   CREATE POLICY "Users can insert their own cases" 
   ON public.cases FOR INSERT 
   WITH CHECK (true);`,
  
  // Verify column exists
  `SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'cases' 
   AND table_schema = 'public'
   ORDER BY ordinal_position;`
];

async function executeSQL() {
  console.log('🚀 Starting emergency database fix...');
  
  for (let i = 0; i < SQL_COMMANDS.length; i++) {
    const sql = SQL_COMMANDS[i];
    const firstLine = sql.trim().split('\n')[0];
    console.log(`\n[${i+1}/${SQL_COMMANDS.length}] Executing: ${firstLine}...`);
    
    try {
      // For the last command, we want to get the results
      if (i === SQL_COMMANDS.length - 1) {
        const { data, error } = await supabase.rpc('pgmeta', {
          sql
        });
        
        if (error) {
          console.error(`❌ Error: ${error.message}`);
        } else {
          console.log('✅ Success! Column verification results:');
          console.table(data);
        }
      } else {
        const { error } = await supabase.rpc('pgmeta', {
          sql
        });
        
        if (error) {
          console.error(`❌ Error: ${error.message}`);
        } else {
          console.log('✅ Success!');
        }
      }
    } catch (err) {
      console.error(`❌ Unexpected error: ${err.message}`);
    }
  }
  
  console.log('\n🎉 Emergency database fix complete!');
}

// Run the fix
executeSQL().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
}); 
-- Add the create_case function
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

