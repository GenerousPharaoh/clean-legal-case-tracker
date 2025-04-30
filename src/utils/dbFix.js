/**
 * Database Fix Utility
 * Fixes foreign key constraints and ensures profiles exist for all users
 * 
 * This utility runs on application startup to ensure the database is properly configured
 */

import { createClient } from '@supabase/supabase-js';

// SQL statements for fixing the database
const SQL_CREATE_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const SQL_ENABLE_RLS = `
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
`;

const SQL_CREATE_POLICIES = `
DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
CREATE POLICY "Users can read their profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
CREATE POLICY "Users can update their profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
`;

const SQL_FIX_CASES_COLUMNS = `
DO $$
DECLARE
  owner_id_exists BOOLEAN;
  created_by_exists BOOLEAN;
BEGIN
  -- Check if owner_id column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cases' AND column_name = 'owner_id'
  ) INTO owner_id_exists;
  
  -- Check if created_by column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cases' AND column_name = 'created_by'
  ) INTO created_by_exists;
  
  -- If both columns exist, we need to consolidate
  IF owner_id_exists AND created_by_exists THEN
    -- Drop the owner_id constraint if it exists
    BEGIN
      ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_owner_id_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
    END;
    
    -- Update data: copy owner_id to created_by where created_by is null
    UPDATE public.cases 
    SET created_by = owner_id 
    WHERE created_by IS NULL AND owner_id IS NOT NULL;
    
    -- Add constraint to created_by if it doesn't have one
    BEGIN
      ALTER TABLE public.cases 
        DROP CONSTRAINT IF EXISTS cases_created_by_fkey;
      
      ALTER TABLE public.cases 
        ADD CONSTRAINT cases_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding created_by constraint: %', SQLERRM;
    END;
  
  -- If only owner_id exists, rename it to created_by
  ELSIF owner_id_exists AND NOT created_by_exists THEN
    -- Drop the constraint first
    BEGIN
      ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_owner_id_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
    END;
    
    -- Add created_by column
    ALTER TABLE public.cases ADD COLUMN created_by UUID;
    
    -- Copy data from owner_id to created_by
    UPDATE public.cases SET created_by = owner_id;
    
    -- Add constraint to created_by
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
    
  -- If only created_by exists, make sure it has the right constraint
  ELSIF NOT owner_id_exists AND created_by_exists THEN
    -- Drop constraint if it exists (to recreate it)
    BEGIN
      ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_created_by_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
    END;
    
    -- Add constraint to created_by
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  
  -- If neither column exists, add created_by
  ELSE
    -- Add created_by column with constraint
    ALTER TABLE public.cases ADD COLUMN created_by UUID;
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END
$$;
`;

const SQL_CREATE_MISSING_PROFILES = `
INSERT INTO public.profiles (id, first_name, email, created_at, updated_at)
SELECT 
  u.id,
  SPLIT_PART(u.email, '@', 1),
  u.email,
  u.created_at,
  NOW()
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL;
`;

/**
 * Applies database fixes to ensure proper operation
 * This function should be called at application startup
 */
export async function applyDatabaseFixes() {
  try {
    console.log('🔄 Applying database fixes...');
    
    // Create Supabase client with service role key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials. Database fixes will not be applied.');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Apply SQL fixes
    try {
      // 1. Create profiles table if needed
      await supabase.rpc('pgmeta', {
        args: { sql: SQL_CREATE_PROFILES_TABLE },
        returns: 'json'
      });
      
      // 2. Enable RLS
      await supabase.rpc('pgmeta', {
        args: { sql: SQL_ENABLE_RLS },
        returns: 'json'
      });
      
      // 3. Create policies
      await supabase.rpc('pgmeta', {
        args: { sql: SQL_CREATE_POLICIES },
        returns: 'json'
      });
      
      // 4. Fix cases table
      await supabase.rpc('pgmeta', {
        args: { sql: SQL_FIX_CASES_COLUMNS },
        returns: 'json'
      });
      
      // 5. Create missing profiles
      await supabase.rpc('pgmeta', {
        args: { sql: SQL_CREATE_MISSING_PROFILES },
        returns: 'json'
      });
      
      console.log('✅ Database fixes applied successfully');
    } catch (error) {
      console.error('❌ Error applying SQL fixes:', error.message);
      console.log('⚠️ Falling back to defensive code approach...');
      
      // If SQL execution fails, we can still try to create profiles directly using the Supabase API
      try {
        // Get all users without profiles
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, email, created_at')
          .limit(100);
        
        if (userError) {
          console.error('❌ Error fetching users:', userError.message);
          return;
        }
        
        // Get existing profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .limit(100);
        
        if (profileError) {
          console.error('❌ Error fetching profiles:', profileError.message);
          return;
        }
        
        // Find users without profiles
        const profileIds = new Set(profiles?.map(p => p.id) || []);
        const usersWithoutProfiles = users?.filter(u => !profileIds.has(u.id)) || [];
        
        if (usersWithoutProfiles.length > 0) {
          console.log(`⚙️ Creating ${usersWithoutProfiles.length} missing profiles...`);
          
          for (const user of usersWithoutProfiles) {
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                first_name: user.email?.split('@')[0] || 'User',
                email: user.email,
                created_at: user.created_at,
                updated_at: new Date().toISOString()
              });
          }
          
          console.log('✅ Created missing profiles');
        }
      } catch (profileError) {
        console.error('❌ Error creating profiles:', profileError.message);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error during database fix:', error.message);
  }
}

/**
 * Returns a helper function to safely get user/owner data
 * This function provides a defensive approach to accessing user data regardless of the field name
 */
export function getSafeUserGetter(supabase) {
  return async function getUserSafely(userId) {
    if (!userId) return null;
    
    try {
      // Try to get user from profiles table first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profile) {
        return {
          id: profile.id,
          first_name: profile.first_name || 'Unknown',
          last_name: profile.last_name || '',
          email: profile.email || 'unknown@example.com',
          avatar_url: profile.avatar_url || null
        };
      }
      
      // Fall back to auth.users if profile not found
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (user) {
        // Create a profile for this user for future use
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            first_name: user.email?.split('@')[0] || 'User',
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .single();
        
        return {
          id: user.id,
          first_name: user.email?.split('@')[0] || 'Unknown',
          email: user.email || 'unknown@example.com',
          last_name: '',
          avatar_url: null
        };
      }
      
      // If all else fails, return a placeholder user
      return {
        id: userId,
        first_name: 'Unknown',
        last_name: 'User',
        email: 'unknown@example.com',
        avatar_url: null
      };
    } catch (error) {
      console.error('Error getting user safely:', error.message);
      
      // Return a placeholder user
      return {
        id: userId,
        first_name: 'Unknown',
        last_name: 'User',
        email: 'unknown@example.com',
        avatar_url: null
      };
    }
  };
} 