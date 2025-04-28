import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  try {
    console.log('Starting profile fix operations...');

    // 1. Insert or update the profile row
    const { data: upsertData, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: '1a0ca6f0-c571-4b1a-8476-01583a26900b',
        first_name: 'Kareem',
        last_name: 'Hassanein',
        role: 'admin',
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
    } else {
      console.log('Profile upserted successfully');
    }

    // 2. Run a raw SQL query to fix RLS policies
    const sqlQueries = [
      `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
      
      `DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;`,
      
      `CREATE POLICY "Users can read their profile"
       ON public.profiles
       FOR SELECT
       USING (auth.uid() = id);`,
      
      `DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;`,
      
      `CREATE POLICY "Users can update their profile"
       ON public.profiles
       FOR UPDATE
       USING (auth.uid() = id);`
    ];

    for (const sql of sqlQueries) {
      const { error } = await supabase.rpc('pgmeta', { sql });
      
      if (error) {
        console.error(`Error executing SQL: ${sql}`, error);
      } else {
        console.log(`Successfully executed: ${sql.substring(0, 40)}...`);
      }
    }

    console.log('Profile fix operations completed.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

runSQL(); 