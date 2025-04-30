#!/usr/bin/env node

/**
 * Database setup script for Legal Case Tracker
 * 
 * This script:
 * 1. Connects to your Supabase project
 * 2. Creates/fixes profiles table
 * 3. Sets up DB triggers to auto-create profiles for new users
 * 4. Ensures all existing users have corresponding profiles
 * 5. Fixes cases table to match code
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials in environment');
  console.error('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL fix file
const sqlFix = fs.readFileSync('./fix_all_db_tables.sql', 'utf8');

async function setupDatabase() {
  console.log('🔄 Starting database setup...');
  
  try {
    // Split the SQL into separate statements
    const statements = sqlFix.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 [${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
      
      try {
        // Execute SQL through the pgMeta RPC function
        const { error } = await supabase.rpc('pgmeta', { sql: statement });
        
        if (error) {
          console.error(`  ❌ Error executing statement: ${error.message}`);
        } else {
          console.log(`  ✅ Statement executed successfully`);
        }
      } catch (statementError) {
        console.error(`  ❌ Error executing statement: ${statementError.message}`);
      }
    }
    
    // Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    // Check if all users have profiles
    const { data: missingProfiles, error: profilesError } = await supabase.rpc('pgmeta', { 
      sql: `SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL;`
    });
    
    if (profilesError) {
      console.error(`  ❌ Error checking profiles: ${profilesError.message}`);
    } else {
      const missingProfileCount = parseInt(missingProfiles?.[0]?.count || '0');
      
      if (missingProfileCount === 0) {
        console.log('  ✅ All users have profile entries');
      } else {
        console.error(`  ❌ ${missingProfileCount} users still missing profiles`);
      }
    }
    
    console.log('\n✅ Database setup complete!');
    console.log('✨ You should now be able to create and access cases in the application');
    
  } catch (err) {
    console.error('\n❌ Unexpected error during database setup:', err);
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 