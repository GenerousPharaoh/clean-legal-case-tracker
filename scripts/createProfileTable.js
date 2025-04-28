import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Prefer service role key if available
const apiKey = serviceRoleKey || supabaseKey;

if (!supabaseUrl || !apiKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Connecting to Supabase REST API at:', supabaseUrl);

async function createProfileTable() {
  try {
    // SQL to create the profiles table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        role TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

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

      INSERT INTO public.profiles (id, first_name, last_name, role)
      VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin')
      ON CONFLICT (id) DO UPDATE 
      SET updated_at = now();
    `;

    console.log('Attempting to create profiles table via REST API...');

    // For SQL admin operations, we need to use the SQL API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create table:', response.status, errorText);
      
      // Try another approach - use the database management API
      console.log('Trying alternative approach...');
      const mgmtResponse = await fetch(`${supabaseUrl}/rest/v1/?sql=${encodeURIComponent(createTableSQL)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!mgmtResponse.ok) {
        const mgmtErrorText = await mgmtResponse.text();
        console.error('Alternative approach failed:', mgmtResponse.status, mgmtErrorText);
      } else {
        console.log('Alternative approach succeeded!');
        const data = await mgmtResponse.json();
        console.log('Response:', data);
      }
    } else {
      console.log('Profile table created successfully!');
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createProfileTable(); 