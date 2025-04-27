-- Update schema for Google text-embedding-004 model (768 dimensions)
-- This migration handles the transition from OpenAI embeddings to Google embeddings

-- Ensure vector extension is available
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Safely handle vector dimensions update
DO $$
DECLARE
    column_info RECORD;
    current_dimensions INT;
    target_dimensions INT := 768;
BEGIN
    -- Check if document_chunks table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'document_chunks'
    ) THEN
        -- Get current vector dimensions if table exists
        SELECT a.atttypmod - 4 INTO current_dimensions -- Subtract 4 bytes for internal storage
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        WHERE c.relname = 'document_chunks'
        AND a.attname = 'embedding';
        
        -- Only proceed if dimensions need changing or column doesn't exist
        IF current_dimensions IS NULL OR current_dimensions != target_dimensions THEN
            -- If table exists but has wrong dimensions, handle migration
            -- First, create a temporary table to store data
            CREATE TEMP TABLE IF NOT EXISTS tmp_document_chunks AS
            SELECT id, project_id, file_id, content, metadata, created_at, namespace
            FROM document_chunks;
            
            -- Drop indexes that might reference the column
            DROP INDEX IF EXISTS document_chunks_embedding_idx;
            DROP INDEX IF EXISTS idx_chunks_file_id;
            DROP INDEX IF EXISTS idx_chunks_project_id;
            
            -- Drop and recreate table with correct dimensions
            DROP TABLE document_chunks;
            
            CREATE TABLE document_chunks (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              project_id UUID NOT NULL,
              file_id UUID NOT NULL,
              content TEXT NOT NULL,
              embedding VECTOR(768) NOT NULL,
              metadata JSONB DEFAULT '{}'::JSONB,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              namespace TEXT DEFAULT 'default'
            );
            
            -- Restore data (without embeddings, which will need to be regenerated)
            INSERT INTO document_chunks(id, project_id, file_id, content, metadata, created_at, namespace)
            SELECT id, project_id, file_id, content, metadata, created_at, namespace
            FROM tmp_document_chunks;
            
            -- Drop temp table
            DROP TABLE tmp_document_chunks;
            
            -- Log that embeddings need regeneration
            RAISE NOTICE 'Embeddings need to be regenerated for document_chunks table';
        ELSE
            RAISE NOTICE 'Document_chunks table already has correct dimensions: %', current_dimensions;
        END IF;
        
        -- Recreate indexes regardless
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'document_chunks_embedding_idx') THEN
            CREATE INDEX document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chunks_file_id') THEN
            CREATE INDEX idx_chunks_file_id ON document_chunks(file_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chunks_project_id') THEN
            CREATE INDEX idx_chunks_project_id ON document_chunks(project_id);
        END IF;
    ELSE
        -- Create document_chunks table if it doesn't exist
        CREATE TABLE document_chunks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL,
          file_id UUID NOT NULL,
          content TEXT NOT NULL,
          embedding VECTOR(768) NOT NULL,
          metadata JSONB DEFAULT '{}'::JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          namespace TEXT DEFAULT 'default'
        );
        
        -- Create indexes for the new table
        CREATE INDEX document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        
        CREATE INDEX idx_chunks_file_id ON document_chunks(file_id);
        CREATE INDEX idx_chunks_project_id ON document_chunks(project_id);
    END IF;
    
    -- Add indexes for files table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_project_id') THEN
            CREATE INDEX idx_files_project_id ON files(project_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_added_at') THEN
            CREATE INDEX idx_files_added_at ON files(added_at);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_file_type') THEN
            CREATE INDEX idx_files_file_type ON files(file_type);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_name_trigram') THEN
            CREATE INDEX idx_files_name_trigram ON files USING gin (name gin_trgm_ops);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_metadata') THEN
            CREATE INDEX idx_files_metadata ON files USING gin (metadata jsonb_path_ops);
        END IF;
    END IF;
    
    -- Add indexes for entities table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entities') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_project_id') THEN
            CREATE INDEX idx_entities_project_id ON entities(project_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_source_file_id') THEN
            CREATE INDEX idx_entities_source_file_id ON entities(source_file_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_entity_type') THEN
            CREATE INDEX idx_entities_entity_type ON entities(entity_type);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_entity_text_pattern') THEN
            CREATE INDEX idx_entities_entity_text_pattern ON entities(lower(entity_text) text_pattern_ops);
        END IF;
    END IF;
END $$;

-- Update or ensure match_chunks function for the Google embedding model (768 dimensions)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  p_project_id UUID,
  p_namespaces TEXT[] DEFAULT ARRAY['default']
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  file_id UUID,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.file_id,
    dc.metadata
  FROM
    document_chunks dc
  WHERE
    dc.project_id = p_project_id
    AND
    (p_namespaces IS NULL OR dc.namespace = ANY(p_namespaces))
    AND
    1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 