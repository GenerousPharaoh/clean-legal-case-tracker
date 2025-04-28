import React, { useEffect, useState, Suspense } from 'react';
import { CssBaseline } from '@mui/material';
import { useThemeContext } from './context/ThemeContext';
import { pdfjs } from 'react-pdf';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { supabase } from './supabaseClient';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import AuthErrorHandler from './components/AuthErrorHandler';
import ErrorNotificationManager from './components/ErrorNotificationManager';
import { reportError, ErrorCategory } from './utils/authErrorHandler';
import AppRoutes from './AppRoutes';
import TinyMCEScriptLoader from './components/TinyMCEScriptLoader';

// We're using AppRoutes.tsx now which handles lazy loading
// const LoginPage = lazy(() => import('./pages/LoginPage'));
// const SignupPage = lazy(() => import('./pages/SignupPage'));
// const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));

// Set PDF.js worker path for document viewer
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}
  >
    <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
    <Typography variant="h6" color="textSecondary">
      Loading application...
    </Typography>
  </Box>
);

// Simple error page component
const ErrorPage = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      p: 3,
      textAlign: 'center'
    }}
  >
    <Typography variant="h5" color="error" gutterBottom>
      Something went wrong
    </Typography>
    <Typography paragraph sx={{ maxWidth: 600, mb: 3 }}>
      We encountered an unexpected error. The technical team has been notified.
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={() => window.location.reload()}
    >
      Refresh Page
    </Button>
  </Box>
);

// Auth error fallback component
const AuthErrorMessage = ({ message, onRetry }: { message: string | null, onRetry: () => void }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      p: 3,
      textAlign: 'center' 
    }}
  >
    <Typography variant="h5" color="error" gutterBottom>
      Authentication Error
    </Typography>
    <Typography paragraph sx={{ maxWidth: 600, mb: 3 }}>
      {message || 'An error occurred during authentication. Please try again.'}
    </Typography>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onRetry}
    >
      Retry
    </Button>
  </Box>
);

// Protected routes are now handled in AppRoutes.tsx

const App: React.FC = () => {
  // Use our enhanced useAuth hook which manages the auth store internally
  const { loading } = useAuth();
  const [appInitialized, setAppInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Initialize theme with dark/light mode support
  const { mode, theme } = useThemeContext();
  
  // Set app as initialized once auth finishes loading
  useEffect(() => {
    if (!loading) {
      setAppInitialized(true);
    }
  }, [loading]);
  
  // Handle auth retry
  const handleAuthRetry = () => {
    setAuthError(null);
    window.location.reload();
  };
  
  // Show error state if auth initialization failed
  if (authError && appInitialized) {
    return <AuthErrorMessage message={authError} onRetry={handleAuthRetry} />;
  }
  
  // Show loading state if app is not yet initialized
  if (!appInitialized) {
    return <LoadingFallback />;
  }
  
  return (
    <>
      {/* Load TinyMCE correctly - either CDN or self-hosted */}
      <TinyMCEScriptLoader useCDN={false} />
      
      <CssBaseline />
      
      {/* Implementing hardened error boundary as suggested */}
      <GlobalErrorBoundary>
        <AuthErrorHandler />
        <ErrorNotificationManager />
        
        <ErrorBoundary FallbackComponent={ErrorPage}>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </ErrorBoundary>
      </GlobalErrorBoundary>
    </>
  );
};

export default App;
