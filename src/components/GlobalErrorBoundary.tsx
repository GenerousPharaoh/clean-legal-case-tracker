import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
 * GlobalErrorBoundary - Catches and displays React errors
 * 
 * This component catches errors in any child components and displays
 * a user-friendly error message instead of crashing the whole app.
 */
class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  // This lifecycle method is invoked after an error has been thrown
  static getDerivedStateFromError(_: Error): State {
    return { hasError: true, error: _, errorInfo: null };
  }

  // This lifecycle method catches errors and error info
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log the error to the console
    console.error('Error caught by GlobalErrorBoundary:', error, errorInfo);
    
    // You can also send this to an error reporting service
    if (window.__fixReactEvents) {
      // Try to apply our emergency React event fix
      try {
        window.__fixReactEvents(document);
        console.log('Applied emergency fix in error boundary');
      } catch (err) {
        console.error('Failed to apply emergency fix:', err);
      }
    }
  }

  // Reset the error state, which will attempt to re-render the children
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    // If there's no error, render the children normally
    if (!this.state.hasError) {
      return this.props.children;
    }

    // If a custom fallback is provided, use it
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Otherwise, show the default error UI
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: 'background.paper'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
          </Box>

          <Typography variant="h4" gutterBottom color="error">
            Something went wrong
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            The application encountered an unexpected error. We've logged this issue and are working to fix it.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReset}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                Error Details (Development Only):
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '0.875rem'
                }}
              >
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    );
  }
}

// Add a type definition to window for our fixReactEvents function
declare global {
  interface Window {
    __fixReactEvents?: (element: any) => void;
  }
}

export default GlobalErrorBoundary;
