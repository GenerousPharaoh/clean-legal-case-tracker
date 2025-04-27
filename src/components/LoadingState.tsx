import React from 'react';
import { Box, CircularProgress, Typography, Paper, LinearProgress, SxProps, Theme } from '@mui/material';
import { animations } from '../styles/visualRefactor';

export type LoadingType = 'circular' | 'linear' | 'skeleton' | 'dots';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  fullHeight?: boolean;
  type?: LoadingType;
  value?: number; // For determinate progress
  overlay?: boolean;
  contained?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * LoadingState - A consistent component for displaying loading states
 * 
 * Provides various loading indicators with consistent styling and optional messages,
 * can be used as a full-screen overlay or within containers.
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
  fullHeight = false,
  type = 'circular',
  value,
  overlay = false, 
  contained = false,
  sx = {}
}) => {
  // Sizing presets
  const getSizing = () => {
    switch (size) {
      case 'small':
        return {
          progressSize: 24,
          fontSize: '0.875rem',
          padding: 2
        };
      case 'large':
        return {
          progressSize: 60,
          fontSize: '1.125rem',
          padding: 4
        };
      default: // medium
        return {
          progressSize: 40,
          fontSize: '1rem',
          padding: 3
        };
    }
  };

  const { progressSize, fontSize, padding } = getSizing();

  // Loading indicator based on type
  const renderLoadingIndicator = () => {
    switch (type) {
      case 'linear':
        return (
          <LinearProgress
            variant={value !== undefined ? 'determinate' : 'indeterminate'}
            value={value}
            sx={{
              width: '100%',
              maxWidth: 300,
              height: size === 'small' ? 4 : (size === 'large' ? 8 : 6),
              borderRadius: 1,
              mb: message ? 2 : 0
            }}
          />
        );
      
      case 'dots':
        return (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center',
            height: progressSize,
            mb: message ? 2 : 0
          }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: size === 'small' ? 8 : (size === 'large' ? 16 : 12),
                  height: size === 'small' ? 8 : (size === 'large' ? 16 : 12),
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  opacity: 0.7,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.3}s`,
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(0.75)', opacity: 0.5 },
                    '50%': { transform: 'scale(1)', opacity: 1 }
                  }
                }}
              />
            ))}
          </Box>
        );
      
      case 'skeleton':
        // Implement skeleton loading if needed
        return (
          <Box sx={{ 
            width: '100%', 
            maxWidth: 300, 
            height: progressSize,
            mb: message ? 2 : 0
          }}>
            {/* Add skeleton loading elements here */}
          </Box>
        );
      
      case 'circular':
      default:
        return (
          <CircularProgress
            size={progressSize}
            variant={value !== undefined ? 'determinate' : 'indeterminate'}
            value={value}
            sx={{ mb: message ? 2 : 0 }}
          />
        );
    }
  };

  // Container component based on settings
  const Container = contained ? Paper : Box;

  // Content to render
  const content = (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: contained ? padding : 0,
        borderRadius: contained ? 2 : 0,
        boxShadow: contained ? 1 : 'none',
        minWidth: contained ? 100 : 'auto',
        backgroundColor: overlay ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
        backdropFilter: overlay ? 'blur(4px)' : 'none',
        textAlign: 'center',
        height: fullHeight ? '100%' : 'auto',
        ...animations.fadeIn,
        ...sx
      }}
    >
      {renderLoadingIndicator()}
      
      {message && (
        <Typography
          variant={size === 'small' ? 'caption' : 'body2'}
          color="text.secondary"
          sx={{
            fontSize,
            maxWidth: 300,
            lineHeight: 1.4
          }}
        >
          {message}
        </Typography>
      )}
    </Container>
  );

  // For full screen loading
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: overlay ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: overlay ? 'blur(5px)' : 'none',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingState;
