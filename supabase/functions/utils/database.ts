import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Database } from '../types/supabase.ts';

// Create a Supabase client with the service role key for Edge Functions
export const supabaseAdmin = createClient<Database>(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

/**
 * Get project details by ID
 * @param projectId The project ID to fetch
 * @returns Project details or null if not found
 */
export async function getProject(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return data;
}

/**
 * Get file details by ID
 * @param fileId The file ID to fetch
 * @returns File details or null if not found
 */
export async function getFile(fileId: string) {
  const { data, error } = await supabaseAdmin
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (error) {
    console.error('Error fetching file:', error);
    return null;
  }

  return data;
}

/**
 * Get all files for a project
 * @param projectId The project ID to fetch files for
 * @returns Array of files or empty array if none found
 */
export async function getProjectFiles(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching project files:', error);
    return [];
  }

  return data || [];
}

/**
 * Get document chunks for vector similarity search
 * @param projectId The project ID to fetch chunks for
 * @param queryEmbedding The embedding vector to compare against
 * @param limit The maximum number of results to return
 * @returns Array of matching document chunks with similarity scores
 */
export async function getMatchingDocumentChunks(projectId: string, queryEmbedding: number[], limit = 5) {
  const { data, error } = await supabaseAdmin.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: limit,
    p_project_id: projectId
  });

  if (error) {
    console.error('Error searching document chunks:', error);
    return [];
  }

  return data || [];
}

/**
 * Save document chunks with embeddings
 * @param chunks Array of document chunks to save
 * @returns Success status
 */
export async function saveDocumentChunks(chunks: Array<{
  file_id: string;
  project_id: string;
  owner_id: string;
  chunk_text: string;
  embedding: number[];
}>) {
  const { error } = await supabaseAdmin
    .from('document_chunks')
    .insert(chunks);

  if (error) {
    console.error('Error saving document chunks:', error);
    return false;
  }

  return true;
}

/**
 * Get the next available exhibit ID for a project
 * @param projectId The project ID to get next exhibit ID for
 * @returns Next available exhibit ID
 */
export async function getNextExhibitId(projectId: string): Promise<string> {
  // Get all existing exhibit IDs for the project
  const { data, error } = await supabaseAdmin
    .from('files')
    .select('exhibit_id')
    .eq('project_id', projectId)
    .not('exhibit_id', 'is', null);

  if (error) {
    console.error('Error fetching exhibit IDs:', error);
    return 'EXH-001';
  }

  if (!data || data.length === 0) {
    return 'EXH-001';
  }

  // Extract numeric parts and find the highest value
  const numericValues = data
    .map(file => {
      const match = file.exhibit_id.match(/EXH-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num));

  const highestNum = Math.max(...numericValues, 0);
  const nextNum = highestNum + 1;
  
  // Format with leading zeros
  return `EXH-${nextNum.toString().padStart(3, '0')}`;
} 