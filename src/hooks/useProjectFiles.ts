import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabaseClient, { getStorageUrl, getSupabaseKey } from '../supabase-client-wrapper';

export interface FileRecord {
  id: string;
  project_id: string;
  name: string;
  exhibit_id?: string;
  storage_path: string;
  content_type: string;
  size: number;
  file_type: string;
  metadata: {
    thumbnailUrl?: string;
    tags?: string[];
    fileType?: string;
    uploadTimestamp?: number;
  };
  added_at: string;
  owner_id: string;
  uploaded_by_user_id?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
}

/**
 * Custom hook to fetch project files with proper type safety
 * Always returns an array (never null, undefined, or an object)
 */
export function useProjectFiles(projectId: string | null) {
  return useQuery<FileRecord[], Error>({
    queryKey: ['files', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabaseClient
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      
      // Convert the response data to match our FileRecord type
      // This handles the JSON metadata correctly
      const typedData: FileRecord[] = data ? data.map(file => ({
        ...file,
        metadata: typeof file.metadata === 'object' ? file.metadata : {}, // Ensure metadata is an object
      })) : [];
      
      // Ensure we always return an array, never null or undefined
      return typedData;
    },
    // Don't run the query if projectId is null
    enabled: !!projectId,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Retry up to 3 times
    retry: 3,
    // Don't refetch on window focus to avoid unwanted refreshes
    refetchOnWindowFocus: false
  });
}

/**
 * Custom hook to upload a file to Supabase storage and add its record to the files table
 * Enhanced with progress reporting and better error handling
 */
export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      projectId, 
      userId,
      onProgress,
    }: { 
      file: File; 
      projectId: string; 
      userId: string;
      onProgress?: (progress: UploadProgressEvent) => void;
    }) => {
      if (!file || !projectId || !userId) {
        throw new Error('Missing required parameters: file, projectId, or userId');
      }
      
      try {
        // Extract the file extension and type
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        
        // Determine file type more accurately based on MIME type and extension
        let fileType = 'document'; // Default file type
        
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
        } else if (file.type === 'application/pdf') {
          fileType = 'pdf';
        } else if (['doc', 'docx', 'odt', 'rtf'].includes(fileExt)) {
          fileType = 'document';
        } else if (['xls', 'xlsx', 'csv', 'ods'].includes(fileExt)) {
          fileType = 'spreadsheet';
        } else if (['ppt', 'pptx', 'odp'].includes(fileExt)) {
          fileType = 'presentation';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) {
          fileType = 'archive';
        } else if (['html', 'css', 'js', 'ts', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'php'].includes(fileExt)) {
          fileType = 'code';
        }
        
        // Create a storage path with timestamp to avoid name conflicts
        const timestamp = new Date().getTime();
        const storagePath = `users/${userId}/projects/${projectId}/${timestamp}_${file.name}`;
        
        console.log('Starting file upload process:', { name: file.name, storagePath, fileType });
        
        // Set up a custom fetch with progress monitoring
        const uploadWithProgress = async () => {
          // Prepare the form data for upload
          const formData = new FormData();
          formData.append('file', file);
          
          // Create a custom controller to manage upload
          const controller = new AbortController();
          
          // Set up an XMLHttpRequest for progress tracking
          return new Promise<{ path: string }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Use the wrapper function to get storage URL safely
            const supabaseURL = `${getStorageUrl()}/object/files/${storagePath}`;
            
            xhr.open('POST', supabaseURL, true);
            
            // Get authentication headers using public methods
            const authToken = supabaseClient.auth.getSession()
              .then(session => session.data.session?.access_token)
              .catch(() => null);
            
            // Set headers when auth token is available
            authToken.then(token => {
              if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              }
              
              // Use the wrapper function to get api key safely
              xhr.setRequestHeader('apikey', getSupabaseKey());
              xhr.setRequestHeader('x-upsert', 'true');
              
              // Track upload progress
              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                  onProgress({
                    loaded: event.loaded,
                    total: event.total
                  });
                }
              };
              
              // Handle completion
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve({ path: storagePath });
                } else {
                  reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
                }
              };
              
              // Handle errors
              xhr.onerror = () => {
                reject(new Error('Network error occurred during upload'));
              };
              
              xhr.onabort = () => {
                reject(new Error('Upload was aborted'));
              };
              
              // Send the file
              xhr.send(formData);
            });
          });
        };
        
        // Step 1: Upload file to storage with progress tracking
        try {
          const { path } = await uploadWithProgress();
          console.log('File uploaded successfully to path:', path);
        } catch (uploadError) {
          console.error('Error during file upload:', uploadError);
          throw new Error(`Storage upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
        
        // Call onProgress one last time to ensure 100%
        if (onProgress) {
          onProgress({ loaded: file.size, total: file.size });
        }
        
        // Create metadata with enhanced information
        const fileMetadata = {
          thumbnailUrl: fileType === 'image' ? storagePath : null,
          tags: [],
          fileType: fileType,
          uploadTimestamp: timestamp,
          originalFileName: file.name,
          fileExtension: fileExt,
          mimeType: file.type,
        };
        
        // Step 2: Create database record
        const insertData = {
          name: file.name,
          project_id: projectId,
          owner_id: userId,
          storage_path: storagePath,
          content_type: file.type,
          size: file.size,
          file_type: fileType,
          metadata: fileMetadata,
          uploaded_by_user_id: userId,
        };
        
        // Step 3: Insert file record, returning the new record
        const { data: fileData, error: fileError } = await supabaseClient
          .from('files')
          .insert(insertData)
          .select('*')
          .single();
        
        if (fileError) {
          // Attempt to clean up the storage file if database insert fails
          try {
            await supabaseClient.storage.from('files').remove([storagePath]);
            console.log('Cleaned up storage file after database insert failed');
          } catch (cleanupError) {
            console.error('Failed to clean up storage file:', cleanupError);
          }
          
          throw new Error(`Database insert failed: ${fileError.message}`);
        }
        
        console.log('File record created in database:', fileData);
        
        return fileData;
      } catch (error) {
        console.error('File upload error:', error);
        throw error;
      }
    },
    // Invalidate and refetch files query after successful upload
    onSuccess: (data) => {
      if (data && data.project_id) {
        queryClient.invalidateQueries({ queryKey: ['files', data.project_id] });
      }
    }
  });
} 