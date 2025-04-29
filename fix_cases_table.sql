-- Fix "Could not find the 'is_archived' column of 'cases' in the schema cache" error

-- Check if cases table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cases') THEN
    RAISE NOTICE 'Cases table already exists';
    
    -- Check if is_archived column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cases' 
      AND column_name = 'is_archived'
    ) THEN
      -- Add the missing is_archived column
      ALTER TABLE public.cases ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
      RAISE NOTICE 'Added missing is_archived column to cases table';
    ELSE
      RAISE NOTICE 'is_archived column already exists in cases table';
    END IF;
  ELSE
    -- Create the cases table from scratch
    CREATE TABLE public.cases (
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
    CREATE INDEX cases_project_id_idx ON public.cases (project_id);
    CREATE INDEX cases_created_by_idx ON public.cases (created_by);
    CREATE INDEX cases_is_archived_idx ON public.cases (is_archived);
    
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
    
    RAISE NOTICE 'Created cases table with all required columns and policies';
  END IF;
END $$;

-- Verify the table structure
SELECT 
  table_name,
  column_name,
  data_type
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'cases'
ORDER BY 
  ordinal_position; 