import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertColor, 
  LinearProgress,
  Box,
  Typography,
  useTheme,
  AlertTitle,
  Paper,
  IconButton
} from '@mui/material';

// Import animation styles for consistency
import { animations } from '../styles/visualRefactor';

// Import safe transition component
import { Fade } from './SafeTransitions';

// Define message types
export type MessageType = 'success' | 'error' | 'info' | 'warning';

// Feedback message props
export interface FeedbackMessageProps {
  open: boolean;
  message: string;
  title?: string;
  type?: MessageType;
  autoHideDuration?: number;
  onClose?: () => void;
  showProgress?: boolean;
  action?: React.ReactNode;
  inline?: boolean;
}

/**
 * FeedbackMessage - A consistent component for showing feedback, notifications and errors
 * 
 * Provides both inline alerts and toast notifications with consistent styling,
 * optional progress indicators, and standardized transitions.
 */
const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  open,
  message,
  title,
  type = 'info',
  autoHideDuration = 5000,
  onClose,
  showProgress = false,
  action,
  inline = false
}) => {
  const [progress, setProgress] = useState(0);
  const theme = useTheme();

  // Handle progress animation
  useEffect(() => {
    if (!showProgress || !open) {
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(100, oldProgress + (100 / (autoHideDuration / 100)));
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [showProgress, open, autoHideDuration]);

  // Get appropriate icon color based on the message type
  const getColorByType = () => {
    switch(type) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': 
      default: return theme.palette.info.main;
    }
  };

  // For inline messages
  if (inline) {
    return (
      <Fade in={open} timeout={300}>
        <Alert 
          severity={type as AlertColor} 
          variant="outlined"
          sx={{ 
            width: '100%', 
            mb: 2, 
            alignItems: 'center',
            borderWidth: '1px',
            borderLeftWidth: '4px',
            py: 1,
            transition: theme.transitions.create(['opacity', 'transform']),
            ...animations.fadeIn,
            boxShadow: 1
          }}
          action={action}
        >
          {title && <AlertTitle sx={{ fontWeight: 500 }}>{title}</AlertTitle>}
          <Typography variant="body2" color="text.primary">{message}</Typography>
          {showProgress && (
            <LinearProgress 
              sx={{
                 mt: 1, 
                 height: 4,
                 borderRadius: 2,
                 [`& .MuiLinearProgress-bar`]: {
                   transition: `transform ${autoHideDuration * 0.001}s linear !important` 
                 }
              }} 
              variant="determinate" 
              value={progress} 
              color={type as 'success' | 'error' | 'info' | 'warning'} 
            />
          )}
        </Alert>
      </Fade>
    );
  }

  // For snackbar toast notifications
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      TransitionComponent={Fade}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        minWidth: { xs: '90%', sm: 'auto' },
        '& .MuiPaper-root': {
          borderRadius: 2,
          minWidth: { xs: '240px', sm: '320px' },
          maxWidth: '420px',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <Alert 
        severity={type as AlertColor} 
        variant="filled" 
        sx={{ 
          width: '100%', 
          alignItems: 'flex-start',
          py: 1,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            pt: title ? 1.3 : 0.75,
            opacity: 0.9
          }
        }}
        action={action}
      >
        <Box sx={{ minWidth: '200px' }}>
          {title && (
            <AlertTitle sx={{ fontWeight: 500, mb: 0.5 }}>{title}</AlertTitle>
          )}
          <Typography variant="body2">{message}</Typography>
          {showProgress && (
            <LinearProgress 
              sx={{ 
                mt: 1, 
                borderRadius: 2, 
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                [`& .MuiLinearProgress-bar`]: {
                   transition: `transform ${autoHideDuration * 0.001}s linear !important` 
                }
              }} 
              variant="determinate" 
              value={progress} 
              color="inherit"
            />
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default FeedbackMessage; 