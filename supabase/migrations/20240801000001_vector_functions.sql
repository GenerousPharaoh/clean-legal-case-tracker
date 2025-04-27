-- Create function to perform similarity search on document chunks
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  query_project_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  file_id uuid,
  file_name text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.chunk_text,
    dc.file_id,
    f.name as file_name,
    1 - (dc.embedding <=> query_embedding) AS similarity -- Cosine similarity (1 is most similar)
  FROM
    document_chunks dc
  JOIN
    files f ON dc.file_id = f.id
  WHERE
    dc.project_id = query_project_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding -- Order by increasing cosine distance (most similar first)
  LIMIT
    match_count;
END;
$$;

-- Create a function to create the above function (for use in the Edge Function)
CREATE OR REPLACE FUNCTION create_match_document_chunks_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE '
  CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    query_project_id uuid,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
  )
  RETURNS TABLE (
    id uuid,
    chunk_text text,
    file_id uuid,
    file_name text,
    similarity float
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    RETURN QUERY
    SELECT
      dc.id,
      dc.chunk_text,
      dc.file_id,
      f.name as file_name,
      1 - (dc.embedding <=> query_embedding) AS similarity
    FROM
      document_chunks dc
    JOIN
      files f ON dc.file_id = f.id
    WHERE
      dc.project_id = query_project_id
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY
      dc.embedding <=> query_embedding
    LIMIT
      match_count;
  END;
  $func$;
  ';
END;
$$; 