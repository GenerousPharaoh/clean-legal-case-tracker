import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Link, Alert, Divider, Tab, Tabs, Paper, IconButton } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import EmailIcon from '@mui/icons-material/Email';
import GoogleIcon from '@mui/icons-material/Google';

// Define Zod schema for validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const magicLinkSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type MagicLinkFormInputs = z.infer<typeof magicLinkSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Get tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'magic') {
      setActiveTab(1);
    }
  }, [location]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerMagicLink,
    handleSubmit: handleSubmitMagicLink,
    formState: { errors: magicLinkErrors },
  } = useForm<MagicLinkFormInputs>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw signInError;
      }
      navigate('/cases'); // Redirect to cases page on successful login
    } catch (err: any) {
      setError(err.error_description || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMagicLink: SubmitHandler<MagicLinkFormInputs> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/cases`, // Redirect to cases page after login
        },
      });

      if (magicLinkError) {
        throw magicLinkError;
      }
      
      setSuccess('Check your email for the magic link to sign in!');
    } catch (err: any) {
      setError(err.error_description || err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/cases`,
        }
      });

      if (error) {
        throw error;
      }
      // No need to navigate, the OAuth flow will handle the redirect
    } catch (err: any) {
      setError(err.error_description || err.message || 'Google login failed');
      setOauthLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Sign in to Clarity Suite
        </Typography>
        
        <Paper 
          elevation={2} 
          sx={{ 
            width: '100%', 
            mt: 2, 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                py: 1.5
              }
            }}
          >
            <Tab label="Password" />
            <Tab label="Magic Link" />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {/* Google Sign In Button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
              sx={{ 
                mt: 1, 
                mb: 3,
                py: 1,
                borderColor: '#4285F4',
                color: '#4285F4',
                '&:hover': {
                  borderColor: '#4285F4',
                  backgroundColor: 'rgba(66, 133, 244, 0.04)',
                }
              }}
            >
              {oauthLoading ? 'Connecting...' : 'Sign in with Google'}
            </Button>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {activeTab === 0 ? (
              // Password Login Form
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            autoComplete="email"
            autoFocus
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
                
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
                
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
              </Box>
            ) : (
              // Magic Link Form
              <Box component="form" onSubmit={handleSubmitMagicLink} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="magic-email"
                  label="Email Address"
                  autoComplete="email"
                  autoFocus
                  {...registerMagicLink('email')}
                  error={!!magicLinkErrors.email}
                  helperText={magicLinkErrors.email?.message}
                />
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                    {success}
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={<EmailIcon />}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? 'Sending Link...' : 'Send Magic Link'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  We'll email you a magic link for password-free sign in
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
        
        <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
          <Link component={RouterLink} to="/signup" variant="body2">
            {"Don't have an account? Sign Up"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage; 