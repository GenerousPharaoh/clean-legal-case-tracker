import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { supabase } from '../supabaseClient';

/**
 * LoginButton component for Google OAuth authentication
 * Properly handles the OAuth flow and redirects
 */
export const LoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current URL for proper redirect handling
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('Setting redirect URL to:', redirectTo);
      
      // Begin Google OAuth process with specific redirect
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google login error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
        onClick={handleGoogleLogin}
        disabled={loading}
        fullWidth
        sx={{ 
          py: 1.2,
          backgroundColor: '#4285F4',
          '&:hover': {
            backgroundColor: '#3367D6',
          },
          textTransform: 'none', 
          fontSize: '1rem'
        }}
      >
        {loading ? 'Connecting...' : 'Sign in with Google'}
      </Button>
      
      {error && (
        <div style={{ 
          marginTop: '10px', 
          color: '#d32f2f', 
          backgroundColor: '#ffebee',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default LoginButton; 