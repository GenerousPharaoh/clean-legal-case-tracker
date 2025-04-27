import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useFileStore } from '../store/fileStore';
import { useToast } from './useToast';

interface UploadOptions {
  bucket?: string;
  folderPath?: string;
  fileNameOverride?: string;
  contentType?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
  projectId?: string;
  metadata?: Record<string, string>;
}

interface UploadResult {
  fileId: string | null;
  path: string | null;
  error: Error | null;
  metadata?: Record<string, any>;
}

/**
 * useFileUpload - A hook for handling file uploads with progress tracking
 * 
 * Provides functions for uploading files to Supabase storage with progress
 * tracking, error handling, and automatic metadata storage in the database.
 * 
 * @returns File upload utilities
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { setUploadProgress: setStoreProgress, resetUploadProgress } = useFileStore();
  const toast = useToast();

  /**
   * Upload a single file with progress tracking
   */
  const uploadFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    if (!file) {
      return { fileId: null, path: null, error: new Error('No file provided') };
    }

    const {
      bucket = 'files',
      folderPath = '',
      fileNameOverride,
      contentType,
      onSuccess,
      onError,
      onProgress,
      projectId,
      metadata = {}
    } = options;

    // Generate a unique ID for the file if not provided
    const fileId = uuidv4();
    
    // Track this upload in our state
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    setStoreProgress(fileId, 0);
    
    setUploading(true);

    try {
      // Create a file path that includes projectId if available
      const projectFolder = projectId ? `${projectId}/` : '';
      const fileName = fileNameOverride || file.name;
      const finalPath = `${folderPath ? `${folderPath}/` : ''}${projectFolder}${fileId}-${fileName}`;

      // Prepare file metadata
      const fileMetadata = {
        ...metadata,
        originalName: file.name,
        contentType: contentType || file.type,
        size: file.size,
        projectId: projectId || null,
        uploadedAt: new Date().toISOString()
      };

      // Upload the file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucket)
        .upload(finalPath, file, {
          cacheControl: '3600',
          contentType: contentType || file.type,
          upsert: true,
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            
            // Update progress in state
            setUploadProgress(prev => ({ ...prev, [fileId]: percentage }));
            setStoreProgress(fileId, percentage);
            
            // Call the onProgress callback if provided
            onProgress?.(percentage);
          }
        });

      if (storageError) {
        throw storageError;
      }

      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(storageData.path);

      // Store the file metadata in the database
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name: fileName,
          original_name: file.name,
          file_type: file.type.split('/')[0],
          mime_type: file.type,
          size: file.size,
          path: storageData.path,
          url: urlData.publicUrl,
          project_id: projectId || null,
          metadata: fileMetadata
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Call the onSuccess callback if provided
      onSuccess?.(dbData);

      // Set progress to 100%
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      setStoreProgress(fileId, 100);

      // Show a success toast
      toast.success(
        'File uploaded successfully', 
        `"${file.name}" has been uploaded and is ready to use.`
      );

      return {
        fileId,
        path: storageData.path,
        error: null,
        metadata: dbData
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Call the onError callback if provided
      onError?.(error);
      
      // Show an error toast
      toast.error(
        'Failed to upload file', 
        `There was an error uploading "${file.name}". Please try again.`
      );

      return {
        fileId: null,
        path: null,
        error: error as Error
      };
    } finally {
      setUploading(false);
      
      // Clean up progress state after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[fileId];
          return newState;
        });
        resetUploadProgress(fileId);
      }, 1000);
    }
  }, [setStoreProgress, resetUploadProgress, toast]);

  /**
   * Upload multiple files in parallel
   */
  const uploadFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ) => {
    if (!files || files.length === 0) {
      return { fileIds: [], paths: [], errors: [new Error('No files provided')] };
    }

    setUploading(true);

    try {
      // Upload all files in parallel
      const results = await Promise.all(
        files.map(file => uploadFile(file, options))
      );

      const fileIds = results.map(result => result.fileId).filter(Boolean) as string[];
      const paths = results.map(result => result.path).filter(Boolean) as string[];
      const errors = results.map(result => result.error).filter(Boolean) as Error[];
      const metadataArray = results.map(result => result.metadata).filter(Boolean);

      // Show a success toast if some files were uploaded successfully
      if (fileIds.length > 0) {
        toast.success(
          `${fileIds.length} files uploaded successfully`,
          errors.length > 0 
            ? `${errors.length} files failed to upload.` 
            : undefined
        );
      }

      return { fileIds, paths, errors, metadata: metadataArray };
    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Show an error toast
      toast.error(
        'Failed to upload files', 
        'There was an error uploading your files. Please try again.'
      );

      return { fileIds: [], paths: [], errors: [error as Error], metadata: [] };
    } finally {
      setUploading(false);
    }
  }, [uploadFile, toast]);

  /**
   * Delete a file from storage and database
   */
  const deleteFile = useCallback(async (
    fileId: string,
    bucket: string = 'files'
  ) => {
    try {
      // First get the file details to get the path
      const { data: fileData, error: fetchError } = await supabase
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([fileData.path]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      // Show a success toast
      toast.success('File deleted successfully');

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting file:', error);
      
      // Show an error toast
      toast.error(
        'Failed to delete file', 
        'There was an error deleting the file. Please try again.'
      );

      return { success: false, error };
    }
  }, [toast]);

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploading,
    uploadProgress
  };
};

export default useFileUpload;
