import { supabase } from '../supabaseClient';

/**
 * Generate embeddings for a file and store them in the document_chunks table
 * @param fileId The ID of the file to generate embeddings for
 * @param projectId The ID of the project the file belongs to
 * @returns Object with success flag and any error details
 */
export const generateEmbeddingsForFile = async (fileId: string, projectId: string): Promise<{ 
  success: boolean; 
  message?: string;
  error?: string; 
}> => {
  try {
    // Call the generate-embeddings edge function
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        fileId,
        projectId
      }
    });
    
    if (error) {
      console.error('Error generating embeddings:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to generate embeddings' 
      };
    }
    
    return { 
      success: true, 
      message: data.message || 'Embeddings generated successfully' 
    };
  } catch (err: any) {
    console.error('Exception generating embeddings:', err);
    return { 
      success: false, 
      error: err.message || 'An unexpected error occurred' 
    };
  }
};

/**
 * Check if a file has embeddings
 * @param fileId The ID of the file to check
 * @returns Boolean indicating if embeddings exist
 */
export const checkFileHasEmbeddings = async (fileId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('file_id', fileId);
    
    if (error) {
      console.error('Error checking embeddings:', error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (err) {
    console.error('Exception checking embeddings:', err);
    return false;
  }
};

/**
 * Delete all embeddings for a file
 * @param fileId The ID of the file to delete embeddings for
 * @returns Success flag
 */
export const deleteEmbeddingsForFile = async (fileId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('file_id', fileId);
    
    if (error) {
      console.error('Error deleting embeddings:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception deleting embeddings:', err);
    return false;
  }
}; 