-- Add missing foreign key constraints

-- Add ON DELETE CASCADE constraints to document_chunks
ALTER TABLE document_chunks
DROP CONSTRAINT IF EXISTS document_chunks_project_id_fkey,
ADD CONSTRAINT document_chunks_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE;

-- Add constraint for links table to ensure source_file_id references a valid file
ALTER TABLE links
DROP CONSTRAINT IF EXISTS links_source_file_id_fkey,
ADD CONSTRAINT links_source_file_id_fkey
    FOREIGN KEY (source_file_id)
    REFERENCES files(id)
    ON DELETE CASCADE;

-- Add constraint for entities table
ALTER TABLE entities
DROP CONSTRAINT IF EXISTS entities_source_file_id_fkey,
ADD CONSTRAINT entities_source_file_id_fkey
    FOREIGN KEY (source_file_id)
    REFERENCES files(id)
    ON DELETE SET NULL; 