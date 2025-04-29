import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create a Supabase client with the service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    console.log('Starting admin access fix...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);

    // 1. List all users
    console.log('\nFetching users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    console.log(`Found ${users.users.length} users:`);
    users.users.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} (ID: ${user.id})`);
    });

    // 2. List all profiles
    console.log('\nFetching profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      throw profilesError;
    }
    
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach((profile, i) => {
      console.log(`${i+1}. ID: ${profile.id}, Role: ${profile.role}`);
    });

    // 3. Update all existing profiles to admin
    console.log('\nUpdating existing profiles to admin role...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (updateError) {
      throw updateError;
    }

    // 4. Create profiles for users without them
    console.log('\nCreating admin profiles for users without profiles...');
    const userIds = users.users.map(user => user.id);
    const profileIds = profiles.map(profile => profile.id);
    
    // Find users without profiles
    const missingProfileUserIds = userIds.filter(id => !profileIds.includes(id));
    
    console.log(`Found ${missingProfileUserIds.length} users without profiles`);
    
    // Prepare data for insertion
    const profilesToInsert = missingProfileUserIds.map(id => {
      const user = users.users.find(u => u.id === id);
      const firstName = user.email ? user.email.split('@')[0] : 'User';
      
      return {
        id,
        first_name: firstName,
        last_name: '',
        email: user.email,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    if (profilesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profilesToInsert);
      
      if (insertError) {
        throw insertError;
      }
    }

    // 5. Update RLS policies - this requires executing SQL directly, which might not be available via JS client
    console.log('\nNote: RLS policies may need to be updated via SQL in the Supabase dashboard');
    console.log('Please make sure all profiles have admin access by checking the Supabase dashboard');

    // 6. Verify results
    console.log('\nVerifying results...');
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, role');
    
    if (verifyError) {
      throw verifyError;
    }
    
    console.log('\nUpdated profiles:');
    updatedProfiles.forEach((profile, i) => {
      console.log(`${i+1}. ID: ${profile.id}, Role: ${profile.role}`);
    });

    console.log('\nAdmin access fix complete!');
    console.log('You should now be able to log in with any user account with admin privileges.');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main(); 