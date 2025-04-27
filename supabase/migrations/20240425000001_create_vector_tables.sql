-- Create pgvector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- IMPORTANT: These tables are configured for Google's text-embedding-004 model
-- which produces 768-dimensional vectors. This is a critical configuration detail
-- as different embedding models produce vectors of different dimensions.
-- Any change to the embedding model must ensure compatibility with this dimension.

-- Create document_chunks table for vector search
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  file_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  namespace TEXT DEFAULT 'default'
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create embeddings table (for general embeddings storage)
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id TEXT NOT NULL,
  project_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  namespace TEXT DEFAULT 'default'
);

-- Create index for embeddings similarity search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create stored procedure for vector similarity search on document_chunks
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
    dc.namespace = ANY(p_namespaces)
    AND
    1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create stored procedure for vector similarity search on embeddings
CREATE OR REPLACE FUNCTION match_embeddings(
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
  doc_id TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.doc_id,
    e.metadata
  FROM
    embeddings e
  WHERE
    e.project_id = p_project_id
    AND
    e.namespace = ANY(p_namespaces)
    AND
    1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY
    e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 