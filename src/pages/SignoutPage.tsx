import React, { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { clearStoredAuthSession } from '../hooks/useAuth';

const SignoutPage: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  
  useEffect(() => {
    // Auto-attempt logout after a short delay
    const timer = setTimeout(() => {
      handleLogout();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await clearStoredAuthSession();
      // The function will redirect to login
    } catch (err) {
      console.error('Error during logout:', err);
      setIsLoggingOut(false);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Signing Out...
      </Typography>
      
      {isLoggingOut ? (
        <>
          <CircularProgress sx={{ my: 3 }} />
          <Typography variant="body1" gutterBottom>
            Clearing your session...
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="body1" gutterBottom sx={{ mb: 3, maxWidth: 500 }}>
            You are being signed out. If you're not redirected automatically, please click the button below.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            Sign Out Manually
          </Button>
        </>
      )}
    </Box>
  );
};

export default SignoutPage; 