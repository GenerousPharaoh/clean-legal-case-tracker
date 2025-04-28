-- Create profiles table if it doesn't exist
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

-- Insert the admin user profile
INSERT INTO public.profiles (id, first_name, last_name, role, updated_at)
VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin', NOW())
ON CONFLICT (id) DO UPDATE 
SET first_name = 'Kareem',
    last_name = 'Hassanein',
    role = 'admin',
    updated_at = NOW(); 