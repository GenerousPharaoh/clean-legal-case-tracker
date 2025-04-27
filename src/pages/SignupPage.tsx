import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Link, Alert, Paper, Divider } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import EmailIcon from '@mui/icons-material/Email';
import GoogleIcon from '@mui/icons-material/Google';

// Define Zod schema for validation
const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type SignupFormInputs = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        throw signUpError;
      }

      // Handle cases where email confirmation is required
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        // User exists but needs confirmation - show message but treat as error for form state
        setError('User already exists. Please try logging in or check your email for verification.');
        // Or redirect to login with a message? User experience decision.
      } else if (signUpData.user) {
        setSuccess(true);
        // Optionally redirect after a delay or keep the success message
        // setTimeout(() => navigate('/login'), 3000);
      } else {
        // Handle unexpected cases
        throw new Error('Sign up failed. Please try again.');
      }

    } catch (err: any) {
      setError(err.error_description || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        throw error;
      }
      // No need to navigate, the OAuth flow will handle the redirect
    } catch (err: any) {
      setError(err.error_description || err.message || 'Google signup failed');
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
          Sign up for Clarity Suite
        </Typography>
        {success ? (
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mt: 2, 
              width: '100%', 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Signup successful! Please check your email for a verification link.
            </Alert>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{ mt: 3 }}
            >
              Return to Login
            </Button>
          </Paper>
        ) : (
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mt: 2, 
              width: '100%',
              borderRadius: 2
            }}
          >
            {/* Google Sign Up Button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignup}
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
              {oauthLoading ? 'Connecting...' : 'Sign up with Google'}
            </Button>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
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
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
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
                sx={{ mt: 3 }}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Button>
            </Box>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" gutterBottom>
                Already have an account?
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Sign In
              </Button>
              <Button
                component={RouterLink}
                to="/login?tab=magic"
                variant="outlined"
                startIcon={<EmailIcon />}
                color="secondary"
              >
                Use Magic Link
              </Button>
          </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default SignupPage; 