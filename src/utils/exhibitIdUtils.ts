import { supabase } from '../supabaseClient';

/**
 * Determines the next sequential Exhibit ID for a given project
 * @param projectId The project ID to get the next exhibit ID for
 * @param prefix Optional prefix for the exhibit ID (default: 'EXH-')
 * @returns The next sequential exhibit ID
 */
export const getNextExhibitId = async (projectId: string, prefix: string = 'EXH-'): Promise<string> => {
  try {
    // Query for files with exhibit_id in this project that match the prefix pattern
    const { data, error } = await supabase
      .from('files')
      .select('exhibit_id')
      .eq('project_id', projectId)
      .not('exhibit_id', 'is', null)
      .ilike('exhibit_id', `${prefix}%`)
      .order('exhibit_id', { ascending: false });
    
    if (error) throw error;
    
    // Start with 1 for the first exhibit
    let maxNumber = 0;
    
    // If we have existing exhibit IDs, find the highest number
    if (data && data.length > 0) {
      // Extract numbers from existing IDs
      const numbers = data
        .map(file => {
          if (!file.exhibit_id) return 0;
          
          // Extract numeric part from exhibit_id
          const match = file.exhibit_id.match(new RegExp(`${prefix}(\\d+)`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      // Find the maximum number
      maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    }
    
    // Increment for next ID and format with leading zeros
    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.error('Error getting next exhibit ID:', error);
    
    // Fallback to timestamp-based ID
    const timestamp = new Date().getTime().toString().slice(-5);
    return `${prefix}${timestamp}`;
  }
};

/**
 * Checks if an exhibit ID is unique within a project
 * @param projectId The project ID to check within
 * @param exhibitId The exhibit ID to check for uniqueness
 * @param excludeFileId Optional file ID to exclude from the check (useful when updating)
 * @returns True if the exhibit ID is unique, false otherwise
 */
export const checkExhibitIdUniqueness = async (
  projectId: string, 
  exhibitId: string,
  excludeFileId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('files')
      .select('id')
      .eq('project_id', projectId)
      .eq('exhibit_id', exhibitId);
    
    // If a file ID is provided, exclude it from the query
    if (excludeFileId) {
      query = query.neq('id', excludeFileId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // If no records are found, the exhibit ID is unique
    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking exhibit ID uniqueness:', error);
    // Return true in case of error to allow saving (database constraints will catch duplicates)
    return true;
  }
};

/**
 * Validates and updates a file's name and exhibit ID
 * @param fileId The file ID to update
 * @param newName The new file name
 * @param exhibitId The new exhibit ID
 * @returns Success status and any error message
 */
export const updateFileDetails = async (
  fileId: string, 
  newName: string, 
  exhibitId: string | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    if (!fileId) {
      return { success: false, error: 'File ID is required' };
    }
    
    if (!newName || newName.trim() === '') {
      return { success: false, error: 'File name cannot be empty' };
    }
    
    // Get the file to check project ID
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('project_id, name')
      .eq('id', fileId)
      .single();
    
    if (fileError) {
      return { success: false, error: 'Failed to fetch file details' };
    }
    
    // Check if the exhibit ID already exists in this project (if provided)
    if (exhibitId) {
      const isUnique = await checkExhibitIdUniqueness(fileData.project_id, exhibitId, fileId);
      
      if (!isUnique) {
        return { success: false, error: 'Exhibit ID already exists in this project' };
      }
    }
    
    // Update the file
    const { error: updateError } = await supabase
      .from('files')
      .update({ 
        name: newName,
        exhibit_id: exhibitId
      })
      .eq('id', fileId);
    
    if (updateError) {
      if (updateError.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Exhibit ID already exists in this project' };
      }
      return { success: false, error: 'Failed to update file details' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating file details:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}; 