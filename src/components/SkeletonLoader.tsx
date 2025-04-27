import React from 'react';
import { Skeleton, Box, Card, CardContent, Stack, Grid, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

type SkeletonVariant = 
  | 'text' 
  | 'circular' 
  | 'rectangular' 
  | 'rounded' 
  | 'card' 
  | 'file' 
  | 'list' 
  | 'editor' 
  | 'panel' 
  | 'dashboard';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: 'pulse' | 'wave';
  dense?: boolean;
  withAction?: boolean;
  showImage?: boolean;
}

/**
 * Enhanced Skeleton Loader component with various presets for different content types
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse',
  dense = false,
  withAction = true,
  showImage = false,
}) => {
  const theme = useTheme();
  
  const renderSkeleton = (index: number) => {
    switch (variant) {
      case 'text':
        return (
          <Skeleton
            key={index}
            variant="text"
            width={width || '100%'}
            height={height || 20}
            animation={animation}
            sx={{ mb: dense ? 0.5 : 1 }}
          />
        );
      
      case 'circular':
        return (
          <Skeleton
            key={index}
            variant="circular"
            width={width || 40}
            height={height || 40}
            animation={animation}
            sx={{ mb: dense ? 0.5 : 1 }}
          />
        );
      
      case 'rectangular':
        return (
          <Skeleton
            key={index}
            variant="rectangular"
            width={width || '100%'}
            height={height || 100}
            animation={animation}
            sx={{ mb: dense ? 0.5 : 1, borderRadius: 1 }}
          />
        );
      
      case 'rounded':
        return (
          <Skeleton
            key={index}
            variant="rounded"
            width={width || '100%'}
            height={height || 100}
            animation={animation}
            sx={{ mb: dense ? 0.5 : 1 }}
          />
        );
      
      case 'card':
        return (
          <Card 
            key={index} 
            sx={{ 
              mb: dense ? 1 : 2,
              width: width || '100%', 
              height: height,
              boxShadow: theme.shadows[1],
              overflow: 'hidden',
            }}
          >
            {showImage && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height={140}
                animation={animation}
              />
            )}
            <CardContent sx={{ p: dense ? 1 : 2 }}>
              <Skeleton variant="text" width="60%" height={28} animation={animation} />
              <Skeleton variant="text" width="90%" animation={animation} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="80%" animation={animation} />
              {!dense && <Skeleton variant="text" width="40%" animation={animation} />}
              
              {withAction && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Skeleton variant="rounded" width={80} height={36} animation={animation} />
                  <Skeleton variant="rounded" width={80} height={36} animation={animation} />
                </Box>
              )}
            </CardContent>
          </Card>
        );
      
      case 'file':
        return (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: dense ? 0.5 : 1, 
              mb: dense ? 0.5 : 1,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            <Skeleton variant="rounded" width={40} height={40} animation={animation} />
            <Box sx={{ ml: 1.5, flex: 1 }}>
              <Skeleton variant="text" width="70%" height={24} animation={animation} />
              <Skeleton variant="text" width="40%" height={16} animation={animation} />
            </Box>
            {withAction && (
              <Skeleton variant="circular" width={32} height={32} animation={animation} />
            )}
          </Box>
        );
      
      case 'list':
        return (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: dense ? 0.5 : 1, 
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {showImage && (
              <Skeleton 
                variant="rounded" 
                width={32} 
                height={32} 
                animation={animation} 
                sx={{ mr: 1.5, flexShrink: 0 }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={dense ? 16 : 20} animation={animation} />
              {!dense && (
                <Skeleton variant="text" width="50%" height={16} animation={animation} />
              )}
            </Box>
            {withAction && (
              <Skeleton variant="circular" width={24} height={24} animation={animation} />
            )}
          </Box>
        );
      
      case 'editor':
        return (
          <Box key={index} sx={{ width: '100%' }}>
            <Skeleton 
              variant="rectangular" 
              width="100%"
              height={40}
              animation={animation}
              sx={{ mb: 1, borderRadius: '4px 4px 0 0' }}
            />
            <Skeleton 
              variant="rectangular" 
              width="100%"
              height={height || 400}
              animation={animation}
              sx={{ borderRadius: '0 0 4px 4px' }}
            />
          </Box>
        );
      
      case 'panel':
        return (
          <Box 
            key={index} 
            sx={{ 
              width: width || '100%',
              height: height || 'auto',
              display: 'flex', 
              flexDirection: 'column',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {/* Panel header */}
            <Box sx={{ 
              p: 1.5, 
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Skeleton variant="text" width={150} height={24} animation={animation} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="circular" width={32} height={32} animation={animation} />
                <Skeleton variant="circular" width={32} height={32} animation={animation} />
              </Box>
            </Box>
            
            {/* Panel content */}
            <Box sx={{ p: 2, flex: 1 }}>
              <Skeleton variant="text" width="90%" animation={animation} />
              <Skeleton variant="text" width="80%" animation={animation} />
              <Skeleton variant="text" width="85%" animation={animation} />
              <Skeleton variant="text" width="70%" animation={animation} />
              
              <Box sx={{ mt: 3 }}>
                <Skeleton variant="rectangular" width="100%" height={100} animation={animation} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
          </Box>
        );
        
      case 'dashboard':
        return (
          <Grid container spacing={2} key={index}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Skeleton variant="text" width="70%" height={24} animation={animation} />
                <Skeleton variant="text" width="40%" height={40} animation={animation} sx={{ mt: 1 }} />
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Skeleton variant="text" width="70%" height={24} animation={animation} />
                <Skeleton variant="text" width="40%" height={40} animation={animation} sx={{ mt: 1 }} />
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Skeleton variant="text" width="70%" height={24} animation={animation} />
                <Skeleton variant="text" width="40%" height={40} animation={animation} sx={{ mt: 1 }} />
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Skeleton variant="text" width="70%" height={24} animation={animation} />
                <Skeleton variant="text" width="40%" height={40} animation={animation} sx={{ mt: 1 }} />
              </Card>
            </Grid>
            
            {/* Main chart */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Skeleton variant="text" width="50%" height={32} animation={animation} />
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={250} 
                  animation={animation}
                  sx={{ mt: 2, borderRadius: 1 }}
                />
              </Card>
            </Grid>
            
            {/* Side panel */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Skeleton variant="text" width="70%" height={32} animation={animation} />
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Skeleton variant="rectangular" width="100%" height={50} animation={animation} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={50} animation={animation} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={50} animation={animation} sx={{ borderRadius: 1 }} />
                </Stack>
              </Card>
            </Grid>
          </Grid>
        );
      
      default:
        return (
          <Skeleton
            key={index}
            variant="text"
            width={width || '100%'}
            height={height || 20}
            animation={animation}
            sx={{ mb: dense ? 0.5 : 1 }}
          />
        );
    }
  };
  
  return (
    <Box sx={{ width: width || '100%' }}>
      {Array(count).fill(0).map((_, i) => renderSkeleton(i))}
    </Box>
  );
};

export default SkeletonLoader;