// Script to fix the profile-case relationship issue
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Read Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL fix
const sqlFix = fs.readFileSync('./fix_profiles_for_cases.sql', 'utf8');

async function applyProfileFix() {
  console.log('Starting profile fix for cases_owner_id_fkey constraint...');
  
  try {
    // Check if profiles table exists
    console.log('Checking if profiles table exists...');
    const { data: tableExists, error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.log('Profiles table does not exist, will create it');
    } else {
      console.log('Profiles table exists');
    }
    
    // Execute the SQL fix as a prepared statement
    console.log('Applying SQL fix...');
    
    // Split the SQL into separate statements
    const statements = sqlFix.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement separately
    for (const statement of statements) {
      if (statement.startsWith('SELECT')) {
        console.log(`\nExecuting query: ${statement.substring(0, 60)}...`);
        const { data, error } = await supabase.rpc('pgmeta', { sql: statement });
        
        if (error) {
          console.error('Error executing query:', error);
        } else {
          console.log('Results:', data);
        }
      } else {
        console.log(`\nExecuting statement: ${statement.substring(0, 60)}...`);
        const { error } = await supabase.rpc('pgmeta', { sql: statement });
        
        if (error) {
          console.error('Error executing statement:', error);
        } else {
          console.log('Statement executed successfully');
        }
      }
    }
    
    // Verify the fix worked by checking for users without profiles
    console.log('\nVerifying the fix...');
    const { data: verification, error: verificationError } = await supabase.rpc('pgmeta', { 
      sql: `SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL;` 
    });
    
    if (verificationError) {
      console.error('Error verifying the fix:', verificationError);
    } else {
      const missingProfiles = parseInt(verification[0]?.count || '0');
      
      if (missingProfiles === 0) {
        console.log('✅ FIX SUCCESSFUL: All users now have profile entries!');
      } else {
        console.error(`❌ FIX INCOMPLETE: ${missingProfiles} users still missing profiles`);
      }
    }
    
    console.log('\nProfile fix complete - you should now be able to create cases.');
  } catch (err) {
    console.error('Unexpected error during profile fix:', err);
    process.exit(1);
  }
}

// Run the fix
applyProfileFix(); 