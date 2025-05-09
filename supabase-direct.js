// Direct Supabase API access using fetch
// This script applies the migration directly without dependencies

// Load the .env file manually
const fs = require('fs');
const path = require('path');

// Parse .env file
function parseEnv() {
  const envPath = path.join(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
      envVars[key] = value;
    }
  });
  
  return envVars;
}

// Get environment variables
const env = parseEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

// Log connection info
console.log(`Connecting to Supabase at ${supabaseUrl}`);

// Load migration SQL
const migrationPath = path.join(__dirname, 'supabase/migrations/20250503000000_cleanup_schema_and_fix_conflicts.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Function to execute SQL query via REST API
async function executeSQLonSupabase() {
  try {
    // Create the SQL endpoint URL
    const endpoint = `${supabaseUrl}/rest/v1/rpc/pgconfig_sql`;
    
    // Make API request
    console.log('Executing migration via Supabase API...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        sql_query: migrationSQL
      })
    });
    
    // Check response
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${JSON.stringify(error)}`);
    }
    
    console.log('Migration applied successfully!');
    console.log('Response:', await response.json());
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

// Execute the migration
executeSQLonSupabase().then(success => {
  if (success) {
    console.log('Database migration completed successfully.');
  } else {
    console.error('Database migration failed. Check the logs for details.');
    process.exit(1);
  }
}); 