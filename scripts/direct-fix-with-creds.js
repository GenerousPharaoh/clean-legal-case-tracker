import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = 'https://pzzplqdeoqrpeyzkqqzo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6enBscWRlb3FycGV5emtxcXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEwOTI1NywiZXhwIjoyMDYwNjg1MjU3fQ.Ikgga0xsVd7UDvYbUuTIoy1UcjdPW-SxrqbkfdhzoM8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfileTableAndRLS() {
  try {
    console.log('Starting comprehensive profile fix with admin credentials...');

    // 1. Create the profiles table if it doesn't exist
    console.log('Step 1: Creating profiles table if needed...');
    const { error: createTableError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          first_name TEXT,
          last_name TEXT,
          avatar_url TEXT,
          role TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (createTableError) {
      console.error('Error creating profiles table:', createTableError);
      
      // Alternative approach if RPC fails: use the REST SQL endpoint
      console.log('Trying alternative table creation approach...');
      const { error: sqlError } = await supabase.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          first_name TEXT,
          last_name TEXT,
          avatar_url TEXT,
          role TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      if (sqlError) {
        console.error('Alternative table creation also failed:', sqlError);
      } else {
        console.log('Profiles table created successfully via alternative method.');
      }
    } else {
      console.log('Profiles table created or verified successfully.');
    }

    // 2. Setup RLS policies
    console.log('Step 2: Setting up RLS policies...');
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });

    if (rlsError) {
      console.error('Error setting up RLS policies:', rlsError);
    } else {
      console.log('RLS policies set up successfully.');
    }

    // 3. Insert or update profile for the user
    console.log('Step 3: Inserting profile for user...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: '1a0ca6f0-c571-4b1a-8476-01583a26900b',
        first_name: 'Kareem',
        last_name: 'Hassanein',
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .select();

    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      
      // Try direct insert if upsert fails
      console.log('Trying direct insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: '1a0ca6f0-c571-4b1a-8476-01583a26900b',
          first_name: 'Kareem',
          last_name: 'Hassanein',
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (insertError) {
        console.error('Direct insert also failed:', insertError);
      } else {
        console.log('Profile created via direct insert:', insertData);
      }
    } else {
      console.log('Profile upserted successfully:', upsertData);
    }
    
    // 4. Verify if the profile exists
    console.log('Step 4: Verifying profile existence...');
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '1a0ca6f0-c571-4b1a-8476-01583a26900b')
      .single();
      
    if (fetchError) {
      console.error('Error verifying profile:', fetchError);
    } else {
      console.log('Profile verification successful:', profile);
    }

    console.log('Profile fix operations completed.');
  } catch (err) {
    console.error('Unexpected error during profile fix:', err);
  }
}

fixProfileTableAndRLS(); 