import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  CircularProgress, 
  TextField,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  Avatar
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockIcon from '@mui/icons-material/Lock';

/**
 * AcceptInvitePage - Handles invitation acceptance flow
 * 
 * This page handles the accepting of project invitations:
 * 1. If user is not logged in, it shows a login/signup form
 * 2. If user is logged in, it processes the invitation token
 */
const AcceptInvitePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State management
  const [inviteToken, setInviteToken] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newAccount, setNewAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  
  // Extract token from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setInviteToken(token);
    } else {
      setError('No invitation token found in URL');
    }
  }, [location]);
  
  // Check if invitation token is valid
  useEffect(() => {
    const checkInviteToken = async () => {
      if (!inviteToken) return;
      
      try {
        setLoading(true);
        setError(null);
      
        // Fetch the invitation details without requiring authentication
        const { data, error } = await supabase
          .from('project_collaborators')
          .select('id, project_id, email, status, role, created_at, projects:project_id(id, name)')
          .eq('invite_token', inviteToken)
          .eq('status', 'pending')
          .single();
        
        if (error || !data) {
          console.error('Error fetching invite:', error);
          setError('This invitation link is invalid or has expired');
          setLoading(false);
          return;
        }
        
        setInviteDetails(data);
        
        // Pre-fill email if we have it from the invitation
        if (data.email && !email) {
          setEmail(data.email);
        }
        
      } catch (err) {
        console.error('Error checking invitation:', err);
        setError('An error occurred while checking the invitation');
      } finally {
        setLoading(false);
      }
    };
    
    checkInviteToken();
  }, [inviteToken]);
  
  // If user is logged in, attempt to accept the invitation
  useEffect(() => {
    const acceptInviteForLoggedInUser = async () => {
      if (!user || !inviteToken || inviteAccepted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Call the accept-invite function
        const { data, error } = await supabase.functions.invoke('accept-invite', {
          body: { token: inviteToken }
        });
        
        if (error) {
          console.error('Error accepting invite:', error);
          setError(error.message || 'Failed to accept invitation');
          setLoading(false);
          return;
        }
        
        // Invitation accepted successfully
        setInviteAccepted(true);
        setInviteDetails(data.collaboration || inviteDetails);
        
        // After successful acceptance, redirect to the client portal
        setTimeout(() => {
          navigate(`/client-portal/${data.project.id}`);
        }, 3000);
        
      } catch (err) {
        console.error('Error accepting invitation:', err);
        setError('An error occurred while accepting the invitation');
      } finally {
        setLoading(false);
      }
    };
    
    acceptInviteForLoggedInUser();
  }, [user, inviteToken, inviteAccepted, navigate]);
  
  // Handle form submission for login/signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // For new account, validate password rules
    if (newAccount) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (newAccount) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          throw error;
        }
        
        if (data.user) {
          // No need to do anything else here as the logged-in user useEffect will handle the invitation
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          throw error;
        }
      }
      
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Render loading state
  if (loading && !inviteDetails) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Checking invitation...</Typography>
      </Container>
    );
  }
  
  // Render error state
  if (error && !inviteDetails && !user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Invitation Error
          </Typography>
          <Typography color="error" paragraph>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Render successful acceptance view
  if (inviteAccepted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Invitation Accepted!
          </Typography>
          <Typography paragraph>
            You have successfully accepted the invitation to collaborate on <strong>{inviteDetails?.projects?.name}</strong>.
          </Typography>
          <Typography paragraph>
            Redirecting you to the client portal...
          </Typography>
          <CircularProgress size={24} sx={{ mt: 2 }} />
        </Paper>
      </Container>
    );
  }
  
  // Render login/signup form for non-authenticated users
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                width: 56, 
                height: 56, 
                margin: '0 auto', 
                mb: 2 
              }}
            >
              <PersonAddIcon />
            </Avatar>
            <Typography variant="h5" component="h1" gutterBottom>
              {newAccount ? 'Create Account' : 'Sign In'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {inviteDetails ? (
                <>
                  You've been invited to collaborate on project: <strong>{inviteDetails?.projects?.name}</strong>
                </>
              ) : (
                'Please sign in or create an account to accept the invitation'
              )}
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || (inviteDetails?.email && !newAccount)}
              required
              variant="outlined"
            />
            
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              variant="outlined"
              sx={{ mt: 2 }}
            />
            
            {newAccount && (
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                variant="outlined"
                sx={{ mt: 2 }}
              />
            )}
            
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <LockIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Your data is securely encrypted
              </Typography>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                newAccount ? 'Create Account & Accept Invitation' : 'Sign In & Accept Invitation'
              )}
            </Button>
          </form>
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          <Box sx={{ textAlign: 'center' }}>
            <Button
              onClick={() => setNewAccount(!newAccount)}
              color="primary"
              disabled={loading}
            >
              {newAccount ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // Logged in user, waiting for acceptance
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Accepting Invitation
        </Typography>
        <Typography variant="body1">
          Please wait while we process your invitation...
        </Typography>
      </Paper>
    </Container>
  );
};

export default AcceptInvitePage; 