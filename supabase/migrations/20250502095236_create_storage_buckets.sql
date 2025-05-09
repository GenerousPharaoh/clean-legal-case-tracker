-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('files', 'File Storage', false, false, 52428800, '{application/pdf,image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,video/mp4,video/webm,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown}'),
  ('thumbnails', 'File Thumbnails', false, false, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Delete any existing policies for the buckets
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can view project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can access project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view thumbnails for their projects" ON storage.objects;

-- Create new policies with clearer permissions
-- Policy for uploading files
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'files'
  );

-- Policy for viewing files
CREATE POLICY "Allow users to view their own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'files' AND
    (
      -- User is the owner (first path segment matches user ID)
      auth.uid()::text = COALESCE((storage.foldername(name))[1], '')
      OR 
      -- User is a collaborator on the project
      (
        (storage.foldername(name))[2] = 'projects' AND
        EXISTS (
          SELECT 1 FROM projects_users pu
          JOIN projects p ON pu.project_id = p.id
          WHERE pu.user_id = auth.uid()
          AND p.id::text = COALESCE((storage.foldername(name))[3], '')
        )
      )
    )
  );

-- Policy for updating files
CREATE POLICY "Allow users to update their own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'files' AND
    auth.uid()::text = COALESCE((storage.foldername(name))[1], '')
  );

-- Policy for deleting files
CREATE POLICY "Allow users to delete their own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'files' AND
    auth.uid()::text = COALESCE((storage.foldername(name))[1], '')
  );

-- Thumbnail policies (same structure as files)
CREATE POLICY "Allow authenticated users to upload thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails'
  );

CREATE POLICY "Allow users to view thumbnails"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (
      -- User is the owner
      auth.uid()::text = COALESCE((storage.foldername(name))[1], '')
      OR 
      -- User is a collaborator on the project
      (
        (storage.foldername(name))[2] = 'projects' AND
        EXISTS (
          SELECT 1 FROM projects_users pu
          JOIN projects p ON pu.project_id = p.id
          WHERE pu.user_id = auth.uid()
          AND p.id::text = COALESCE((storage.foldername(name))[3], '')
        )
      )
    )
  );

CREATE POLICY "Allow users to update their own thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = COALESCE((storage.foldername(name))[1], '')
  );

CREATE POLICY "Allow users to delete their own thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = COALESCE((storage.foldername(name))[1], '')
  );
