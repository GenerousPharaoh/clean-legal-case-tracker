-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active',
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cases_project_id_idx ON public.cases (project_id);
CREATE INDEX IF NOT EXISTS cases_created_by_idx ON public.cases (created_by);
CREATE INDEX IF NOT EXISTS cases_is_archived_idx ON public.cases (is_archived);

-- Enable Row Level Security
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policies for cases
-- 1. Project owners can do anything with cases
CREATE POLICY "Project owners can manage cases"
ON public.cases
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects_users pu
    WHERE pu.project_id = cases.project_id
    AND pu.user_id = auth.uid()
    AND pu.role = 'OWNER'
  )
);

-- 2. Project viewers can view cases
CREATE POLICY "Project viewers can view cases"
ON public.cases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects_users pu
    WHERE pu.project_id = cases.project_id
    AND pu.user_id = auth.uid()
    AND pu.role IN ('VIEWER', 'CLIENT_UPLOADER')
  )
);

-- 3. Service role can access all cases
CREATE POLICY "Service role can access all cases"
ON public.cases
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment explaining the purpose of this migration
COMMENT ON TABLE public.cases IS 'Stores legal case information within projects'; 