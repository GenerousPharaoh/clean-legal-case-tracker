import React, { useState, useEffect } from 'react';
import { Box, Skeleton, Fade } from '@mui/material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: string | number;
  blurHash?: string;
  fallbackIcon?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  placeholderStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}

/**
 * ProgressiveImage - A component that shows a loading skeleton or blur hash
 * while an image is loading, and handles errors with a fallback icon.
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  width = '100%',
  height = '100%',
  objectFit = 'cover',
  borderRadius = 0,
  blurHash,
  fallbackIcon = <BrokenImageIcon />,
  onLoad,
  onError,
  placeholderStyle,
  containerStyle,
  imgStyle,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setIsError(false);
    setImgSrc(null);

    // Pre-load the image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setIsError(true);
      setIsLoading(false);
      if (onError) onError();
    };

    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isError ? '#f5f5f5' : 'transparent',
        ...containerStyle,
      }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius,
            ...placeholderStyle,
          }}
          animation="wave"
        />
      )}

      {/* Blur hash placeholder (if provided) */}
      {isLoading && blurHash && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${blurHash})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
            borderRadius,
            ...placeholderStyle,
          }}
        />
      )}

      {/* Error state */}
      {isError && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'text.disabled',
            fontSize: '2rem',
          }}
        >
          {fallbackIcon}
        </Box>
      )}

      {/* Actual image */}
      {imgSrc && !isError && (
        <Fade in={!isLoading} timeout={300}>
          <Box
            component="img"
            src={imgSrc}
            alt={alt}
            sx={{
              width: '100%',
              height: '100%',
              objectFit,
              borderRadius,
              ...imgStyle,
            }}
          />
        </Fade>
      )}
    </Box>
  );
};

export default ProgressiveImage;
