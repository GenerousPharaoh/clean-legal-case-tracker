import React, { useState, useEffect, forwardRef, useMemo } from 'react';
import { Box, CircularProgress, Typography, Alert, Button, Paper } from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import EnhancedPdfViewer from './EnhancedPdfViewer';
import { getErrorMessage, logError } from '../../utils/errorHandler';

// File types supported by the viewer
export type SupportedFileType = 
  | 'pdf' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'unknown';

interface FileViewerProps {
  url?: string;
  fileName?: string;
  fileType?: string;
  mimeType?: string;
  onError?: (error: Error) => void;
}

export const FileViewer = forwardRef<HTMLDivElement, FileViewerProps>(
  ({ url, fileName, fileType, mimeType, onError }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Determine file type if not provided
    const determinedType = useMemo<SupportedFileType>(() => {
      if (!url) return 'unknown';
      
      if (fileType) {
        switch (fileType.toLowerCase()) {
          case 'pdf': return 'pdf';
          case 'image': return 'image';
          case 'video': return 'video';
          case 'audio': return 'audio';
          case 'text':
          case 'document': 
            return 'text';
          default: 
            return 'unknown';
        }
      }
      
      if (mimeType) {
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('text/') || 
            mimeType.includes('document') ||
            mimeType === 'application/rtf') return 'text';
      }
      
      // Try to determine from file extension
      if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension) {
          if (extension === 'pdf') return 'pdf';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) return 'image';
          if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(extension)) return 'video';
          if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) return 'audio';
          if (['txt', 'doc', 'docx', 'rtf', 'odt', 'pages', 'md', 'html', 'xml', 'json'].includes(extension)) return 'text';
        }
      }
      
      if (url.includes('.pdf')) return 'pdf';
      if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/.test(url)) return 'image';
      if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)($|\?)/.test(url)) return 'video';
      if (/\.(mp3|wav|ogg|aac|flac|m4a)($|\?)/.test(url)) return 'audio';
      
      return 'unknown';
    }, [url, fileType, mimeType, fileName]);
    
    useEffect(() => {
      if (url) {
        setLoading(true);
        setError(null);
      } else {
        setLoading(false);
      }
    }, [url]);
    
    // Handle loading/error states
    const handleLoad = () => {
      setLoading(false);
      setError(null);
    };
    
    const handleError = (err: Error | string) => {
      const errorMessage = typeof err === 'string' ? err : err.message || 'Failed to load file';
      setLoading(false);
      setError(errorMessage);
      logError(err, 'FileViewer');
      
      if (onError && err instanceof Error) {
        onError(err);
      } else if (onError) {
        onError(new Error(errorMessage));
      }
    };
    
    // Handle file download
    const handleDownload = () => {
      if (!url) return;
      
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        logError(error, 'FileViewer.download');
      }
    };
    
    // Render appropriate viewer based on file type
    const renderFileViewer = () => {
      if (!url) {
        return (
          <Typography variant="body1" color="text.secondary" align="center">
            No file selected
          </Typography>
        );
      }
      
      if (error) {
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The file could not be displayed. You can try downloading it instead.
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Download
            </Button>
          </Box>
        );
      }
      
      if (loading) {
        return (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading file...
            </Typography>
          </Box>
        );
      }
      
      switch (determinedType) {
        case 'pdf':
          return (
            <EnhancedPdfViewer 
              url={url} 
              fileName={fileName}
            />
          );
          
        case 'image':
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              <Box 
                sx={{ 
                  position: 'relative',
                  maxWidth: '100%',
                  maxHeight: 'calc(100% - 60px)',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  p: 1,
                }}
              >
                <img 
                  src={url} 
                  alt={fileName || 'Image'} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onLoad={handleLoad}
                  onError={() => handleError('Failed to load image')}
                />
              </Box>
              
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download
              </Button>
            </Box>
          );
          
        case 'video':
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              <Paper 
                elevation={2}
                sx={{ 
                  width: '100%',
                  maxHeight: 'calc(100% - 60px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <video 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                  onLoadedData={handleLoad}
                  onError={() => handleError('Failed to load video')}
                >
                  <source src={url} type={mimeType} />
                  Your browser does not support video playback.
                </video>
              </Paper>
              
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ mt: 2 }}
              >
                Download
              </Button>
            </Box>
          );
          
        case 'audio':
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {fileName || 'Audio File'}
                </Typography>
                
                <Box sx={{ width: '100%', mt: 2, mb: 3 }}>
                  <audio 
                    controls 
                    style={{ width: '100%' }}
                    onLoadedData={handleLoad}
                    onError={() => handleError('Failed to load audio')}
                  >
                    <source src={url} type={mimeType} />
                    Your browser does not support audio playback.
                  </audio>
                </Box>
                
                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </Paper>
            </Box>
          );
          
        case 'text':
          // For text files, offer download since we don't have a built-in text viewer yet
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  maxWidth: 500,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {fileName || 'Text Document'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  This file type cannot be previewed directly in the browser.
                  Please download the file to view its contents.
                </Typography>
                
                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download File
                </Button>
              </Paper>
            </Box>
          );
          
        case 'unknown':
        default:
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  maxWidth: 500,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Unsupported File Type
                </Typography>
                
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  This file type ({mimeType || fileType || 'Unknown'}) cannot be previewed in the browser.
                  Please download the file to view its contents.
                </Typography>
                
                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download File
                </Button>
              </Paper>
            </Box>
          );
      }
    };
    
    return (
      <Box 
        ref={ref}
        sx={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {renderFileViewer()}
      </Box>
    );
  }
);

FileViewer.displayName = 'FileViewer';

export default FileViewer; 