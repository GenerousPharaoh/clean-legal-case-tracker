import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Tooltip, Alert, CircularProgress, Snackbar } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { stringifyLinkData } from '../../store/linkStore';
import { MediaTimestampLinkData } from '../../types';

interface AudioVideoViewerProps {
  fileUrl: string;
  mediaType: 'audio' | 'video';
  fileName?: string;
  fileId?: string;
  initialTimestamp?: number;
}

const AudioVideoViewer: React.FC<AudioVideoViewerProps> = ({ 
  fileUrl, 
  mediaType, 
  fileName, 
  fileId, 
  initialTimestamp 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaElement, setMediaElement] = useState<HTMLMediaElement | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Ref to track whether we've already seeked to the initial timestamp
  const hasPerformedInitialSeek = useRef(false);

  const handleMediaLoad = () => {
    setLoading(false);
  };

  const handleMediaError = () => {
    setLoading(false);
    setError(`Failed to load ${mediaType} file. Please try again later.`);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    setCurrentTime(Math.floor(e.currentTarget.currentTime));
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean);
    
    return parts.join(':');
  };

  // Seek to timestamp when requested by link activation
  useEffect(() => {
    if (
      mediaElement && 
      initialTimestamp !== undefined && 
      !hasPerformedInitialSeek.current &&
      !loading
    ) {
      mediaElement.currentTime = initialTimestamp;
      // Optionally auto-play when navigating to a timestamp
      mediaElement.play().catch(err => {
        console.warn('Auto-play prevented:', err);
      });
      hasPerformedInitialSeek.current = true;
    }
  }, [mediaElement, initialTimestamp, loading]);

  // Reset the seek tracking when component remounts or fileId changes
  useEffect(() => {
    hasPerformedInitialSeek.current = false;
  }, [fileId]);

  // Additional cleanup effect to ensure all resources are freed
  useEffect(() => {
    return () => {
      // Stop media playback to prevent audio continuing after component unmount
      if (mediaElement) {
        mediaElement.pause();
        // Clear src to ensure proper cleanup
        mediaElement.src = '';
        mediaElement.load();
      }
      
      // Reset state
      setMediaElement(null);
      setCurrentTime(0);
      setLoading(false);
      setError(null);
      hasPerformedInitialSeek.current = false;
    };
  }, [mediaElement]);

  const copyTimestampToClipboard = () => {
    if (!mediaElement || !fileId) {
      setSnackbarMessage('Cannot copy link: missing file information');
      setSnackbarOpen(true);
      return;
    }
    
    // Create link data object
    const linkData: MediaTimestampLinkData = {
      fileId,
      fileName,
      type: 'media',
      mediaType,
      timestamp: currentTime
    };
    
    // Create link string
    const linkString = stringifyLinkData(linkData);
    
    navigator.clipboard.writeText(linkString)
      .then(() => {
        setSnackbarMessage(`Timestamp link copied to clipboard`);
        setSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy timestamp:', err);
        setSnackbarMessage('Failed to copy timestamp to clipboard');
        setSnackbarOpen(true);
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {error ? (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      ) : (
        <>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          )}
          
          <Box sx={{ 
            width: '100%', 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            my: 2,
            visibility: loading ? 'hidden' : 'visible',
          }}>
            {mediaType === 'video' ? (
              <video
                ref={(el) => setMediaElement(el)}
                src={fileUrl}
                controls
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                onLoadedData={handleMediaLoad}
                onError={handleMediaError}
                onTimeUpdate={handleTimeUpdate}
                controlsList="nodownload"
              />
            ) : (
              <audio
                ref={(el) => setMediaElement(el)}
                src={fileUrl}
                controls
                style={{ width: '100%' }}
                onLoadedData={handleMediaLoad}
                onError={handleMediaError}
                onTimeUpdate={handleTimeUpdate}
                controlsList="nodownload"
              />
            )}
          </Box>
          
          {!loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Current time: {formatTime(currentTime)}
              </Typography>
              <Tooltip title="Copy Link to Timestamp">
                <IconButton
                  size="small"
                  onClick={copyTimestampToClipboard}
                  aria-label="Copy link to timestamp"
                  disabled={!fileId}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {/* Feedback Snackbar */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            message={snackbarMessage}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </>
      )}
    </Box>
  );
};

export default AudioVideoViewer;