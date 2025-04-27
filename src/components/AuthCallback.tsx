import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';

/**
 * AuthCallback component
 * Handles the OAuth redirect callback and completes the authentication process
 */
const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const navigate = useNavigate();
  
  // Function to manually redirect to home
  const redirectToHome = () => {
    // Redirect to the root path using React Router
    console.log('[AuthCallback] Redirecting to home');
    navigate('/');
  };
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get the URL parts
        const hash = window.location.hash;
        const query = window.location.search;
        const pathname = window.location.pathname;
        
        // Log the callback info for debugging
        const callbackInfo = { 
          hash: hash ? 'Present' : 'Not present',
          query: query ? 'Present' : 'Not present',
          pathname,
          fullUrl: window.location.href
        };
        
        console.log('[AuthCallback] Processing auth callback:', callbackInfo);
        setDebugInfo(callbackInfo);
        
        // Extract parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        // Check if there's an error in the URL
        if (error) {
          console.error(`[AuthCallback] Error in URL: ${error}, ${errorDescription}`);
          setError(errorDescription || error);
          setIsProcessing(false);
          return;
        }
        
        // First try to get an existing session
        console.log('[AuthCallback] Checking for active session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthCallback] Error getting session:', sessionError);
          setError(sessionError.message);
          setIsProcessing(false);
          return;
        }
        
        // If we have a valid session already, use it
        if (sessionData?.session) {
          console.log('[AuthCallback] Active session found for:', sessionData.session.user.email);
          
          // Use a timeout to ensure the store is updated before navigating
          setTimeout(() => {
            console.log('[AuthCallback] Redirecting to home with active session');
            redirectToHome();
          }, 1000);
          return;
        }
        
        // No active session yet, but we have a code - handle the exchange
        if (code) {
          console.log('[AuthCallback] No session but found code, exchanging...');
          
          try {
            // Manually exchange the code for a session
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('[AuthCallback] Code exchange error:', exchangeError);
              setError(`Authentication code exchange failed: ${exchangeError.message}`);
              setIsProcessing(false);
              return;
            }
            
            if (exchangeData?.session) {
              console.log('[AuthCallback] Code exchange successful for:', exchangeData.session.user.email);
              
              // Redirect to home after updating store
              setTimeout(() => {
                console.log('[AuthCallback] Redirecting to home after code exchange');
                redirectToHome();
              }, 1000);
              return;
            } else {
              console.error('[AuthCallback] Code exchange succeeded but no session returned');
              setError('Authentication completed but no session was created. Please try again.');
              setIsProcessing(false);
            }
          } catch (err: any) {
            console.error('[AuthCallback] Error during code exchange:', err);
            setError(`Code exchange error: ${err.message}`);
            setIsProcessing(false);
          }
        } else {
          // No code found in URL
          console.error('[AuthCallback] No auth code found in the URL');
          setError('No authentication code found in the URL. Please try signing in again.');
          setIsProcessing(false);
        }
      } catch (err: any) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError(`An unexpected error occurred: ${err.message}`);
        setIsProcessing(false);
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      padding={4}
    >
      {error ? (
        <Box textAlign="center" maxWidth="600px">
          <Typography variant="h5" color="error" gutterBottom>
            Authentication Error
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          
          {debugInfo && (
            <Box sx={{ mb: 3, textAlign: 'left', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Debug Information:</Typography>
              <pre style={{ overflow: 'auto', fontSize: '0.8rem' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Box>
          )}
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mt: 2, mr: 2 }}
          >
            Return to Login
          </Button>
          <Button 
            variant="outlined"
            onClick={redirectToHome}
            sx={{ mt: 2 }}
          >
            Try Homepage Anyway
          </Button>
        </Box>
      ) : (
        <Box textAlign="center" maxWidth="500px">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Completing authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please wait while we log you in.
          </Typography>
          
          {!isProcessing && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={redirectToHome}
            >
              Continue to App
            </Button>
          )}
          
          {debugInfo && !isProcessing && (
            <Box sx={{ mt: 3, textAlign: 'left', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Debug Information:</Typography>
              <pre style={{ overflow: 'auto', fontSize: '0.8rem' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AuthCallback;