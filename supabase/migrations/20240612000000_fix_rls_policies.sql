-- Enable Row Level Security (RLS) on tables missing it
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exhibit_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evidence_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY IF NOT EXISTS "Users can read their own user data" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own user data" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create RLS policies for categories table
CREATE POLICY IF NOT EXISTS "Project owners can read categories" 
  ON categories 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu 
      WHERE pu.project_id = categories.project_id 
      AND pu.user_id = auth.uid() 
      AND pu.role IN ('OWNER', 'VIEWER', 'CLIENT_UPLOADER')
    )
  );

CREATE POLICY IF NOT EXISTS "Project owners can manage categories" 
  ON categories 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu 
      WHERE pu.project_id = categories.project_id 
      AND pu.user_id = auth.uid() 
      AND pu.role = 'OWNER'
    )
  );

-- Create RLS policies for tags table
CREATE POLICY IF NOT EXISTS "Project users can read tags" 
  ON tags 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu 
      WHERE pu.project_id = tags.project_id 
      AND pu.user_id = auth.uid() 
      AND pu.role IN ('OWNER', 'VIEWER', 'CLIENT_UPLOADER')
    )
  );

CREATE POLICY IF NOT EXISTS "Project owners can manage tags" 
  ON tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu 
      WHERE pu.project_id = tags.project_id 
      AND pu.user_id = auth.uid() 
      AND pu.role = 'OWNER'
    )
  );

-- Create RLS policies for exhibit_tags table
CREATE POLICY IF NOT EXISTS "Project users can read exhibit_tags" 
  ON exhibit_tags 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM exhibits e
      JOIN projects_users pu ON e.project_id = pu.project_id
      WHERE e.id = exhibit_tags.exhibit_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('OWNER', 'VIEWER', 'CLIENT_UPLOADER')
    )
  );

CREATE POLICY IF NOT EXISTS "Project owners can manage exhibit_tags" 
  ON exhibit_tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM exhibits e
      JOIN projects_users pu ON e.project_id = pu.project_id
      WHERE e.id = exhibit_tags.exhibit_id
      AND pu.user_id = auth.uid()
      AND pu.role = 'OWNER'
    )
  );

-- Create RLS policies for evidence_item_tags table
CREATE POLICY IF NOT EXISTS "Project users can read evidence_item_tags" 
  ON evidence_item_tags 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM evidence_items ei
      JOIN exhibits e ON ei.exhibit_id = e.id
      JOIN projects_users pu ON e.project_id = pu.project_id
      WHERE ei.id = evidence_item_tags.evidence_item_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('OWNER', 'VIEWER', 'CLIENT_UPLOADER')
    )
  );

CREATE POLICY IF NOT EXISTS "Project owners can manage evidence_item_tags" 
  ON evidence_item_tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM evidence_items ei
      JOIN exhibits e ON ei.exhibit_id = e.id
      JOIN projects_users pu ON e.project_id = pu.project_id
      WHERE ei.id = evidence_item_tags.evidence_item_id
      AND pu.user_id = auth.uid()
      AND pu.role = 'OWNER'
    )
  );

-- Create RLS policies for embeddings table
CREATE POLICY IF NOT EXISTS "Project users can read embeddings" 
  ON embeddings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = embeddings.project_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('OWNER', 'VIEWER', 'CLIENT_UPLOADER')
    )
  );

CREATE POLICY IF NOT EXISTS "Project owners can manage embeddings" 
  ON embeddings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = embeddings.project_id
      AND pu.user_id = auth.uid()
      AND pu.role = 'OWNER'
    )
  );

-- Create RLS policies for ai_analysis_jobs table
CREATE POLICY IF NOT EXISTS "Project users can read ai_analysis_jobs" 
  ON ai_analysis_jobs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = ai_analysis_jobs.project_id
      AND pu.user_id = auth.uid()
      AND pu.role IN ('OWNER', 'VIEWER', 'CLIENT_UPLOADER')
    )
  );

CREATE POLICY IF NOT EXISTS "Project owners can manage ai_analysis_jobs" 
  ON ai_analysis_jobs 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM projects_users pu
      WHERE pu.project_id = ai_analysis_jobs.project_id
      AND pu.user_id = auth.uid()
      AND pu.role = 'OWNER'
    )
  );

-- Add service role bypass policies for all tables to allow edge functions to work properly
CREATE POLICY IF NOT EXISTS "Service role can access users" 
  ON users 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can access categories" 
  ON categories 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can access tags" 
  ON tags 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can access exhibit_tags" 
  ON exhibit_tags 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can access evidence_item_tags" 
  ON evidence_item_tags 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can access embeddings" 
  ON embeddings 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can access ai_analysis_jobs" 
  ON ai_analysis_jobs 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role'); 