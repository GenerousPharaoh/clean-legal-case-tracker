import { supabase } from '../supabaseClient';

/**
 * Get a cached URL for a file in Supabase Storage
 * Uses cache busting for development but optimizes for production
 * 
 * @param bucketName The storage bucket name
 * @param filePath The path to the file within the bucket
 * @param options Optional configuration
 * @returns URL to the file with appropriate cache control
 */
export const getStorageUrl = (
  bucketName: string,
  filePath: string,
  options: {
    download?: boolean;
    cacheTime?: number; // Cache time in seconds
    transform?: {
      width?: number;
      height?: number;
      resize?: 'cover' | 'contain' | 'fill';
      format?: 'origin'; // Removed 'webp' | 'avif' which are not supported by the type
      quality?: number; // 1-100
    };
  } = {}
): string => {
  // Set defaults
  const { download = false, cacheTime = 3600, transform } = options;
  
  // Create the storage path
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath, {
      download,
      transform: transform || undefined,
    });
  
  // If we have a public URL, add cache busting in dev mode
  if (data?.publicUrl) {
    const isDevMode = process.env.NODE_ENV === 'development';
    
    // Add timestamp query param for dev mode to avoid browser caching
    // Otherwise, use the configured cache time
    if (isDevMode) {
      const timestamp = new Date().getTime();
      return `${data.publicUrl}?t=${timestamp}`;
    } else {
      // For production, we'll rely on Supabase's cache control
      return data.publicUrl;
    }
  }
  
  // Fallback in case we couldn't get a URL
  return '';
};

/**
 * Generate a signed URL for temporary access to a file
 * Useful for sharing links or providing temporary access
 * 
 * @param bucketName The storage bucket name
 * @param filePath The path to the file within the bucket
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Promise with signed URL or error
 */
export const getSignedUrl = async (
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return '';
  }
};

/**
 * Generate a download URL for a file in storage
 * 
 * @param filePath The path to the file within the storage
 * @param bucketName The storage bucket name (default: 'files')
 * @returns Promise with download URL
 */
export const getDownloadUrl = async (
  filePath: string,
  bucketName: string = 'files'
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600, {
        download: true
      });
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (err) {
    console.error('Error generating download URL:', err);
    throw err;
  }
};

/**
 * Check if a file exists in storage
 * 
 * @param bucketName The storage bucket name
 * @param filePath The path to the file within the bucket
 * @returns Promise<boolean> - true if file exists
 */
export const fileExists = async (
  bucketName: string,
  filePath: string
): Promise<boolean> => {
  try {
    // Try to get the file metadata
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    // Make a HEAD request to check if the file exists
    const response = await fetch(data.publicUrl, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    
    return response.ok;
  } catch (err) {
    console.error('Error checking if file exists:', err);
    return false;
  }
};

/**
 * Get file metadata from storage
 * 
 * @param bucketName The storage bucket name
 * @param filePath The path to the file within the bucket
 * @returns Promise with file metadata or null
 */
export const getFileMetadata = async (
  bucketName: string,
  filePath: string
) => {
  try {
    // List files in the specific path to get metadata
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        limit: 100,
        offset: 0,
      });
    
    if (error) throw error;
    
    // Find the specific file by name
    const fileName = filePath.split('/').pop() || '';
    const fileData = data.find(file => file.name === fileName);
    
    return fileData || null;
  } catch (err) {
    console.error('Error getting file metadata:', err);
    return null;
  }
};
