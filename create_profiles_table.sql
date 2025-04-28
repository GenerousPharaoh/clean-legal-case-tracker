
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
  