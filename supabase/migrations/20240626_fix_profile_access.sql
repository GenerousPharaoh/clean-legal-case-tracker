-- Fix profile issues: upsert the current user and ensure RLS allows proper access

-- 1. Insert or update the profile row for the current user
INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role)
VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', null, 'admin')
ON CONFLICT (id) DO UPDATE 
SET updated_at = now();

-- 2. Ensure RLS is enabled and proper policies exist
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;

-- Create the policy to allow users to read their own profile
CREATE POLICY "Users can read their profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 3. Additional policy to allow users to update their own profile (optional)
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;

CREATE POLICY "Users can update their profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id); 