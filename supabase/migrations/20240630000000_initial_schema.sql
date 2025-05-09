-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_ai_organized BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exhibit_id TEXT,
    storage_path TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(project_id, exhibit_id)
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    source_details_json JSONB DEFAULT '{}'::jsonb,
    target_context_json JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_text TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    source_file_id UUID REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(768)
);

CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Setup Row Level Security Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY "Users can view their own projects" 
    ON projects FOR SELECT 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create projects" 
    ON projects FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects" 
    ON projects FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projects" 
    ON projects FOR DELETE 
    USING (owner_id = auth.uid());

-- File policies
CREATE POLICY "Users can view files in their projects" 
    ON files FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can insert files to their projects" 
    ON files FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update files in their projects" 
    ON files FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete files in their projects" 
    ON files FOR DELETE 
    USING (owner_id = auth.uid());

-- Similar policies for notes, links, entities, document_chunks, project_collaborators
-- Notes policies
CREATE POLICY "Users can view notes in their projects" 
    ON notes FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can insert notes to their projects" 
    ON notes FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update notes in their projects" 
    ON notes FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete notes in their projects" 
    ON notes FOR DELETE 
    USING (owner_id = auth.uid());

-- Links policies
CREATE POLICY "Users can view links in their projects" 
    ON links FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can insert links to their projects" 
    ON links FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update links in their projects" 
    ON links FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete links in their projects" 
    ON links FOR DELETE 
    USING (owner_id = auth.uid());

-- Entities policies
CREATE POLICY "Users can view entities in their projects" 
    ON entities FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can insert entities to their projects" 
    ON entities FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update entities in their projects" 
    ON entities FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete entities in their projects" 
    ON entities FOR DELETE 
    USING (owner_id = auth.uid());

-- Document chunks policies
CREATE POLICY "Users can view document chunks in their projects" 
    ON document_chunks FOR SELECT 
    USING (owner_id = auth.uid() OR 
          project_id IN (
              SELECT project_id FROM project_collaborators 
              WHERE user_id = auth.uid() AND status = 'active'
          ));

CREATE POLICY "Users can insert document chunks to their projects" 
    ON document_chunks FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update document chunks in their projects" 
    ON document_chunks FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete document chunks in their projects" 
    ON document_chunks FOR DELETE 
    USING (owner_id = auth.uid());

-- Project collaborators policies
CREATE POLICY "Users can view collaborators for their projects" 
    ON project_collaborators FOR SELECT 
    USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ) OR user_id = auth.uid());

CREATE POLICY "Project owners can add collaborators" 
    ON project_collaborators FOR INSERT 
    WITH CHECK (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Project owners can update collaborators" 
    ON project_collaborators FOR UPDATE 
    USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Project owners can delete collaborators" 
    ON project_collaborators FOR DELETE 
    USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    )); 