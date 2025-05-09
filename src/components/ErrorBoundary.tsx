import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches errors in its children and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise use the default error UI
      return (
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3,
          }}
        >
          <Paper 
            elevation={3}
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              We're sorry, but an error occurred while rendering this component.
            </Typography>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: 'grey.100', 
                  borderRadius: 1,
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: 300,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  mb: 3,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Error details:
                </Typography>
                <Typography variant="body2" component="div" sx={{ color: 'error.main' }}>
                  {this.state.error.toString()}
                </Typography>
                
                {this.state.errorInfo && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Component stack:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 12,
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 