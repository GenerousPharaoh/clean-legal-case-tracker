import { createClient } from '@supabase/supabase-js';
import pkg from 'node-fetch';
const { default: fetch } = pkg;
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import pg from 'pg';

const execPromise = promisify(exec);
const { Pool } = pg;

// Initialize Supabase client with the correct credentials provided
const supabaseUrl = 'https://pzzplqdeoqrpeyzkqqzo.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6enBscWRlb3FycGV5emtxcXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMDkyNTcsImV4cCI6MjA2MDY4NTI1N30.Ns9A1ITv2LkqX1LBkGNVfJ274QKu6nIArItYqs1UQoY';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6enBscWRlb3FycGV5emtxcXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEwOTI1NywiZXhwIjoyMDYwNjg1MjU3fQ.Ikgga0xsVd7UDvYbUuTIoy1UcjdPW-SxrqbkfdhzoM8';

// Create DB connection pool using the connection string directly
const pool = new Pool({
  connectionString: 'postgresql://postgres:e3OeeMm1OnnVvGpc@db.pzzplqdeoqrpeyzkqqzo.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Use service role key for Supabase operations
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Direct SQL to create the table and insert the profile
async function createProfilesTableWithSQL() {
  console.log('Creating profiles table using direct database connection...');
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Successfully connected to database!');
    
    const sqlCreateTable = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        role TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Set up RLS policies
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
      
      -- Create read policy
      CREATE POLICY "Users can read their profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
      
      -- Create update policy
      CREATE POLICY "Users can update their profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
    `;
    
    console.log('Executing table creation SQL...');
    await client.query(sqlCreateTable);
    console.log('Table creation SQL executed successfully!');
    
    // Insert the profile
    console.log('Inserting/updating profile...');
    const insertSql = `
      INSERT INTO public.profiles (id, first_name, last_name, role, updated_at)
      VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin', NOW())
      ON CONFLICT (id) DO UPDATE 
      SET first_name = 'Kareem', 
          last_name = 'Hassanein',
          role = 'admin',
          updated_at = NOW()
      RETURNING *;
    `;
    
    const result = await client.query(insertSql);
    console.log('Profile inserted/updated successfully!');
    console.log('Profile data:', result.rows[0]);
    
    // Verify the profile
    console.log('Verifying profile...');
    const verifySql = `
      SELECT * FROM public.profiles 
      WHERE id = '1a0ca6f0-c571-4b1a-8476-01583a26900b';
    `;
    
    const verifyResult = await client.query(verifySql);
    console.log('Profile verification successful!');
    console.log('Verified profile data:', verifyResult.rows[0]);
    
    client.release();
    return true;
  } catch (err) {
    console.error('Database error:', err);
    return false;
  }
}

async function fixProfileIssue() {
  try {
    console.log('Starting profile fix with the correct credentials...');

    // Test Supabase connection
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.auth.getSession();
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
    } else {
      console.log('Supabase connection test successful:', testData);
    }

    // Using direct database connection to create the table and profiles
    console.log('Using direct PostgreSQL connection to fix profiles issue...');
    const result = await createProfilesTableWithSQL();
    
    if (result) {
      console.log('Profile fix completed successfully!');
    } else {
      console.error('Profile fix failed.');
    }

    console.log('Profile fix operations completed.');
  } catch (err) {
    console.error('Unexpected error during profile fix:', err);
  } finally {
    // Close the pool when done
    pool.end();
  }
}

fixProfileIssue(); 