-- Create project_collaborators table
CREATE TABLE project_collaborators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- Store email for pending invites where user doesn't exist yet
  role TEXT NOT NULL DEFAULT 'client_uploader',
  invited_by uuid REFERENCES auth.users(id),
  invite_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMPTZ,
  UNIQUE (project_id, user_id), -- Prevent duplicate invites/roles per project-user
  CONSTRAINT check_email_or_userid CHECK (user_id IS NOT NULL OR email IS NOT NULL) -- Either email or user_id must be provided
);

-- Add indexes
CREATE INDEX idx_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX idx_collaborators_email ON project_collaborators(email);
CREATE INDEX idx_collaborators_token ON project_collaborators(invite_token);

-- Add uploaded_by column to files table
ALTER TABLE files ADD COLUMN uploaded_by uuid REFERENCES auth.users(id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- Update RLS policies for projects table
DROP POLICY IF EXISTS "Projects are viewable by owner" ON projects;
CREATE POLICY "Projects are viewable by owner or collaborator" 
  ON projects FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_id = id AND user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Update RLS policies for files table
DROP POLICY IF EXISTS "Files are viewable by project owner" ON files;
CREATE POLICY "Files are viewable by project owner or collaborator" 
  ON files FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_id = files.project_id AND user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Files can be inserted by project owner" ON files;
CREATE POLICY "Files can be inserted by project owner or client uploader" 
  ON files FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_id = files.project_id 
        AND user_id = auth.uid() 
        AND status = 'accepted' 
        AND role = 'client_uploader'
    )
  );

-- Ensure client uploaders CANNOT modify files
DROP POLICY IF EXISTS "Files can be updated by project owner" ON files;
CREATE POLICY "Files can be updated by project owner only" 
  ON files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Files can be deleted by project owner" ON files;
CREATE POLICY "Files can be deleted by project owner only" 
  ON files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Ensure notes are accessible only to project owners (not client uploaders)
DROP POLICY IF EXISTS "Notes are viewable by project owner" ON notes;
CREATE POLICY "Notes are viewable by project owner only" 
  ON notes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Ensure links are accessible only to project owners (not client uploaders)
DROP POLICY IF EXISTS "Links are viewable by project owner" ON links;
CREATE POLICY "Links are viewable by project owner only" 
  ON links FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- RLS for project_collaborators table
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Project owners can see all collaborators for their projects
CREATE POLICY "Project owners can manage collaborators" 
  ON project_collaborators
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Users can see their own collaborator invites across projects
CREATE POLICY "Users can see their own collaborations" 
  ON project_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Add policy for storage to allow uploads by collaborators 