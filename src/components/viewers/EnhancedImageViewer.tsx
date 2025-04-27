import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

interface EnhancedImageViewerProps {
  fileUrl: string;
  fileName?: string;
}

const EnhancedImageViewer: React.FC<EnhancedImageViewerProps> = ({ fileUrl, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load image. Please try again later.');
  };

  const rotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const viewerElement = document.getElementById('image-viewer-container');
      if (viewerElement) {
        viewerElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
      setIsFullscreen(false);
    }
  };

  // Listen for exiting fullscreen via Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Additional cleanup effect to ensure proper resource management
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setLoading(false);
      setError(null);
      setRotation(0);
      setIsFullscreen(false);
      
      // Exit fullscreen if active when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error(`Error exiting fullscreen during cleanup:`, err);
        });
      }
    };
  }, []);

  return (
    <Box 
      id="image-viewer-container"
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Controls overlay */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 0.5
        }}
      >
        <Tooltip title="Zoom In">
          <IconButton size="small">
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom Out">
          <IconButton size="small">
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Reset View">
          <IconButton size="small">
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Rotate Left">
          <IconButton size="small" onClick={rotateLeft}>
            <RotateLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Rotate Right">
          <IconButton size="small" onClick={rotateRight}>
            <RotateRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <IconButton size="small" onClick={toggleFullscreen}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main content area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          p: 1 
        }}
      >
        {loading && (
          <CircularProgress />
        )}
        
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          wheel={{ wheelEnabled: true }}
          doubleClick={{ mode: 'zoomIn' }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <TransformComponent 
              wrapperStyle={{ 
                width: '100%', 
                height: '100%',
                display: loading ? 'none' : 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {error ? (
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
              ) : (
                <img
                  src={fileUrl}
                  alt={fileName || 'Image'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 100px)',
                    display: 'block',
                    margin: '0 auto',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease',
                    objectFit: 'contain'
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </TransformComponent>
          )}
        </TransformWrapper>
      </Box>
    </Box>
  );
};

export default EnhancedImageViewer;