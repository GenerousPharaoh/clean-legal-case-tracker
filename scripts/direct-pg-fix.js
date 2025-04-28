import pg from 'pg';
const { Client } = pg;

// Database connection details
const client = new Client({
  user: 'postgres',
  password: 'TyfjogIY7qZPkNV8', // Using the direct password provided
  host: 'pzzplqdeoqrpeyzkqqzo.supabase.co', // Use the supabase URL without db. prefix
  port: 5432,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false // Required for Supabase connection
  }
});

async function fixProfileIssue() {
  try {
    console.log('Starting direct PostgreSQL fix...');
    
    // Connect to the database
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');
    
    // Define the SQL statements
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        role TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const enableRLSSQL = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `;
    
    const createReadPolicySQL = `
      DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
      CREATE POLICY "Users can read their profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
    `;
    
    const createUpdatePolicySQL = `
      DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
      CREATE POLICY "Users can update their profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
    `;
    
    const insertProfileSQL = `
      INSERT INTO public.profiles (id, first_name, last_name, role)
      VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin')
      ON CONFLICT (id) DO UPDATE 
      SET updated_at = now();
    `;
    
    // Execute each SQL statement
    try {
      console.log('Creating profiles table...');
      await client.query(createTableSQL);
      console.log('Profiles table created or verified successfully.');
      
      console.log('Enabling Row Level Security...');
      await client.query(enableRLSSQL);
      console.log('RLS enabled successfully.');
      
      console.log('Creating read policy...');
      await client.query(createReadPolicySQL);
      console.log('Read policy created successfully.');
      
      console.log('Creating update policy...');
      await client.query(createUpdatePolicySQL);
      console.log('Update policy created successfully.');
      
      console.log('Inserting profile...');
      await client.query(insertProfileSQL);
      console.log('Profile inserted successfully.');
      
      // Verify that the profile exists
      console.log('Verifying profile...');
      const verifyResult = await client.query(`
        SELECT * FROM profiles 
        WHERE id = '1a0ca6f0-c571-4b1a-8476-01583a26900b'
      `);
      
      if (verifyResult.rows.length > 0) {
        console.log('Profile verified successfully:', verifyResult.rows[0]);
      } else {
        console.error('Profile verification failed: No profile found.');
      }
    } catch (sqlError) {
      console.error('Error executing SQL:', sqlError);
    }
    
  } catch (error) {
    console.error('Unexpected error during profile fix:', error);
  } finally {
    // Close the database connection
    try {
      await client.end();
      console.log('Database connection closed.');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }
}

fixProfileIssue(); 