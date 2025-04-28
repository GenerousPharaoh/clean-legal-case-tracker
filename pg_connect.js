
    const { Pool } = require('pg');
    
    async function main() {
      try {
        // Format: postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
        const pool = new Pool({
          connectionString: 'postgres://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6enBscWRlb3FycGV5emtxcXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEwOTI1NywiZXhwIjoyMDYwNjg1MjU3fQ.Ikgga0xsVd7UDvYbUuTIoy1UcjdPW-SxrqbkfdhzoM8@db.pzzplqdeoqrpeyzkqqzo.supabase.co:5432/postgres',
          ssl: { rejectUnauthorized: false }
        });
        
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected to database');
        
        // Execute the create table SQL
        const sql = `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      role TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Set up RLS policies
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
    
    -- Create read policy
    CREATE POLICY "Users can read their profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);
    
    -- Create update policy
    CREATE POLICY "Users can update their profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);
  `;
        console.log('Executing SQL...');
        await client.query(sql);
        console.log('SQL executed successfully');
        
        // Insert the profile
        const insertSql = `
          INSERT INTO public.profiles (id, first_name, last_name, role, updated_at)
          VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin', NOW())
          ON CONFLICT (id) DO UPDATE 
          SET first_name = 'Kareem', 
              last_name = 'Hassanein',
              role = 'admin',
              updated_at = NOW()
          RETURNING *;
        `;
        
        const result = await client.query(insertSql);
        console.log('Insert result:', result.rows[0]);
        
        client.release();
        process.exit(0);
      } catch (err) {
        console.error('Database error:', err);
        process.exit(1);
      }
    }
    
    main();
    