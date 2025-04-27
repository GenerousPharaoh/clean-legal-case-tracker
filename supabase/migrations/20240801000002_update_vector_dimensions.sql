-- Update the document_chunks table to use the Google embedding model dimensions
-- Note: This migration will fail if there are existing rows in the document_chunks table
-- You should truncate the table before running this migration or export/reimport data

-- Drop the existing HNSW index first
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- Alter the table to change the embedding vector dimension from 1536 (OpenAI) to 768 (Google)
ALTER TABLE document_chunks 
  ALTER COLUMN embedding TYPE vector(768);

-- Add a comment to indicate the change
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding using Google textembedding-gecko-multilingual model (768 dimensions)';

-- Recreate the HNSW index for the new vector dimension
CREATE INDEX document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Add a comment to the table indicating that all document chunks need to be re-embedded
COMMENT ON TABLE document_chunks IS 'Document chunks with embeddings. All existing documents should be re-processed with the Google embedding model.'; 