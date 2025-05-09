import supabase from './supabaseClient';

/**
 * Helper functions for working with Supabase Storage
 * These utilities ensure proper CORS handling and consistent error management
 */

const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  FILES: 'files',
  THUMBNAILS: 'thumbnails',
};

/**
 * Get a public URL for a file in storage
 */
export const getPublicUrl = (bucket: string, path: string) => {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return null;
  }
};

/**
 * Get a signed URL for a file in storage (better for CORS and restricted content)
 * @param bucket The storage bucket name
 * @param path The path to the file in the bucket
 * @param expiresIn Expiration time in seconds (default: 60 minutes)
 */
export const getSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
};

/**
 * Upload a file to storage
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Download a file from storage
 */
export const downloadFile = async (bucket: string, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Fetch file data via the CORS-enabled download method
 * Use this instead of direct fetch for files from Supabase storage
 */
export const fetchFileWithCors = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    /*
      Expected formats that Supabase generates:
        1. /storage/v1/object/public/{bucket}/{path}
        2. /storage/v1/object/sign/{bucket}/{path}
      We want to extract the bucket (immediately after "public" or "sign") and then the remainder as path.
    */
    const objectIdx = parts.indexOf('object');
    if (objectIdx === -1 || objectIdx + 2 >= parts.length) {
      throw new Error('Invalid storage URL format – cannot locate bucket');
    }
    
    const visibility = parts[objectIdx + 1]; // "public" or "sign"
    const bucket = parts[objectIdx + 2];
    const path = parts.slice(objectIdx + 3).join('/');
    
    if (!bucket || !path) {
      throw new Error('Invalid storage URL – missing bucket or path');
    }

    // Use Supabase SDK download which sets the correct auth headers & CORS
    return await downloadFile(bucket, path);
  } catch (error) {
    console.error('CORS fetch via Supabase download failed:', error);
    throw error;
  }
};

/**
 * Get thumbnail URL with proper CORS handling
 * Uses signed URLs instead of public URLs to avoid 400 "Object not found" errors
 */
export const getThumbnailUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
  try {
    // Always use signed URLs for thumbnails
    return await getSignedUrl(bucket, path, expiresIn);
  } catch (error) {
    console.error('Error getting thumbnail URL:', error);
    // Fall back to public URL if signed URL fails
    return getPublicUrl(bucket, path);
  }
};

export default {
  STORAGE_BUCKETS,
  getPublicUrl,
  getSignedUrl,
  uploadFile,
  downloadFile,
  fetchFileWithCors,
  getThumbnailUrl,
}; 