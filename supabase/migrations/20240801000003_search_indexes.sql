-- Create additional indexes to optimize search and filtering operations

-- First check if tables exist
DO $$
BEGIN
    -- Ensure pg_trgm extension is available
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
    -- Files table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN
-- Add index on project_id and added_at for date range filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_project_date') THEN
            CREATE INDEX idx_files_project_date ON files(project_id, added_at);
        END IF;

        -- Add index on file_type for filtering by type
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_file_type') THEN
            CREATE INDEX idx_files_file_type ON files(file_type);
        END IF;

        -- Add trigram index on name for keyword search
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_name_trgm') THEN
            CREATE INDEX idx_files_name_trgm ON files USING gin (name gin_trgm_ops);
        END IF;

        -- Add jsonb index on metadata for tag filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_files_metadata') THEN
            CREATE INDEX idx_files_metadata ON files USING gin (metadata jsonb_path_ops);
        END IF;
    END IF;

    -- Entities table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entities') THEN
        -- Add index on project_id for filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_project_id') THEN
            CREATE INDEX idx_entities_project_id ON entities(project_id);
        END IF;

        -- Add index on source_file_id for filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_source_file_id') THEN
            CREATE INDEX idx_entities_source_file_id ON entities(source_file_id);
        END IF;

        -- Add index on entity_type for filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_entity_type') THEN
            CREATE INDEX idx_entities_entity_type ON entities(entity_type);
        END IF;

        -- Add index on entity_text for filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_entity_text') THEN
            CREATE INDEX idx_entities_entity_text ON entities(lower(entity_text) text_pattern_ops);
        END IF;

-- Add composite index on entities for faster entity filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entities_composite') THEN
            CREATE INDEX idx_entities_composite ON entities(project_id, entity_type, lower(entity_text));
        END IF;
    END IF;

    -- Document chunks table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks') THEN
        -- Add index on project_id for filtering
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_document_chunks_project_id') THEN
            CREATE INDEX idx_document_chunks_project_id ON document_chunks(project_id);
        END IF;
    END IF;
END $$; 