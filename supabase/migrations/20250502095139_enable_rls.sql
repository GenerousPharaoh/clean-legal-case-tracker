-- Enable Row Level Security on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibit_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view files they own" 
    ON files FOR SELECT 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can view files in projects they collaborate on" 
    ON files FOR SELECT 
    USING (
        project_id IN (
            SELECT project_id FROM projects_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to their projects" 
    ON files FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own files" 
    ON files FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own files" 
    ON files FOR DELETE 
    USING (owner_id = auth.uid());

-- Projects policies
CREATE POLICY "Users can view their own projects" 
    ON projects FOR SELECT 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can view projects they collaborate on" 
    ON projects FOR SELECT 
    USING (
        id IN (
            SELECT project_id FROM projects_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects" 
    ON projects FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects" 
    ON projects FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projects" 
    ON projects FOR DELETE 
    USING (owner_id = auth.uid());

-- Projects_users policies
CREATE POLICY "Users can view project collaborations they are part of" 
    ON projects_users FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage collaborators" 
    ON projects_users FOR ALL 
    USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
        )
    );

-- For storage buckets access, we need to create policies in the storage schema
-- These policies will complement the ones created in the previous migrations
