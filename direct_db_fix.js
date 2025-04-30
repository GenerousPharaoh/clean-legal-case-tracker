#!/usr/bin/env node

/**
 * Direct DB Fix - Applies SQL fixes directly using Supabase REST API
 * This script will execute the SQL fix script directly against your Supabase database
 */

import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Read Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in environment variables');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Read the SQL fix script
const sqlFix = fs.readFileSync(resolve(__dirname, 'fix_db_constraints.sql'), 'utf8');

// Split into statements
const statements = sqlFix.split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0)
  .map(stmt => stmt + ';');

console.log(`🔄 Found ${statements.length} SQL statements to execute...`);

// Execute SQL statements directly using Supabase's REST API
async function executeSQL(sql) {
  const endpoint = `${supabaseUrl}/rest/v1/rpc/pgmeta`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        sql: sql
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.error || data.message || 'Unknown error' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Main function to run all statements
async function applyDatabaseFixes() {
  console.log('🔧 Starting database fix application...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n🔧 [${i + 1}/${statements.length}] Executing statement...`);
    
    try {
      const result = await executeSQL(statement);
      
      if (result.success) {
        console.log(`  ✅ Statement executed successfully`);
        successCount++;
      } else {
        console.error(`  ❌ Error executing statement: ${result.error}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`  ❌ Unexpected error: ${error.message}`);
      errorCount++;
    }
  }
  
  // Verify the database structure after the fixes
  try {
    console.log('\n🔍 Verifying database structure...');
    
    // Check for profiles with null email
    const profileCheck = await executeSQL(`
      SELECT COUNT(*) FROM auth.users u 
      LEFT JOIN public.profiles p ON u.id = p.id 
      WHERE p.id IS NULL;
    `);
    
    if (profileCheck.success) {
      console.log('  ✅ Profile check completed');
      const missingProfiles = parseInt(profileCheck.data?.[0]?.count || '0');
      
      if (missingProfiles === 0) {
        console.log('  ✅ All users have profile entries');
      } else {
        console.error(`  ❌ ${missingProfiles} users still missing profiles`);
      }
    } else {
      console.error(`  ❌ Error checking profiles: ${profileCheck.error}`);
    }
    
    // Check cases table structure
    const casesCheck = await executeSQL(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cases' 
      ORDER BY column_name;
    `);
    
    if (casesCheck.success) {
      console.log('  ✅ Cases table structure:');
      console.table(casesCheck.data);
    } else {
      console.error(`  ❌ Error checking cases table: ${casesCheck.error}`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error during verification: ${error.message}`);
  }
  
  console.log(`\n📊 Summary: ${successCount} successful statements, ${errorCount} errors`);
  
  if (errorCount === 0) {
    console.log('\n✅ Database fixes applied successfully!');
    console.log('🚀 Your app should now work correctly with the cases table');
  } else {
    console.log('\n⚠️ Some errors occurred during fix application');
    console.log('👨‍💻 You may need to run the SQL manually in the Supabase SQL Editor');
  }
}

// Run the main function
applyDatabaseFixes().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 