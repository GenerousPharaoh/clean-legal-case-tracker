-- Fix storage bucket policies to ensure proper access control

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Collaborators can view project files" ON storage.objects;

-- Create more permissive policies for file viewing
CREATE POLICY "Users can view files in their projects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'files' AND (
      -- User owns the file (via path structure)
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- User is a collaborator on the project
      (SELECT COUNT(*) FROM project_collaborators pc
       WHERE pc.user_id = auth.uid()
       AND pc.status = 'active'
       AND pc.project_id::text = (storage.foldername(name))[3]) > 0
    )
  );

-- Improve the path structure check for project files
CREATE POLICY "Users can access project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'files' AND 
    (storage.foldername(name))[2] = 'projects' AND
    (
      -- Project owner can access
      (SELECT owner_id FROM projects 
       WHERE id::text = (storage.foldername(name))[3]) = auth.uid()
      OR
      -- Project collaborator can access
      (SELECT COUNT(*) FROM project_collaborators 
       WHERE user_id = auth.uid() 
       AND status = 'active'
       AND project_id::text = (storage.foldername(name))[3]) > 0
    )
  );

-- Same for thumbnails
CREATE POLICY "Users can view thumbnails for their projects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'thumbnails' AND (
      -- User owns the thumbnail
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- User is a collaborator on the project
      (SELECT COUNT(*) FROM project_collaborators pc
       WHERE pc.user_id = auth.uid()
       AND pc.status = 'active'
       AND pc.project_id::text = (storage.foldername(name))[3]) > 0
    )
  ); 