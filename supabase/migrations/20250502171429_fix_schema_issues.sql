-- Fix schema issues with tables
-- 1. Fix the notes table
-- First, let's check if the notes already has a user_id column and ADD it if missing
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column
        ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Apply RLS again (in case it was removed during other migrations)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 4. Fix the files table - make sure it has the uploaded_by_user_id column
-- First check if the column exists, if not, create it with the proper reference
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'uploaded_by_user_id'
    ) THEN
        -- Add the uploaded_by_user_id column
        ALTER TABLE files ADD COLUMN uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Create an index on the files table for the uploaded_by_user_id column to improve performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by_user_id ON files(uploaded_by_user_id);

-- 6. Create an open permission policy for file uploads
-- This ensures authenticated users can upload files without restrictions
DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON files;
CREATE POLICY "Allow authenticated users to insert files" 
    ON files FOR INSERT TO authenticated 
    WITH CHECK (true);

-- 7. Create permissive storage policies to ensure uploads work smoothly
DROP POLICY IF EXISTS "allow_storage_all" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_users_all_storage_access" ON storage.objects;
CREATE POLICY "allow_authenticated_users_all_storage_access" 
    ON storage.objects FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);
