import React, { forwardRef } from 'react';
import { 
  Snackbar, 
  SnackbarContent, 
  Box, 
  Typography, 
  IconButton, 
  SvgIcon,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { animated, useTransition } from 'react-spring';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'security' | 'default';
export type ToastPosition = 'top' | 'bottom';
export type ToastAlignment = 'left' | 'center' | 'right';

export interface ToastProps {
  open: boolean;
  message: string;
  details?: string;
  variant?: ToastVariant;
  autoHideDuration?: number;
  onClose?: () => void;
  position?: ToastPosition;
  alignment?: ToastAlignment;
  action?: React.ReactNode;
  showCloseButton?: boolean;
  isImportant?: boolean;
}

// Create an animated wrapper for Snackbar
const AnimatedSnackbar = animated(forwardRef((props: any, ref: any) => (
  <Snackbar ref={ref} {...props} />
)));

/**
 * ToastNotification - Modern toast notification system
 * 
 * Provides consistent, animated, and visually appealing notifications
 * with various states and positioning options.
 * Now using react-spring for animations.
 */
const ToastNotification: React.FC<ToastProps> = ({
  open,
  message,
  details,
  variant = 'default',
  autoHideDuration = 5000,
  onClose,
  position = 'bottom',
  alignment = 'center',
  action,
  showCloseButton = true,
  isImportant = false
}) => {
  const theme = useTheme();
  
  // Get variant-specific properties
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          color: theme.palette.success.main,
          bgColor: theme.palette.mode === 'dark' 
            ? 'rgba(76, 175, 80, 0.15)' 
            : 'rgba(76, 175, 80, 0.08)',
          borderColor: theme.palette.success.main
        };
      case 'error':
        return {
          icon: ErrorIcon,
          color: theme.palette.error.main,
          bgColor: theme.palette.mode === 'dark' 
            ? 'rgba(244, 67, 54, 0.15)' 
            : 'rgba(244, 67, 54, 0.08)',
          borderColor: theme.palette.error.main
        };
      case 'warning':
        return {
          icon: WarningIcon,
          color: theme.palette.warning.main,
          bgColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 152, 0, 0.15)' 
            : 'rgba(255, 152, 0, 0.08)',
          borderColor: theme.palette.warning.main
        };
      case 'info':
        return {
          icon: InfoIcon,
          color: theme.palette.info.main,
          bgColor: theme.palette.mode === 'dark' 
            ? 'rgba(33, 150, 243, 0.15)' 
            : 'rgba(33, 150, 243, 0.08)',
          borderColor: theme.palette.info.main
        };
      case 'security':
        return {
          icon: LockIcon,
          color: theme.palette.mode === 'dark' ? '#9c27b0' : '#7b1fa2',
          bgColor: theme.palette.mode === 'dark' 
            ? 'rgba(156, 39, 176, 0.15)' 
            : 'rgba(156, 39, 176, 0.08)',
          borderColor: '#9c27b0'
        };
      default:
        return {
          icon: NotificationsIcon,
          color: theme.palette.grey[700],
          bgColor: theme.palette.mode === 'dark' 
            ? 'rgba(200, 200, 200, 0.15)' 
            : 'rgba(200, 200, 200, 0.12)',
          borderColor: theme.palette.divider
        };
    }
  };
  
  const variantConfig = getVariantConfig();
  const Icon = variantConfig.icon;

  // Create transitions for the toast animation
  const transitions = useTransition(open ? [true] : [], {
    from: { opacity: 0, y: position === 'top' ? -20 : 20 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: position === 'top' ? -20 : 20 },
    config: { tension: 280, friction: 24 },
  });

  return (
    <>
      {transitions((style, item) => (
        item && (
          <AnimatedSnackbar
            open={open}
            autoHideDuration={isImportant ? null : autoHideDuration} // Important toasts don't auto-hide
            onClose={onClose}
            anchorOrigin={{ 
              vertical: position, 
              horizontal: alignment 
            }}
            style={{
              opacity: style.opacity,
              transform: style.y.to(y => `translate3d(0,${y}px,0)`),
              maxWidth: '100%',
              width: 'auto',
              ...theme.breakpoints.up('sm') && {
                maxWidth: 'min(600px, calc(100% - 40px))'
              }
            }}
          >
            <SnackbarContent
              message={
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: details ? 'flex-start' : 'center'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: `${variantConfig.color}20`,
                      color: variantConfig.color,
                      p: 0.8,
                      mr: 1.5,
                      mt: details ? 0.5 : 0
                    }}
                  >
                    <SvgIcon 
                      component={Icon} 
                      fontSize="small" 
                      sx={{ width: 20, height: 20 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {message}
                    </Typography>
                    {details && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        {details}
                      </Typography>
                    )}
                  </Box>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {action}
                  {showCloseButton && (
                    <IconButton
                      size="small"
                      aria-label="close"
                      color="inherit"
                      onClick={onClose}
                      sx={{ 
                        ml: action ? 1 : 0,
                        color: 'text.secondary',
                        opacity: 0.7,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
              sx={{
                backgroundColor: theme.palette.background.paper,
                backgroundImage: 'none',
                color: theme.palette.text.primary,
                boxShadow: theme.shadows[3],
                borderRadius: 2,
                border: '1px solid',
                borderColor: variantConfig.borderColor,
                borderLeftWidth: 4,
                minWidth: '280px',
                maxWidth: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': isImportant ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  backgroundColor: variantConfig.color,
                  animation: 'pulse 2s infinite'
                } : {},
                '@keyframes pulse': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 }
                }
              }}
            />
          </AnimatedSnackbar>
        )
      ))}
    </>
  );
};

export default ToastNotification;
