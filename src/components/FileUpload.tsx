import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Button, 
  LinearProgress, 
  Typography, 
  Paper, 
  CircularProgress,
  Zoom,
  Fade,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useFileUpload } from '../hooks/useFileUpload';
import { useFileStore } from '../store';
import FeedbackMessage from './FeedbackMessage';
import { cssTransitions } from '../utils/transitions';

interface FileUploadProps {
  projectId: string | null;
  onComplete?: () => void;
  // Accept comma-separated MIME types or wildcards (e.g., "image/*, application/pdf")
  acceptedFileTypes?: string;
}

/**
 * FileUpload - A drop zone for uploading files with visual feedback
 */
const FileUpload: React.FC<FileUploadProps> = ({ 
  projectId, 
  onComplete,
  // Default to accepting all file types
  acceptedFileTypes = ''
}) => {
  const { uploadFiles } = useFileUpload();
  const { uploading, uploadProgress } = useFileStore();
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [recentSuccess, setRecentSuccess] = useState(false);

  // Parse the acceptedFileTypes string into an object for react-dropzone
  const parseAcceptedTypes = (): Record<string, string[]> | undefined => {
    if (!acceptedFileTypes) return undefined;
    
    const types = acceptedFileTypes.split(',').map(type => type.trim());
    if (types.length === 0) return undefined;
    
    // Format for react-dropzone: { 'image/*': [], 'application/pdf': [] }
    const acceptObject: Record<string, string[]> = {};
    types.forEach(type => {
      acceptObject[type] = [];
    });
    
    return acceptObject;
  };

  // Set max file size (500MB)
  const MAX_FILE_SIZE = 500 * 1024 * 1024;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      if (!projectId) {
        showNotification('Please select a project first', 'error');
        return;
      }
      
      // Check file sizes
      const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        showNotification(
          `${oversizedFiles.length} file(s) exceed the 500MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`, 
          'error'
        );
        return;
      }

      try {
        await uploadFiles(acceptedFiles, {
          projectId,
          onSuccess: () => {
            showNotification(`${acceptedFiles.length} file(s) uploaded successfully`, 'success');
            setRecentSuccess(true);
            setTimeout(() => setRecentSuccess(false), 3000);
            if (onComplete) onComplete();
          },
          onError: (error) => {
            showNotification(error.message, 'error');
          },
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        showNotification(errorMessage, 'error');
      }
    },
    [projectId, uploadFiles, onComplete]
  );

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setMessage(msg);
    setMessageType(type);
    setShowMessage(true);
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } = useDropzone({
    onDrop,
    disabled: uploading || !projectId,
    accept: parseAcceptedTypes(),
    onDropRejected: (rejections) => {
      const message = rejections.map(rejection => 
        `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
      ).join('\n');
      showNotification(`Invalid file type: Please check accepted formats`, 'warning');
    },
    noClick: false,
    noKeyboard: false,
  });

  // Get the current upload progress as a percentage (average of all files)
  const currentProgress = Object.values(uploadProgress).length
    ? Object.values(uploadProgress).reduce((sum, val) => sum + val, 0) /
      Object.values(uploadProgress).length
    : 0;

  // Display accepted file types to the user in a friendly format
  const renderAcceptedTypesLabel = () => {
    if (!acceptedFileTypes) return 'All files';
    
    const typeLabels: Record<string, string> = {
      'image/*': 'Images',
      'video/*': 'Videos',
      'audio/*': 'Audio',
      'application/pdf': 'PDFs',
      'text/plain': 'Text files',
      'application/msword': 'Word docs',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word docs',
    };
    
    return acceptedFileTypes
      .split(',')
      .map(type => typeLabels[type.trim()] || type.trim())
      .join(', ');
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive 
            ? isDragAccept 
              ? 'success.main' 
              : isDragReject 
                ? 'error.main' 
                : 'primary.main' 
            : recentSuccess 
              ? 'success.main' 
              : 'divider',
          borderRadius: 2,
          backgroundColor: isDragActive 
            ? (theme) => isDragAccept 
              ? theme.palette.success.light + '10' 
              : isDragReject 
                ? theme.palette.error.light + '10' 
                : theme.palette.primary.light + '10' 
            : recentSuccess 
              ? (theme) => theme.palette.success.light + '10' 
              : 'background.paper',
          transition: cssTransitions.medium,
          cursor: !uploading && projectId ? 'pointer' : 'not-allowed',
          opacity: !projectId ? 0.7 : 1,
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            backgroundColor: !uploading && projectId 
              ? (theme) => theme.palette.action.hover 
              : undefined,
            borderColor: !uploading && projectId ? 'primary.light' : undefined,
            transform: !uploading && projectId ? 'translateY(-2px)' : undefined,
            boxShadow: !uploading && projectId ? '0 3px 8px rgba(0, 0, 0, 0.08)' : undefined,
          },
        }}
      >
        <Box
          {...getRootProps()}
          sx={{
            p: 3,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <input {...getInputProps()} />
          
          <Fade in={!uploading} timeout={300}>
            <Box sx={{ position: 'relative' }}>
              <CloudUploadIcon 
                sx={{ 
                  fontSize: 40, 
                  mb: 1,
                  color: isDragActive 
                    ? isDragAccept 
                      ? 'success.main' 
                      : isDragReject 
                        ? 'error.main' 
                        : 'primary.main' 
                    : recentSuccess 
                      ? 'success.main' 
                      : 'action.active',
                  transition: cssTransitions.fast,
                  animation: isDragActive ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                    },
                    '50%': {
                      transform: 'scale(1.1)',
                    },
                    '100%': {
                      transform: 'scale(1)',
                    },
                  },
                }} 
              />
              <Zoom in={recentSuccess} timeout={500}>
                <CheckCircleIcon
                  color="success"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: -10,
                    fontSize: 22,
                    background: 'white',
                    borderRadius: '50%',
                  }}
                />
              </Zoom>
            </Box>
          </Fade>
          
          {uploading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={currentProgress} 
                  size={48} 
                  thickness={4}
                  sx={{ mb: 1 }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    {`${Math.round(currentProgress)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Uploading {Object.keys(uploadProgress).length} file(s)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {currentProgress < 100 ? 'Please wait...' : 'Almost done...'}
              </Typography>
            </Box>
          ) : (
            <>
              <Typography 
                variant="body1" 
                gutterBottom
                sx={{ 
                  fontWeight: 500,
                  color: isDragActive 
                    ? isDragAccept 
                      ? 'success.main' 
                      : isDragReject 
                        ? 'error.main' 
                        : 'primary.main' 
                    : recentSuccess 
                      ? 'success.main' 
                      : 'text.primary',
                }}
              >
                {isDragActive
                  ? isDragAccept
                    ? 'Drop to upload!'
                    : isDragReject
                      ? 'File type not allowed'
                      : 'Drop files here...'
                  : !projectId
                  ? 'Select a project first'
                  : recentSuccess
                    ? 'Upload successful!'
                    : 'Drag files here'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {!isDragActive && (
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    or <Button 
                      size="small" 
                      onClick={open} 
                      startIcon={<UploadFileIcon />}
                      variant="text"
                      disabled={!projectId}
                      sx={{ 
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 0.3,
                        ml: 0.3,
                      }}
                    >
                      browse files
                    </Button>
                  </Box>
                )}
              </Typography>
              
              {!isDragActive && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ mt: 1, display: 'block', opacity: 0.8 }}
                >
                  Accepted: {renderAcceptedTypesLabel()}
                </Typography>
              )}
            </>
          )}
        </Box>
        
        {/* Upload progress at the bottom */}
        {uploading && (
          <LinearProgress
            variant="determinate"
            value={currentProgress}
            sx={{
              height: 4,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: 0,
            }}
          />
        )}
      </Paper>

      {/* Notifications */}
      <FeedbackMessage
        open={showMessage}
        message={message}
        type={messageType}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        showProgress
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseMessage}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default FileUpload; 