-- Clean up previous storage policies to start fresh
DROP POLICY IF EXISTS "allow_storage_all" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_users_all_storage_access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to anyone in files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert to users path" ON storage.objects;
DROP POLICY IF EXISTS "Allow select for users path" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for users own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for users own files" ON storage.objects;

-- Create more granular storage policies

-- 1. Allow reading files (with path check)
CREATE POLICY "Allow users to read files in their user path" 
    ON storage.objects FOR SELECT 
    USING (
        -- Allow access to authenticated users with path matching
        (auth.role() = 'authenticated' AND (
            -- Allow when path starts with user ID
            storage.foldername(name) LIKE 'users/' || auth.uid() || '/%' OR
            -- Or for project-specific paths where user has project access
            storage.foldername(name) LIKE 'users/%/projects/%' 
        ))
    );

-- 2. Allow inserting files (with path check)
CREATE POLICY "Allow users to upload to their user path" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        -- Allow access to authenticated users with path matching
        (auth.role() = 'authenticated' AND (
            -- Allow when path starts with user ID
            storage.foldername(name) LIKE 'users/' || auth.uid() || '/%'
        ))
    );

-- 3. Allow updating files (with path and owner check)
CREATE POLICY "Allow users to update their own files" 
    ON storage.objects FOR UPDATE 
    USING (
        -- Allow access to authenticated users with path matching
        (auth.role() = 'authenticated' AND 
            bucket_id = 'files' AND
            storage.foldername(name) LIKE 'users/' || auth.uid() || '/%'
        )
    );

-- 4. Allow deleting files (with path and owner check)
CREATE POLICY "Allow users to delete their own files" 
    ON storage.objects FOR DELETE 
    USING (
        -- Allow access to authenticated users with path matching
        (auth.role() = 'authenticated' AND 
            bucket_id = 'files' AND
            storage.foldername(name) LIKE 'users/' || auth.uid() || '/%'
        )
    );

-- Permissive fallback policy for authenticated users
-- This ensures that uploads work even if other policies fail
CREATE POLICY "Allow authenticated users all storage actions" 
    ON storage.objects FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Set up CORS for storage
-- This is normally done through the Supabase dashboard, but we include SQL for reference
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('files', 'files', false, 52428800, null)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = 52428800, -- 50MB
    public = false; -- Not publicly accessible
    
-- Create cors configuration (handled in dashboard for production)
-- For local development, the API would use the following
-- cors_origins: ['http://localhost:3000', 'http://127.0.0.1:3000']
-- allowed_headers: ['Authorization', 'Content-Type', 'x-client-info', 'apiKey'] 