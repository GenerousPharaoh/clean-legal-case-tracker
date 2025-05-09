-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('files', 'File Storage', false, false, 52428800, '{application/pdf,image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,video/mp4,video/webm,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown}'),
  ('thumbnails', 'File Thumbnails', false, false, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage buckets
-- Files bucket policies
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Thumbnails bucket policies
CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own thumbnails"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'thumbnails' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Collaborator policies for viewing shared files
CREATE POLICY "Collaborators can view project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('files', 'thumbnails') AND
    (SELECT COUNT(*) FROM project_collaborators pc
     JOIN projects p ON pc.project_id = p.id
     WHERE pc.user_id = auth.uid()
     AND pc.status = 'active'
     AND p.owner_id::text = (storage.foldername(name))[1]
     AND (storage.foldername(name))[3] = pc.project_id::text) > 0
  ); 