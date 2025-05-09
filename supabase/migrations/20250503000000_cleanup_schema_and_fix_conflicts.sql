-- Cleanup schema conflicts and fix any remaining issues
-- This migration addresses potential conflicts from legacy versions and ensures proper routing

-- 1. Ensure all necessary columns exist on the notes table with correct references
DO $$
BEGIN
    -- Check if user_id column exists on notes table, add if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if project_id column exists and has proper constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notes' AND column_name = 'project_id'
    ) THEN
        -- Try to drop and recreate the constraint to ensure it's correct
        ALTER TABLE notes 
        DROP CONSTRAINT IF EXISTS notes_project_id_fkey,
        ADD CONSTRAINT notes_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Ensure all necessary columns exist on the files table 
DO $$
BEGIN
    -- Check if uploaded_by_user_id exists and has proper constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'files' AND column_name = 'uploaded_by_user_id'
    ) THEN
        -- Try to drop and recreate the constraint to ensure it's correct
        ALTER TABLE files 
        DROP CONSTRAINT IF EXISTS files_uploaded_by_user_id_fkey,
        ADD CONSTRAINT files_uploaded_by_user_id_fkey
            FOREIGN KEY (uploaded_by_user_id)
            REFERENCES auth.users(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Remove duplicate indexes (if any exist)
DO $$
BEGIN
    -- Drop potentially duplicate indexes on files table
    DROP INDEX IF EXISTS idx_files_project_id_duplicate;
    DROP INDEX IF EXISTS idx_files_owner_id_duplicate;
    DROP INDEX IF EXISTS idx_files_uploaded_by_user_id_duplicate;
    
    -- Create or recreate indexes we know we need
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_files_uploaded_by_user_id'
    ) THEN
        CREATE INDEX idx_files_uploaded_by_user_id ON files(uploaded_by_user_id);
    END IF;
END $$;

-- 4. Ensure storage bucket permissions are properly set up
DROP POLICY IF EXISTS "allow_storage_all" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_users_all_storage_access" ON storage.objects;

-- Create a unified permissive policy for authenticated users (better than multiple conflicting policies)
CREATE POLICY "allow_authenticated_users_all_storage_access" 
    ON storage.objects FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);
    
-- 5. Fix RLS policies to avoid circular dependencies in checks
-- First, drop potentially problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view files in their projects" ON files;
DROP POLICY IF EXISTS "Users can view files in projects they collaborate on" ON files;

-- Create simplified policies that don't rely on recursive checks
CREATE POLICY "Users can view their own files" 
    ON files FOR SELECT 
    USING (owner_id = auth.uid() OR uploaded_by_user_id = auth.uid());
    
CREATE POLICY "Users can insert files" 
    ON files FOR INSERT 
    WITH CHECK (true);

-- 6. Fix notes policies to match actual table schema
DROP POLICY IF EXISTS "Users can view notes in their projects" ON notes;
DROP POLICY IF EXISTS "allow_all_notes" ON notes;

-- Create simplified policy for notes
CREATE POLICY "Notes access for users" 
    ON notes FOR ALL 
    USING (user_id = auth.uid() OR owner_id = auth.uid());

-- 7. Ensure we have all necessary configuration for TinyMCE
-- No database changes needed for this, but added here for documentation 

-- 8. Ensure unique constraint for notes on project_id and user_id
ALTER TABLE notes
ADD CONSTRAINT notes_project_user_unique UNIQUE (project_id, user_id);

-- End of migration file 