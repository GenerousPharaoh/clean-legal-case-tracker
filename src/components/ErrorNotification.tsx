import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertProps, 
  IconButton, 
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ErrorCategory } from '../utils/authErrorHandler';

// Generate a unique ID for each error
const generateErrorId = (): string => {
  return `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Interface for error notifications
interface ErrorNotificationData {
  id: string;
  message: string;
  category: ErrorCategory;
  details?: string;
  timestamp: Date;
  dismissable: boolean;
}

// Map ErrorCategory to AlertProps severity
const getSeverityFromCategory = (category: ErrorCategory): AlertProps['severity'] => {
  switch (category) {
    case ErrorCategory.AUTH:
    case ErrorCategory.PERMISSION:
      return 'error';
    case ErrorCategory.VALIDATION:
      return 'warning';
    case ErrorCategory.NETWORK:
      return 'info';
    default:
      return 'error';
  }
};

// Main ErrorNotification component
const ErrorNotification: React.FC = () => {
  const [errors, setErrors] = useState<ErrorNotificationData[]>([]);
  
  // Effect to check for stored auth errors on mount
  useEffect(() => {
    try {
      const storedError = sessionStorage.getItem('auth_error');
      if (storedError) {
        const parsedError = JSON.parse(storedError);
        // Add the stored error
        setErrors(prev => [
          ...prev, 
          {
            id: generateErrorId(),
            message: parsedError.message,
            category: parsedError.category,
            details: parsedError.details,
            timestamp: new Date(parsedError.timestamp),
            dismissable: true
          }
        ]);
        // Remove from storage after displaying
        sessionStorage.removeItem('auth_error');
      }
    } catch (e) {
      console.error('Failed to parse stored auth error:', e);
    }
  }, []);
  
  // Listen for error notification events
  useEffect(() => {
    const handleErrorEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const errorData = customEvent.detail;
      
      // Add the new error
      setErrors(prev => [
        ...prev,
        {
          id: generateErrorId(),
          message: errorData.message,
          category: errorData.category || ErrorCategory.GENERAL,
          details: errorData.details,
          timestamp: new Date(),
          dismissable: errorData.dismissable !== false
        }
      ]);
    };
    
    // Add event listener for custom error events
    window.addEventListener('error-notification', handleErrorEvent);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('error-notification', handleErrorEvent);
    };
  }, []);
  
  // Handle error dismissal
  const handleClose = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };
  
  // If there are no errors, don't render anything
  if (errors.length === 0) {
    return null;
  }
  
  return (
    <>
      {errors.map((error) => (
        <Snackbar
          key={error.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={error.dismissable ? () => handleClose(error.id) : undefined}
          autoHideDuration={error.category === ErrorCategory.AUTH ? null : 6000}
        >
          <Alert
            severity={getSeverityFromCategory(error.category)}
            action={
              error.dismissable ? (
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => handleClose(error.id)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              ) : null
            }
            sx={{ width: '100%', maxWidth: 600 }}
          >
            <Typography variant="subtitle1" component="div" fontWeight="bold">
              {error.message}
            </Typography>
            {error.details && (
              <Box mt={1}>
                <Typography variant="body2">
                  {error.details}
                </Typography>
              </Box>
            )}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default ErrorNotification; 