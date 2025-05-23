#!/usr/bin/env node

/**
 * DIRECT DATABASE CONNECTION FIX
 * Uses direct PostgreSQL connection to ensure schema changes are applied
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from all possible sources
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.fix' });
dotenv.config({ path: '.env.local' });

// Get database connection string from various environment variables
const dbUrl = process.env.DATABASE_URL || 
              `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${getProjectRef(process.env.VITE_SUPABASE_URL)}.supabase.co:5432/postgres`;

console.log(`🔌 Connecting to database: ${dbUrl.split('@')[1]}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in environment variables');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false // Required for Supabase and many cloud databases
  }
});

// Direct SQL commands to fix database schema
const SQL_COMMANDS = [
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
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cases'
    ) THEN
      CREATE TABLE public.cases (
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
      );
      RAISE NOTICE 'Created cases table';
    ELSE
      RAISE NOTICE 'Cases table already exists';
    END IF;
  END $$;`,
  
  // Make sure both columns exist (if table already exists)
  `DO $$
  BEGIN
    BEGIN
      ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
      RAISE NOTICE 'Added created_by column';
    EXCEPTION WHEN duplicate_column THEN
      RAISE NOTICE 'created_by column already exists';
    END;
    
    BEGIN
      ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
      RAISE NOTICE 'Added owner_id column';
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
  console.log('🚀 Starting direct database fix...');
  
  // Get a client from the pool
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    for (let i = 0; i < SQL_COMMANDS.length; i++) {
      const sql = SQL_COMMANDS[i];
      const firstLine = sql.trim().split('\n')[0];
      console.log(`\n[${i+1}/${SQL_COMMANDS.length}] Executing: ${firstLine}...`);
      
      try {
        // For the last command, we want to get the results
        if (i === SQL_COMMANDS.length - 1) {
          const result = await client.query(sql);
          console.log('✅ Success! Column verification results:');
          console.table(result.rows);
        } else {
          await client.query(sql);
          console.log('✅ Success!');
        }
      } catch (err) {
        // Log error but continue with other commands
        console.error(`❌ Error with SQL: ${err.message}`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('\n🎉 Direct database fix complete!');
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('❌ Fatal error, transaction rolled back:', err);
  } finally {
    // Release the client back to the pool
    client.release();
  }
  
  // Close the pool
  await pool.end();
}

// Run the fix
executeSQL().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
}); 