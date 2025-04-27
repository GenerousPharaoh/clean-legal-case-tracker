import React, { useState, useEffect, useCallback } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertTitle, 
  IconButton, 
  Box, 
  Typography,
  Stack,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { v4 as uuidv4 } from 'uuid';
import { 
  ErrorCategory, 
  ErrorNotification, 
  ErrorContext,
  DefaultErrorContext
} from '../utils/authErrorHandler';

// Assign color and severity based on error category
const getCategoryProps = (category: ErrorCategory) => {
  switch (category) {
    case ErrorCategory.AUTH:
      return { color: 'error', severity: 'error', icon: <ErrorIcon /> };
    case ErrorCategory.PERMISSION:
      return { color: 'error', severity: 'error', icon: <ErrorIcon /> };
    case ErrorCategory.DATABASE:
      return { color: 'warning', severity: 'warning', icon: <WarningIcon /> };
    case ErrorCategory.NETWORK:
      return { color: 'warning', severity: 'warning', icon: <WarningIcon /> };
    case ErrorCategory.GENERAL:
    default:
      return { color: 'info', severity: 'info', icon: <InfoIcon /> };
  }
};

const ErrorNotificationManager: React.FC = () => {
  const [errors, setErrors] = useState<ErrorNotification[]>([]);
  
  // Add error to the list
  const addError = useCallback((error: Omit<ErrorNotification, 'id' | 'timestamp'>) => {
    setErrors(prevErrors => [
      ...prevErrors, 
      { 
        ...error, 
        id: uuidv4(), 
        timestamp: new Date() 
      }
    ]);
  }, []);
  
  // Dismiss an error by ID
  const dismissError = useCallback((id: string) => {
    setErrors(prevErrors => 
      prevErrors.map(error => 
        error.id === id 
          ? { ...error, dismissed: true } 
          : error
      )
    );
    
    // After animation time, remove it completely
    setTimeout(() => {
      setErrors(prevErrors => 
        prevErrors.filter(error => error.id !== id)
      );
    }, 500);
  }, []);
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  // Auto-dismiss errors after timeout (except for critical ones)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    errors.forEach(error => {
      if (error.dismissable && !error.dismissed) {
        const timer = setTimeout(() => {
          dismissError(error.id);
        }, 6000); // 6 seconds
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [errors, dismissError]);
  
  // Handle global error events from outside React components
  useEffect(() => {
    // Add error context to window for non-React error handlers
    (window as any).__ERROR_CONTEXT__ = { addError, dismissError, clearErrors };
    
    const handleGlobalError = (e: CustomEvent) => {
      const { message, category, details, dismissable = true } = e.detail;
      
      addError({
        message,
        category: category || ErrorCategory.GENERAL,
        details,
        dismissable
      });
    };
    
    // Add global event listener for error notifications
    window.addEventListener('error-notification', handleGlobalError as EventListener);
    
    return () => {
      // Clean up global event listener and context
      window.removeEventListener('error-notification', handleGlobalError as EventListener);
      delete (window as any).__ERROR_CONTEXT__;
    };
  }, [addError, dismissError, clearErrors]);
  
  // Don't render anything if no errors
  if (errors.length === 0) {
    return null;
  }
  
  return (
    <ErrorContext.Provider value={{ errors, addError, dismissError, clearErrors }}>
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          zIndex: 9999,
          maxWidth: '100%',
          width: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {errors.map((error) => {
          const { color, severity, icon } = getCategoryProps(error.category);
          
          return (
            <Snackbar
              key={error.id}
              open={!error.dismissed}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              sx={{ position: 'static', mb: 1 }}
            >
              <Alert 
                severity={severity as any}
                variant="filled"
                icon={icon}
                sx={{ width: '100%' }}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => dismissError(error.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                <AlertTitle>{error.category.charAt(0).toUpperCase() + error.category.slice(1)} Error</AlertTitle>
                <Typography variant="body2">
                  {error.message}
                </Typography>
                {error.details && (
                  <Box sx={{ mt: 1, fontSize: '0.75rem', opacity: 0.8 }}>
                    {error.details}
                  </Box>
                )}
              </Alert>
            </Snackbar>
          );
        })}
        
        {errors.length > 1 && (
          <Stack 
            direction="row" 
            spacing={1} 
            justifyContent="flex-end"
            sx={{ mt: 1 }}
          >
            <Button 
              size="small"
              variant="outlined"
              onClick={clearErrors}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Dismiss All
            </Button>
          </Stack>
        )}
      </Box>
    </ErrorContext.Provider>
  );
};

export default ErrorNotificationManager; 