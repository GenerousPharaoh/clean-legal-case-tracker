-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table for storing text chunks and embeddings
CREATE TABLE document_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL, -- Using OpenAI text-embedding-3-small dimensions
  metadata JSONB, -- Optional: page number, chunk sequence, etc.
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_chunks_file_id ON document_chunks(file_id);
CREATE INDEX idx_chunks_project_id ON document_chunks(project_id);

-- Create an HNSW index on the embedding column for faster similarity search
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can select chunks for projects they own
CREATE POLICY "Users can select chunks for their own projects" 
  ON document_chunks FOR SELECT 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Only project owners can insert chunks
CREATE POLICY "Only project owners can insert chunks" 
  ON document_chunks FOR INSERT 
  WITH CHECK (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Only project owners can delete chunks
CREATE POLICY "Only project owners can delete chunks" 
  ON document_chunks FOR DELETE 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Only project owners can update chunks
CREATE POLICY "Only project owners can update chunks" 
  ON document_chunks FOR UPDATE 
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND owner_id = auth.uid()
    )
  ); 