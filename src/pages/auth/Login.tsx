import { useState, useCallback, memo } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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
  Divider,
  Stack,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';

interface LocationState {
  from?: string;
}

// Test credentials for demo purposes
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Demo user for direct store injection
const DEMO_USER = {
  id: 'demo-user-123',
  email: TEST_EMAIL,
  avatar_url: null,
  full_name: 'Demo User',
};

// Use memo to prevent unnecessary re-renders
const Login = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const setStoreUser = useAppStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Simple input handlers
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);
  
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);
  
  const handleDemoLogin = useCallback(() => {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    setIsTestMode(true);
  }, []);
  
  const handleForceDemoLogin = useCallback(() => {
    setLoading(true);
    
    // Set the demo user directly in the store
    setStoreUser(DEMO_USER);
    
    // Navigate to appropriate page
    const state = location.state as LocationState;
    const from = state?.from || '/';
    navigate(from);
  }, [navigate, location.state, setStoreUser]);
  
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    // If in test mode, use the demo bypass
    if (isTestMode && email === TEST_EMAIL && password === TEST_PASSWORD) {
      console.log('Using demo mode authentication bypass');
      handleForceDemoLogin();
      return;
    }
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      // Redirect to appropriate page
      const state = location.state as LocationState;
      const from = state?.from || '/';
      navigate(from);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // If demo credentials, try to bypass
      if (isTestMode && email === TEST_EMAIL && password === TEST_PASSWORD) {
        console.log('Authentication failed but using demo bypass anyway');
        handleForceDemoLogin();
        return;
      }
      
      setError(error.message || 'Failed to log in. Please try again.');
      setLoading(false);
    }
  }, [email, password, signIn, navigate, location.state, isTestMode, handleForceDemoLogin]);
  
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
            {import.meta.env.VITE_APP_NAME || 'Legal Case Tracker'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
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
              onChange={handleEmailChange}
              disabled={loading}
              inputProps={{
                'aria-label': 'Email Address',
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
              inputProps={{
                'aria-label': 'Password',
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={handleForceDemoLogin}
              disabled={loading}
              sx={{ mb: 2 }}
              color="success"
            >
              Skip Login (Demo Mode)
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={handleDemoLogin}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Use Demo Account
            </Button>
            
            {isTestMode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  Demo credentials:<br />
                  Email: {TEST_EMAIL}<br />
                  Password: {TEST_PASSWORD}
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link component={RouterLink} to="/reset-password" variant="body2">
                Forgot password?
              </Link>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
});

Login.displayName = 'Login';

export default Login; 