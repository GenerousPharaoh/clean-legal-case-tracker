import fetch from 'node-fetch';

// Supabase credentials
const supabaseUrl = 'https://pzzplqdeoqrpeyzkqqzo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6enBscWRlb3FycGV5emtxcXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEwOTI1NywiZXhwIjoyMDYwNjg1MjU3fQ.Ikgga0xsVd7UDvYbUuTIoy1UcjdPW-SxrqbkfdhzoM8';
const supabaseToken = 'sbp_8a130e0b4d0716c46ae5ca4ca1a03cac9808b2c9';

// Helper function to make requests to Supabase Management API
async function requestSupabaseAPI(endpoint, method = 'GET', body = null) {
  const url = `https://api.supabase.com/v1/${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error making API request:', error);
    throw error;
  }
}

// Helper function to make requests to the database directly
async function executeSQL(sql) {
  try {
    console.log('Executing SQL:', sql.substring(0, 50) + '...');
    
    // Using the service role key to make requests directly to Supabase
    const url = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

// Create profile table and insert profile using SQL admin API
async function fixProfileIssue() {
  try {
    console.log('Starting profile fix process using REST API...');
    
    // Get project information
    console.log('Fetching project information...');
    const projectInfo = await requestSupabaseAPI('projects/pzzplqdeoqrpeyzkqqzo');
    console.log('Project info retrieved:', projectInfo.name);
    
    // Execute SQL to create profiles table and set up RLS
    console.log('Creating profiles table and setting up RLS...');
    try {
      const sql = `
        -- Create profiles table
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

        -- Enable read access
        DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
        CREATE POLICY "Users can read their profile"
          ON public.profiles
          FOR SELECT
          USING (auth.uid() = id);

        -- Enable update access
        DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
        CREATE POLICY "Users can update their profile"
          ON public.profiles
          FOR UPDATE
          USING (auth.uid() = id);

        -- Insert the user's profile
        INSERT INTO public.profiles (id, first_name, last_name, role)
        VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin')
        ON CONFLICT (id) DO UPDATE 
        SET updated_at = now();
      `;
      
      // Execute the SQL statement via the SQL editor API
      const result = await requestSupabaseAPI(`projects/pzzplqdeoqrpeyzkqqzo/sql`, 'POST', {
        query: sql
      });
      
      console.log('SQL executed successfully:', result);
    } catch (sqlError) {
      console.error('Error executing SQL via API:', sqlError);
    }
    
    console.log('Profile fix process completed.');
  } catch (error) {
    console.error('Unexpected error during profile fix:', error);
  }
}

fixProfileIssue(); 