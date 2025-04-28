import React, { useEffect, useState, Suspense } from 'react';
import { CssBaseline } from '@mui/material';
import { useThemeContext } from './context/ThemeContext';
import { pdfjs } from 'react-pdf';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { supabase } from './supabaseClient';
import { useAuthStore } from './store/store';
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
  const { setUser, setSession, setLoading, clearUser, updateLastTokenRefresh } = useAuthStore();
  const [appInitialized, setAppInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Initialize theme with dark/light mode support
  const { mode, theme } = useThemeContext();
  
  // Initialize auth listeners
  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      setLoading(true);
      try {
        console.log('[App] Checking authentication session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[App] Error checking session:', error);
          setAuthError('Error verifying your authentication status. Please refresh the page.');
          reportError('Error verifying your authentication status.', ErrorCategory.AUTH);
          clearUser();
        } else if (session) {
          console.log('[App] Session found, user is authenticated:', session.user.email);
          setSession(session);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            // other user data can be fetched and set here
          });
          updateLastTokenRefresh();
          
          // Also verify the user's information and fetch additional profile data
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.error('[App] Error getting user data:', userError);
          } else if (userData.user) {
            console.log('[App] User data fetched successfully');
            
            // Fetch additional user profile data if needed
            try {
              // First check if profile exists
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, role')
                .eq('id', userData.user.id)
                .single();
                
              if (profileError) {
                console.error('[App] Error fetching user profile:', profileError);
                
                // If profile doesn't exist (404), create one
                if (profileError.code === 'PGRST116') {
                  console.log('[App] Profile not found, creating default profile');
                  
                  // Create a default profile for the user
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert([{ 
                      id: userData.user.id, 
                      first_name: userData.user.email?.split('@')[0] || 'User',
                      created_at: new Date().toISOString()
                    }])
                    .select('first_name, last_name, avatar_url, role')
                    .single();
                  
                  if (insertError) {
                    console.error('[App] Error creating profile:', insertError);
                  } else if (newProfile) {
                    // Update user with the new profile info
                    setUser({
                      id: userData.user.id,
                      email: userData.user.email || '',
                      firstName: newProfile.first_name,
                      lastName: newProfile.last_name,
                      avatarUrl: newProfile.avatar_url,
                      role: newProfile.role,
                    });
                  }
                }
              } else if (profile) {
                // Update the user store with additional profile information
                setUser({
                  id: userData.user.id,
                  email: userData.user.email || '',
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  avatarUrl: profile.avatar_url,
                  role: profile.role,
                });
              }
            } catch (profileError) {
              console.error('[App] Error in profile fetch:', profileError);
            }
          }
        } else {
          console.log('[App] No active session found');
          clearUser();
        }
      } catch (e) {
        console.error("[App] Authentication error:", e);
        setAuthError('An unexpected authentication error occurred. Please refresh the page.');
        reportError('An unexpected authentication error occurred.', ErrorCategory.AUTH);
        clearUser();
      } finally {
        setLoading(false);
        setAppInitialized(true);
      }
    };
    
    // Initial session check
    checkSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[App] User signed in:', session.user.email);
        setSession(session);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          // other user data can be set here
        });
        updateLastTokenRefresh();
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('[App] User signed out or deleted');
        clearUser();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[App] Token refreshed for user:', session.user.email);
        setSession(session);
        updateLastTokenRefresh();
      } else if (event === 'USER_UPDATED' && session) {
        console.log('[App] User updated:', session.user.email);
        setSession(session);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          // other user data can be updated here
        });
      }
    });
    
    // Cleanup auth listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
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
