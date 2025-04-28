import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertProfile() {
  try {
    console.log('Attempting to insert profile directly...');

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: '1a0ca6f0-c571-4b1a-8476-01583a26900b', 
          first_name: 'Kareem',
          last_name: 'Hassanein',
          role: 'admin',
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error creating profile:', error);
      
      if (error.code === '42P01') {
        console.log('Table does not exist - trying to create via REST API');
      } else {
        console.log('Trying upsert instead...');
        
        // Try upsert if insert fails
        const { data: upsertData, error: upsertError } = await supabase
          .from('profiles')
          .upsert([
            { 
              id: '1a0ca6f0-c571-4b1a-8476-01583a26900b', 
              first_name: 'Kareem',
              last_name: 'Hassanein',
              role: 'admin',
              updated_at: new Date().toISOString()
            }
          ])
          .select();
          
        if (upsertError) {
          console.error('Upsert also failed:', upsertError);
        } else {
          console.log('Profile upserted successfully:', upsertData);
        }
      }
    } else {
      console.log('Profile created successfully:', data);
    }
    
    // Verify if we can fetch the profile
    console.log('Trying to fetch the profile...');
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '1a0ca6f0-c571-4b1a-8476-01583a26900b');
      
    if (fetchError) {
      console.error('Could not fetch profile:', fetchError);
    } else {
      console.log('Profile fetch result:', profile);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

insertProfile(); 