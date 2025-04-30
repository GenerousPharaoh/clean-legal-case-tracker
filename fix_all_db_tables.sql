-- Comprehensive fix for database issues

-- ==========================================
-- Fix the profiles table
-- ==========================================
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

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Setup appropriate RLS policies
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

-- Create missing profiles for existing users
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

-- ==========================================
-- Fix the cases table
-- ==========================================

-- Create cases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active',
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cases_project_id_idx ON public.cases (project_id);
CREATE INDEX IF NOT EXISTS cases_created_by_idx ON public.cases (created_by);
CREATE INDEX IF NOT EXISTS cases_is_archived_idx ON public.cases (is_archived);

-- Enable Row Level Security
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policies for cases
-- 1. Users can do anything with their own cases
CREATE POLICY IF NOT EXISTS "Users can manage their own cases"
ON public.cases
FOR ALL
USING (created_by = auth.uid());

-- 2. Service role can access all cases
CREATE POLICY IF NOT EXISTS "Service role can access all cases"
ON public.cases
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create the database trigger for auto-populating profiles
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, first_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1), -- Use part before @ as first name
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Skip if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to handle new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Verify if all users have profiles
SELECT 'Checking for users without profiles:';
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

-- Check cases table to see if owner_id matches a valid user
SELECT 'Checking for cases with invalid created_by references:';
SELECT 
  c.id, 
  c.name, 
  c.created_by,
  u.email
FROM 
  public.cases c
LEFT JOIN 
  auth.users u ON c.created_by = u.id
WHERE 
  u.id IS NULL; 