import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Application error:', error, errorInfo);
    
    // You can send this to your error tracking service here
    // e.g., Sentry, LogRocket, etc.
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    // Clear the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Attempt to reload the app
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4
            }}
          >
            <Paper 
              elevation={3}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                The application has encountered an unexpected error.
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={this.handleReset}
                  sx={{ mr: 2 }}
                >
                  Return to Home
                </Button>
              </Box>
              
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 4, width: '100%' }}>
                  <Typography variant="subtitle2" align="left" gutterBottom>
                    Error details (visible in development only):
                  </Typography>
                  
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'error.light', 
                      color: 'error.contrastText',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}
                  >
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {this.state.error?.toString()}
                    </Typography>
                    
                    {this.state.errorInfo && (
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                        Component Stack: {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
