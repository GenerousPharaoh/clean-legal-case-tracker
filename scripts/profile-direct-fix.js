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

async function fixProfile() {
  try {
    console.log('Starting profile fix...');
    
    // 1. First, try to directly upsert the profile
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
    
    // 2. Verify if the profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '1a0ca6f0-c571-4b1a-8476-01583a26900b')
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile exists:', profileData);
    }
    
    console.log('Profile fix completed.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixProfile(); 