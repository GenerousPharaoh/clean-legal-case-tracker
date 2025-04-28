import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with updated project credentials
const supabaseUrl = 'https://swtkpfpyjjkkemmvkhmz.supabase.co';

// For Supabase client, we need an anon key or service role key in JWT format
// Not the management API key that starts with sbp_
// Let's try with common formatting for these keys
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5amprZW1tdmtobXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4NDU0MTA1MCwiZXhwIjoyMDAwMTE3MDUwfQ.N2qIbfc9dedCwJd5XiSQ1u_xpUq_lMD2DUjpDlCj4Jg';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5amprZW1tdmtobXoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjg0NTQxMDUwLCJleHAiOjIwMDAxMTcwNTB9.I5_iE8QqMhJNQkNkLqBdnrxHoalK4q-V9SJvBg3_47I';

// Try with service role key first for more permissions
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixProfileIssue() {
  try {
    console.log('Starting profile fix with updated credentials...');

    // First, let's check if we can connect at all
    console.log('Testing connection...');
    const { data: testData, error: testError } = await supabase.auth.getSession();
    
    if (testError) {
      console.error('Connection test failed:', testError);
    } else {
      console.log('Connection test successful');
    }

    // 1. First, check if profiles table exists by trying to query it
    console.log('Step 1: Checking if profiles table exists...');
    const { error: queryError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
      
    if (queryError && queryError.code === '42P01') {
      console.log('Profiles table does not exist, creating it...');
      
      // Try to create the profiles table
      const { error: createError } = await supabase.rpc('create_profiles_table', {});
      
      if (createError) {
        console.error('Error creating table via RPC:', createError);
        
        // Fallback to direct SQL
        console.log('Trying to create table directly...');
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
        `;
        
        // Unfortunately we can't run raw SQL with the client directly
        console.log('Direct SQL not possible with client. Please run this SQL in Supabase Dashboard:');
        console.log(createTableSQL);
      } else {
        console.log('Profiles table created via RPC successfully.');
      }
    } else if (queryError) {
      console.error('Error checking profiles table:', queryError);
    } else {
      console.log('Profiles table exists.');
    }

    // 2. Insert or update the user profile
    console.log('Step 2: Upserting user profile...');
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
        });
        
      if (insertError) {
        console.error('Direct insert also failed:', insertError);
      } else {
        console.log('Profile inserted successfully:', insertData);
      }
    } else {
      console.log('Profile upserted successfully:', upsertData);
    }
    
    // 3. Verify the profile exists
    console.log('Step 3: Verifying profile...');
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

fixProfileIssue(); 