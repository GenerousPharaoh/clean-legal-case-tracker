-- Insert or update admin profile
INSERT INTO public.profiles (id, first_name, last_name, role, updated_at)
VALUES ('1a0ca6f0-c571-4b1a-8476-01583a26900b', 'Kareem', 'Hassanein', 'admin', NOW())
ON CONFLICT (id) DO UPDATE 
SET first_name = 'Kareem',
    last_name = 'Hassanein',
    role = 'admin',
    updated_at = NOW();

-- Set all profiles to admin role
UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW();

-- Fix RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Create read policy for users
CREATE POLICY "Users can read their profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create update policy for users
CREATE POLICY "Users can update their profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a special public policy for authentication
CREATE POLICY "Anyone can get their own profile by email"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE profiles.id = auth.users.id 
    AND auth.users.email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

-- Grant public access to the profiles table (READ ONLY)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;

-- List all users and their roles (for verification)
SELECT 
  u.id,
  u.email,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.email; 