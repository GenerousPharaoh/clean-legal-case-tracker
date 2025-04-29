import pg from 'pg';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Read the migration SQL
const migrationSQL = fs.readFileSync('./supabase/migrations/20240829000000_create_cases_table.sql', 'utf8');

async function main() {
  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: 'postgresql://postgres:e3OeeMm1OnnVvGpc@db.swtkpfpyjjkkemmvkhmz.supabase.co:5432/postgres',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database successfully');
    
    // Execute the migration as a whole script
    console.log('Applying cases table migration...');
    await client.query(migrationSQL);
    console.log('Migration applied successfully');
    
    // Verify the table was created
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'cases'
    `);
    
    if (rows.length > 0) {
      console.log('Cases table verified - Table exists');
      
      // Check if the is_archived column exists
      const { rows: columns } = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'cases'
        AND column_name = 'is_archived'
      `);
      
      if (columns.length > 0) {
        console.log('is_archived column verified - Column exists');
      } else {
        console.log('WARNING: is_archived column not found!');
      }
    } else {
      console.log('WARNING: Cases table not found after migration!');
    }
    
    // Clean up
    client.release();
    console.log('Done - You should now be able to create cases');
    process.exit(0);
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  }
}

main(); 