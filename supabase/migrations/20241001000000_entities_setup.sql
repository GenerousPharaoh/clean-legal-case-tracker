-- Create entities table for storing extracted named entities
CREATE TABLE entities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_text TEXT NOT NULL, -- The extracted entity string (e.g., "John Smith", "Acme Corp")
  entity_type TEXT NOT NULL, -- e.g., 'PERSON', 'ORG', 'DATE', 'LOCATION', 'LEGAL_TERM'
  source_file_id uuid REFERENCES files(id) ON DELETE CASCADE, -- File where entity was found
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraint to store unique entities per file and type
  UNIQUE (project_id, source_file_id, lower(entity_text), entity_type)
);

-- Indexes for efficient querying
CREATE INDEX idx_entities_project_id ON entities(project_id);
CREATE INDEX idx_entities_source_file_id ON entities(source_file_id);
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_text ON entities(lower(entity_text)); -- For case-insensitive lookups

-- Enable Row Level Security
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can select entities for projects they own or collaborate on
CREATE POLICY "Users can select entities for their own projects" 
  ON entities FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_id = entities.project_id AND user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Only the Edge Functions (service role) or project owners can insert entities
CREATE POLICY "Only project owners can insert entities" 
  ON entities FOR INSERT 
  WITH CHECK (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Only project owners can delete entities
CREATE POLICY "Only project owners can delete entities" 
  ON entities FOR DELETE 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Only project owners can update entities
CREATE POLICY "Only project owners can update entities" 
  ON entities FOR UPDATE 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  ); 