-- Fix potential conflicts between different auth providers using the same email

-- Check if a user with this email already exists when creating a new profile
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  email_exists boolean;
  existing_user_id uuid;
BEGIN
  -- Check if a user with the same email address already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = NEW.email AND id != NEW.id
  ) INTO email_exists;

  -- If this is a duplicate email, log it for debugging
  IF email_exists THEN
    -- Find the existing user id for merging
    SELECT id INTO existing_user_id FROM auth.users 
    WHERE email = NEW.email AND id != NEW.id
    LIMIT 1;
    
    -- For now, just log this. In a future version, we could implement 
    -- account merging or linking if needed
    RAISE LOG 'User with duplicate email detected. New: %, Existing: %', NEW.id, existing_user_id;
  END IF;

  -- Create a profile for the new user, regardless
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

-- Ensure all existing users have profiles
INSERT INTO public.profiles (id, first_name, email, created_at, updated_at)
SELECT 
  id, 
  split_part(email, '@', 1) as first_name, 
  email,
  created_at,
  updated_at 
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Add email column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    
    -- Populate email field for existing profiles
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id AND p.email IS NULL;
  END IF;
END $$; 