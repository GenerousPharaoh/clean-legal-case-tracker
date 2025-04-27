-- Update the embedding vector dimensions for Google's textembedding-004 model (768 dimensions)
ALTER TABLE IF EXISTS document_chunks ALTER COLUMN embedding SET DATA TYPE vector(768);
ALTER TABLE IF EXISTS embeddings ALTER COLUMN embedding SET DATA TYPE vector(768); 