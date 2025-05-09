import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, IconButton, Tooltip, Typography, Paper } from '@mui/material';
import { 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon,
  Rotate90DegreesCcw as RotateLeftIcon,
  Rotate90DegreesCw as RotateRightIcon,
} from '@mui/icons-material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import storageService from '../../services/storageService';

interface EnhancedImageViewerProps {
  url: string;
  initialZoom?: number;
  initialRotation?: number;
}

const EnhancedImageViewer = ({ url, initialZoom = 1, initialRotation = 0 }: EnhancedImageViewerProps) => {
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [rotation, setRotation] = useState<number>(initialRotation);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(url);
  
  const transformRef = useRef<any>(null);
  
  // Load image using the CORS-compliant method
  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if the URL is a Supabase storage URL
        if (url.includes('supabase') && url.includes('/storage/v1/')) {
          // For Supabase storage URLs, use our CORS-enabled utility
          const blob = await storageService.fetchFileWithCors(url);
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            setImageUrl(objectUrl);
          } else {
            throw new Error('Failed to download image file');
          }
        } else {
          // For other URLs, use as is but still verify CORS access
          try {
            // Simple fetch test to see if direct access works
            const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
            if (!response.ok) {
              throw new Error('CORS check failed');
            }
            setImageUrl(url);
          } catch (corsError) {
            console.warn('Direct image access failed, using proxy:', corsError);
            // Try to use a CORS proxy if direct access fails
            setImageUrl(`/api/proxy-image?url=${encodeURIComponent(url)}`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('Error loading image:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadImage();
    
    // Clean up object URL on unmount
    return () => {
      if (imageUrl !== url && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [url]);
  
  // Handle image load events
  const handleImageLoad = () => {
    setLoading(false);
  };
  
  const handleImageError = (err: any) => {
    setError(new Error('Failed to load image'));
    setLoading(false);
    console.error('Image load error:', err);
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    if (transformRef.current) {
      transformRef.current.zoomIn(0.2);
      setZoom(prev => Math.min(prev + 0.2, 3));
    }
  };
  
  const handleZoomOut = () => {
    if (transformRef.current) {
      transformRef.current.zoomOut(0.2);
      setZoom(prev => Math.max(prev - 0.2, 0.5));
    }
  };
  
  // Rotation handlers
  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };
  
  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <Paper sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        p: 0.5, 
        boxShadow: 'none', 
        borderBottom: 1, 
        borderColor: 'divider' 
      }}>
        <Box>
          <Tooltip title="Zoom out">
            <span>
              <IconButton 
                size="small" 
                onClick={handleZoomOut} 
                disabled={zoom <= 0.5}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Typography variant="body2" component="span" sx={{ mx: 1 }}>
            {Math.round(zoom * 100)}%
          </Typography>
          
          <Tooltip title="Zoom in">
            <span>
              <IconButton 
                size="small" 
                onClick={handleZoomIn} 
                disabled={zoom >= 3}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box>
          <Tooltip title="Rotate left">
            <span>
              <IconButton size="small" onClick={handleRotateLeft}>
                <RotateLeftIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Rotate right">
            <span>
              <IconButton size="small" onClick={handleRotateRight}>
                <RotateRightIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Image Viewer */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
        p: 2,
      }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">
            Error loading image: {error.message}
          </Typography>
        ) : (
          <TransformWrapper
            ref={transformRef}
            initialScale={zoom}
            minScale={0.5}
            maxScale={3}
            wheel={{ step: 0.1 }}
          >
            <TransformComponent>
              <Box
                component="img"
                src={imageUrl}
                alt="Preview"
                onLoad={handleImageLoad}
                onError={handleImageError}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedImageViewer; 