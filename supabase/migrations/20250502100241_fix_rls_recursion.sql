-- Drop policies causing circular dependencies
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON projects_users;
DROP POLICY IF EXISTS "Users can view project collaborations they are part of" ON projects_users;

-- Re-create projects_users policies without circular references
CREATE POLICY "Users can view their own collaborations" 
    ON projects_users FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view collaborations for projects they own" 
    ON projects_users FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = projects_users.project_id 
        AND projects.owner_id = auth.uid()
    ));

CREATE POLICY "Users can manage collaborations for projects they own" 
    ON projects_users FOR ALL
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = projects_users.project_id 
        AND projects.owner_id = auth.uid()
    ));

-- Re-create the project policy without circular references
CREATE POLICY "Users can view projects they collaborate on" 
    ON projects FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects_users 
        WHERE projects_users.project_id = projects.id 
        AND projects_users.user_id = auth.uid()
    ));

-- Fix any missing policies for other tables
-- Apply RLS in a more direct way without circular dependencies
CREATE POLICY "Users can view files in shared projects" 
    ON files FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects_users 
        WHERE projects_users.project_id = files.project_id 
        AND projects_users.user_id = auth.uid()
    ));
