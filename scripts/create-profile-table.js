import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfileTable() {
  try {
    console.log('Creating profile table and fixing issues...');
    
    // Check if the table exists first by attempting to fetch a profile
    const { error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Profiles table does not exist, creating it...');
      
      // Create the profiles table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          first_name TEXT,
          last_name TEXT,
          avatar_url TEXT,
          role TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      const { error: createError } = await supabase.rpc('pgmeta', { sql: createTableQuery });
      
      if (createError) {
        console.error('Error creating profiles table:', createError);
        console.log('Table creation failed. Please run the following SQL in the Supabase Dashboard SQL Editor:');
        console.log(createTableQuery);
      } else {
        console.log('Profiles table created successfully.');
      }
    }
    
    // Now insert the profile
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: '1a0ca6f0-c571-4b1a-8476-01583a26900b',
        first_name: 'Kareem',
        last_name: 'Hassanein',
        role: 'admin',
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error inserting profile:', insertError);
    } else {
      console.log('Profile created/updated successfully.');
    }
    
    // Add RLS policies
    const addRLSQuery = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
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
    `;
    
    const { error: rlsError } = await supabase.rpc('pgmeta', { sql: addRLSQuery });
    
    if (rlsError) {
      console.error('Error setting up RLS policies:', rlsError);
      console.log('RLS policy setup failed. Please run the following SQL in the Supabase Dashboard SQL Editor:');
      console.log(addRLSQuery);
    } else {
      console.log('RLS policies created successfully.');
    }
    
    console.log('Profile table and user setup completed.');
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('Please use the Supabase Dashboard SQL Editor to run the commands in PROFILE_FIX_INSTRUCTIONS.md');
  }
}

createProfileTable(); 