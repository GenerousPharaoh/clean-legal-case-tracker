import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../supabaseClient';

export const UploadPanel: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrorMessage(null);
    setUploading(true);
    setFiles(acceptedFiles);
    
    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type // Explicitly set content type
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message || 'Error uploading file');
        }
      }
      
      console.log('Files uploaded successfully');
    } catch (error) {
      console.error('Error in file upload:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error during upload');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p className="text-blue-500">Drop the files here ...</p> :
            <div>
              <p className="mb-2">Drag files here, or click to select files</p>
              <p className="text-sm text-gray-500">Supported: PDF, Word, Text files</p>
            </div>
        }
      </div>
      
      {/* Show error message if any */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <p className="font-medium">Upload Error</p>
          <p className="text-sm">{errorMessage}</p>
          <p className="text-xs mt-1">Try again or contact support if the problem persists.</p>
        </div>
      )}
      
      {/* Show uploading indicator */}
      {uploading && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded">
          <p>Uploading files...</p>
        </div>
      )}
      
      {/* Show file list */}
      {files.length > 0 && !uploading && !errorMessage && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Uploaded Files</h3>
          <ul className="border rounded divide-y">
            {files.map((file, index) => (
              <li key={index} className="p-2 flex items-center">
                <span className="text-gray-600 flex-grow">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 