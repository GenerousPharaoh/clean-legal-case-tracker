-- Notes Table
CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE, -- Enforce one note per project initially
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT, -- Store editor content (e.g., Markdown)
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Links Table
CREATE TABLE links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE, -- File the link points to
  source_details_json JSONB NOT NULL, -- Stores the LinkData object (page, timestamp, selection, etc.)
  target_context_json JSONB, -- Stores context about where link is placed (e.g., { noteId: '...' })
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for retrieving links related to a note or file
CREATE INDEX idx_links_project_id ON links(project_id);
CREATE INDEX idx_links_source_file_id ON links(source_file_id);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for links
CREATE POLICY "Users can view their own links"
  ON links FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own links"
  ON links FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own links"
  ON links FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own links"
  ON links FOR DELETE
  USING (owner_id = auth.uid());

-- Add is_ai_organized flag to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_ai_organized BOOLEAN DEFAULT FALSE; 