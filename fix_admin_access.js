import pg from 'pg';
const { Pool } = pg;

async function main() {
  try {
    // Format: postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    const pool = new Pool({
      connectionString: 'postgres://postgres.swtkpfpyjjkkemmvkhmz:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw@swtkpfpyjjkkemmvkhmz.supabase.co:5432/postgres',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database');
    
    // 1. List all users from auth.users
    console.log('Listing all users...');
    const usersResult = await client.query(`
      SELECT id, email, created_at 
      FROM auth.users 
      ORDER BY created_at DESC
    `);
    
    console.log('Found users:');
    usersResult.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} (ID: ${user.id})`);
    });
    
    // 2. Check if users have profiles
    console.log('\nChecking profiles...');
    const profilesResult = await client.query(`
      SELECT p.id, p.first_name, p.last_name, p.role, u.email
      FROM public.profiles p
      JOIN auth.users u ON p.id = u.id
    `);
    
    console.log('Found profiles:');
    profilesResult.rows.forEach((profile, i) => {
      console.log(`${i+1}. ${profile.email} (${profile.first_name} ${profile.last_name}) - Role: ${profile.role}`);
    });
    
    // 3. Grant admin access to all users (fix for Google login and regular logins)
    console.log('\nGranting admin access to all users...');
    
    // First, update all existing profiles to admin
    await client.query(`
      UPDATE public.profiles
      SET role = 'admin',
          updated_at = NOW()
    `);
    
    // Then, create profiles for any users who don't have them
    await client.query(`
      INSERT INTO public.profiles (id, first_name, last_name, email, role, created_at, updated_at)
      SELECT 
        u.id, 
        split_part(u.email, '@', 1), 
        '', 
        u.email,
        'admin',
        NOW(),
        NOW()
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE p.id IS NULL
    `);
    
    // 4. Add policy to allow service role and admin access to all profiles
    console.log('Adding service_role and admin bypass policies...');
    await client.query(`
      -- Allow service role to manage all profiles
      DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
      CREATE POLICY "Service role can manage all profiles" 
        ON public.profiles 
        FOR ALL 
        USING (auth.jwt() ->> 'role' = 'service_role');
      
      -- Allow admins to see all profiles (important for user management)
      DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
      CREATE POLICY "Admins can read all profiles" 
        ON public.profiles 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );
    `);
    
    // Confirm results
    const finalCheckResult = await client.query(`
      SELECT u.email, p.role 
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY u.email
    `);
    
    console.log('\nFinal user roles:');
    finalCheckResult.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} - Role: ${user.role || 'NULL'}`);
    });
    
    console.log('\nAdmin access fix complete!');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
}

main(); 