-- Add indexes to improve query performance on the files table

-- Index for searching by project_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);

-- Index for file type searches (used in filtering)
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);

-- Composite index for project and time-based queries
CREATE INDEX IF NOT EXISTS idx_files_project_added_at ON files(project_id, added_at DESC);

-- Index for owner_id searches (common for permission checks)
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);

-- Index for exhibit_id lookups (used for citations)
CREATE INDEX IF NOT EXISTS idx_files_exhibit_id ON files(exhibit_id);

-- Index for document_chunks for faster vector searches
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_project_id ON document_chunks(project_id);

-- For vector similarity searches (if using frequently)
-- NOTE: This requires vector extension to be enabled
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100); 