import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Password reset instructions have been sent to your email address.');
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to send password reset email. Please check your email address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Reset Password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
              {success}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleResetPassword} sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Back to Login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 