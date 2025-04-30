-- Fix the cases_owner_id_fkey constraint issue

-- First check if we need to create the profiles table
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

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Make sure appropriate policies exist
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

-- Find users who are missing profiles
SELECT 'Checking for users without profiles...';
SELECT 
  u.id, 
  u.email, 
  p.id AS profile_id
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL;

-- Create missing profiles for all users
INSERT INTO public.profiles (id, first_name, last_name, email, created_at, updated_at)
SELECT 
  u.id,
  SPLIT_PART(u.email, '@', 1),
  '',
  u.email,
  u.created_at,
  NOW()
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
WHERE 
  p.id IS NULL;

-- Verify results
SELECT 'Verification after fix:';
SELECT 
  u.id, 
  u.email, 
  p.id AS profile_id, 
  p.first_name
FROM 
  auth.users u
LEFT JOIN 
  public.profiles p ON u.id = p.id
ORDER BY 
  u.email;

-- Check cases table to see if owner_id matches a valid user
SELECT 'Checking for cases with invalid owner_id:';
SELECT 
  c.id, 
  c.name, 
  c.owner_id,
  u.email
FROM 
  public.cases c
LEFT JOIN 
  auth.users u ON c.owner_id = u.id
WHERE 
  u.id IS NULL; 