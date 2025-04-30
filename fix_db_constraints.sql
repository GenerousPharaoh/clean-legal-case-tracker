-- Comprehensive fix for the cases table foreign key constraints
-- This script fixes the "cases_owner_id_fkey" constraint issue

-- First, let's check the structure of the cases table
DO $$
DECLARE
  owner_id_exists BOOLEAN;
  created_by_exists BOOLEAN;
BEGIN
  -- Check if owner_id column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'owner_id'
  ) INTO owner_id_exists;
  
  -- Check if created_by column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'created_by'
  ) INTO created_by_exists;
  
  -- Log the current state
  RAISE NOTICE 'Current cases table state: owner_id exists: %, created_by exists: %', 
    owner_id_exists, created_by_exists;
  
  -- If both columns exist, we need to consolidate
  IF owner_id_exists AND created_by_exists THEN
    -- Drop the owner_id constraint if it exists
    BEGIN
      RAISE NOTICE 'Dropping cases_owner_id_fkey constraint';
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
      RAISE NOTICE 'Adding foreign key constraint to created_by';
      ALTER TABLE public.cases 
        DROP CONSTRAINT IF EXISTS cases_created_by_fkey;
      
      ALTER TABLE public.cases 
        ADD CONSTRAINT cases_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error adding created_by constraint: %', SQLERRM;
    END;
    
    -- Can drop owner_id if desired, or keep it but without constraint
    -- Uncomment this to drop owner_id:
    -- ALTER TABLE public.cases DROP COLUMN owner_id;
  
  -- If only owner_id exists, rename it to created_by
  ELSIF owner_id_exists AND NOT created_by_exists THEN
    RAISE NOTICE 'Renaming owner_id to created_by';
    
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
    
    -- Can drop owner_id if desired
    -- ALTER TABLE public.cases DROP COLUMN owner_id;
    
  -- If only created_by exists, make sure it has the right constraint
  ELSIF NOT owner_id_exists AND created_by_exists THEN
    RAISE NOTICE 'Ensuring created_by has proper constraint';
    
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
    RAISE NOTICE 'Adding created_by column';
    
    -- Add created_by column with constraint
    ALTER TABLE public.cases ADD COLUMN created_by UUID;
    ALTER TABLE public.cases 
      ADD CONSTRAINT cases_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END
$$;

-- Now let's make sure profiles exist for all users
-- (This ensures the foreign key relationship will work)
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

-- Add database trigger for new user registration
-- This ensures profiles are automatically created for new users
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