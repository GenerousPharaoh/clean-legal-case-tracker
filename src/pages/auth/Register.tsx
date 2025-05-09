import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const { error, data } = await signUp(email, password);
      
      if (error) {
        throw error;
      }
      
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setSuccess('Registration successful! Please check your email to confirm your account before logging in.');
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else if (data?.session) {
        // User is automatically logged in
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to create account. Email may already be in use.');
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
            Create an Account
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
          
          <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 