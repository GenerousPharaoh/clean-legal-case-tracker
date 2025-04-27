import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';

type LoadingVariant = 
  | 'list' 
  | 'card' 
  | 'editor' 
  | 'file-content' 
  | 'panel-content' 
  | 'thumbnail';

interface LoadingSkeletonProps {
  variant: LoadingVariant;
  count?: number;
  height?: number | string;
  width?: number | string;
  withTitle?: boolean;
  withAction?: boolean;
  dense?: boolean;
}

/**
 * LoadingSkeleton - A consistent loading placeholder component
 * 
 * Provides standardized skeleton loading placeholders for different UI elements
 * with smooth animations and sizing that matches the actual content.
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant,
  count = 1,
  height,
  width,
  withTitle = false,
  withAction = false,
  dense = false,
}) => {
  const renderListItems = () => {
    return Array(count)
      .fill(null)
      .map((_, index) => (
        <Box 
          key={index} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            py: dense ? 0.5 : 1,
            px: 2,
            mb: dense ? 0.5 : 1,
          }}
        >
          {withAction && (
            <Skeleton 
              variant="circular" 
              width={24} 
              height={24} 
              sx={{ mr: 2, flexShrink: 0 }} 
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="90%" height={dense ? 18 : 24} />
            {!dense && <Skeleton variant="text" width="60%" height={16} />}
          </Box>
          {withAction && (
            <Skeleton 
              variant="circular" 
              width={24} 
              height={24} 
              sx={{ ml: 1, flexShrink: 0 }} 
            />
          )}
        </Box>
      ));
  };

  const renderCard = () => {
    return (
      <Box
        sx={{
          p: 2,
          mb: 2,
          width: width || '100%',
          height: height,
        }}
      >
        {withTitle && (
          <Box sx={{ mb: 1 }}>
            <Skeleton variant="text" width="70%" height={24} />
          </Box>
        )}
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 1, borderRadius: 1 }} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
        {withAction && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
          </Box>
        )}
      </Box>
    );
  };

  const renderEditor = () => {
    return (
      <Box sx={{ width: width || '100%', height: height || '100%' }}>
        {withTitle && (
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={200} height={32} />
          </Box>
        )}
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={height || 'calc(100vh - 220px)'} 
          sx={{ borderRadius: 1 }} 
          animation="wave"
        />
      </Box>
    );
  };

  const renderFileContent = () => {
    return (
      <Box sx={{ width: width || '100%', height: height }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={200} 
          sx={{ mb: 2, borderRadius: 1 }} 
        />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="80%" />
      </Box>
    );
  };

  const renderPanelContent = () => {
    return (
      <Box sx={{ width: width || '100%', height: height || '100%', p: 1 }}>
        <Box sx={{ p: 1, mb: 2 }}>
          <Skeleton variant="text" width={150} height={32} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="calc(100% - 100px)" 
          sx={{ borderRadius: 1 }} 
        />
      </Box>
    );
  };

  const renderThumbnail = () => {
    return (
      <Box 
        sx={{ 
          width: width || 150, 
          height: height || 150, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          m: 1,
        }}
      >
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={height || 120} 
          sx={{ borderRadius: 1, mb: 1 }} 
        />
        <Skeleton variant="text" width="80%" height={20} />
      </Box>
    );
  };

  const renderContent = () => {
    switch (variant) {
      case 'list':
        return renderListItems();
      case 'card':
        return renderCard();
      case 'editor':
        return renderEditor();
      case 'file-content':
        return renderFileContent();
      case 'panel-content':
        return renderPanelContent();
      case 'thumbnail':
        return renderThumbnail();
      default:
        return (
          <Typography color="error">
            Invalid skeleton variant: {variant}
          </Typography>
        );
    }
  };

  return (
    <Box 
      sx={{ 
        width: width || '100%', 
        overflow: 'hidden',
        opacity: 0.9, 
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {renderContent()}
    </Box>
  );
};

export default LoadingSkeleton; 