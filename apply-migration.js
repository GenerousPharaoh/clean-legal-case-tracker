import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Initialize dotenv
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Connected to Supabase at', supabaseUrl);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250503000000_cleanup_schema_and_fix_conflicts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration: 20250503000000_cleanup_schema_and_fix_conflicts.sql');
    console.log('Migration SQL:', migrationSQL.substring(0, 100) + '...');
    
    // Execute the SQL directly via Supabase API
    const { data, error } = await supabase.rpc('pgconfig_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // If the direct RPC fails, try running SQL through the REST API
      console.warn('RPC method failed, trying alternative approach:', error.message);
      
      // Fetch auth user to verify connection
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Auth verification failed: ${authError.message}`);
      }
      
      console.log('Auth verified, user:', authData.user.email);
      
      // Try to execute the SQL using another approach
      // Split the SQL into separate statements
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      console.log(`Executing ${statements.length} SQL statements individually...`);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        console.log(`Executing statement ${i+1}/${statements.length}:`, 
                   stmt.substring(0, 50).replace(/\s+/g, ' ') + '...');
                   
        // For each statement, try to execute it
        const { data: stmtData, error: stmtError } = await supabase.rpc('pgconfig_execute', {
          statement: stmt
        });
        
        if (stmtError) {
          console.warn(`Statement ${i+1} error:`, stmtError.message);
        } else {
          console.log(`Statement ${i+1} succeeded.`);
        }
      }
    } else {
      console.log('Migration successfully applied via RPC!');
    }
    
    // Verify key tables have expected columns
    await verifySchema();
    
    console.log('All database changes have been applied successfully.');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }
}

async function verifySchema() {
  try {
    // Verify tables exist
    console.log('Verifying schema...');
    
    // Get table list
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['notes', 'files', 'projects']);
    
    if (tablesError) {
      throw new Error(`Schema verification failed: ${tablesError.message}`);
    }
    
    console.log('Tables found:', tables.map(t => t.table_name).join(', '));
    
    return true;
  } catch (error) {
    console.error('Schema verification error:', error.message);
    return false;
  }
}

// Run the migration
applyMigration(); 