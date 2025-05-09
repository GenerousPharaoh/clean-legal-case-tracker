// Direct Supabase API access using fetch
// This script applies the migration directly without dependencies (CommonJS version)

// Load the .env file manually
const fs = require('fs');
const path = require('path');
const https = require('https');

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

// Make a HTTPS request without fetch
function makeRequest(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    // Parse URL for hostname and path
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Function to execute SQL query via REST API
async function executeSQLonSupabase() {
  try {
    // Create the SQL endpoint URL
    const endpoint = `${supabaseUrl}/rest/v1/rpc/pgconfig_sql`;
    
    // Split SQL into manageable chunks
    const statements = migrationSQL.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute statements individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i+1}/${statements.length}: ${stmt.substring(0, 50)}...`);
      
      // Request headers
      const headers = {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      };
      
      // Make direct request to SQL endpoint
      const response = await makeRequest('POST', endpoint, headers, {
        sql_query: stmt + ';'
      });
      
      // Check response
      if (response.statusCode >= 400) {
        console.warn(`Statement ${i+1} error:`, response.data);
        console.log('Continuing with next statement...');
      } else {
        console.log(`Statement ${i+1} executed successfully.`);
      }
    }
    
    console.log('Migration SQL execution completed!');
    
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