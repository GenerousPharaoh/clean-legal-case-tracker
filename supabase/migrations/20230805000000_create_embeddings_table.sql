-- Create vector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for storing embeddings

-- Create table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Set dimension to match Google's model
    metadata JSONB DEFAULT '{}'::JSONB,
    project_id UUID,
    doc_id TEXT,
    namespace TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS embeddings_project_id_idx ON public.embeddings USING btree (project_id);
CREATE INDEX IF NOT EXISTS embeddings_doc_id_idx ON public.embeddings USING btree (doc_id);
CREATE INDEX IF NOT EXISTS embeddings_namespace_idx ON public.embeddings USING btree (namespace);

-- Enable RLS
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Only create policies if the projects table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
-- Policy to allow users to view embeddings for projects they have access to
        DROP POLICY IF EXISTS "Users can view embeddings for their projects" ON public.embeddings;
CREATE POLICY "Users can view embeddings for their projects" 
    ON public.embeddings 
    FOR SELECT
    USING (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id 
            WHERE pm.user_id = auth.uid()
        )
    );
            
        -- Policy to allow users to insert embeddings for their projects
        DROP POLICY IF EXISTS "Users can insert embeddings for their projects" ON public.embeddings;
        CREATE POLICY "Users can insert embeddings for their projects"
            ON public.embeddings
            FOR INSERT
            WITH CHECK (
                project_id IN (
                    SELECT p.id
                    FROM projects p
                    JOIN project_members pm ON p.id = pm.project_id
                    WHERE pm.user_id = auth.uid()
                )
            );

        -- Policy to allow users to update embeddings for their projects
        DROP POLICY IF EXISTS "Users can update embeddings for their projects" ON public.embeddings;
        CREATE POLICY "Users can update embeddings for their projects"
            ON public.embeddings
            FOR UPDATE
            USING (
                project_id IN (
                    SELECT p.id
                    FROM projects p
                    JOIN project_members pm ON p.id = pm.project_id
                    WHERE pm.user_id = auth.uid()
                )
            );

        -- Policy to allow users to delete embeddings for their projects
        DROP POLICY IF EXISTS "Users can delete embeddings for their projects" ON public.embeddings;
        CREATE POLICY "Users can delete embeddings for their projects"
            ON public.embeddings
            FOR DELETE
            USING (
                project_id IN (
                    SELECT p.id
                    FROM projects p
                    JOIN project_members pm ON p.id = pm.project_id
                    WHERE pm.user_id = auth.uid()
                )
            );
    ELSE
        -- If projects table doesn't exist, create a simple policy
        DROP POLICY IF EXISTS "Temporary policy for embeddings" ON public.embeddings;
        CREATE POLICY "Temporary policy for embeddings"
            ON public.embeddings
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_project_id uuid,
    p_namespaces text[] DEFAULT '{default}'
) 
RETURNS TABLE(
    id uuid,
    doc_id text,
    content text,
    metadata jsonb,
    namespace text,
    similarity float
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.doc_id,
        e.content,
        e.metadata,
        e.namespace,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM
        embeddings e
    WHERE
        e.project_id = p_project_id
        AND e.namespace = ANY(p_namespaces)
        AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY
        e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 