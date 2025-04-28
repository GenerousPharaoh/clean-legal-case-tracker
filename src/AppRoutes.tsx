import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';
import { supabase } from './supabaseClient';
import { handleSupabaseError, ErrorCategory, reportError } from './utils/authErrorHandler';

// Main layout and pages
import MainLayout from './layouts/MainLayout';
import CaseLibrary from './components/CaseLibrary';
import CaseDetail from './components/CaseDetail';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import ClientPortalPage from './pages/ClientPortalPage';
import { CaseProvider } from './contexts/CaseContext';
import AuthCallback from './components/AuthCallback';

// Define a protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  allowedRoles = [] 
}) => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  // Check for session expiry
  useEffect(() => {
    if (requireAuth && session) {
      const checkSessionExpiry = async () => {
        try {
          // Try to get user to verify session is still valid
          const { data, error } = await supabase.auth.getUser();
          
          if (error) {
            reportError(
              'Session expired', 
              ErrorCategory.AUTH, 
              'Please sign in again to continue.'
            );
            // Force redirect to login
            window.location.href = '/login';
          }
        } catch (err) {
          handleSupabaseError(err, 'Error validating session');
        }
      };
      
      // Check on mount
      checkSessionExpiry();
    }
  }, [session, requireAuth]);
  
  // Role-based access control
  const checkRoleAccess = () => {
    if (allowedRoles.length === 0) return true;
    if (!user || !user.role) return false;
    
    return allowedRoles.includes(user.role);
  };

  // Show loading state while auth state is being determined
  if (loading) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Authenticating...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  // If authentication is required and no session exists, redirect to login
  if (requireAuth && !session) {
    // Store the intended location to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authentication should not exist and it does (e.g., login page when already logged in)
  if (!requireAuth && session) {
    // Get redirect path (if stored) or default to home
    const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
    // Clear stored path
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={redirectPath} replace />;
  }

  // Check role-based access if roles are specified
  if (requireAuth && session && !checkRoleAccess()) {
    reportError(
      'Access denied', 
      ErrorCategory.PERMISSION, 
      'You do not have permission to access this page.'
    );
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main routes configuration
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <ProtectedRoute requireAuth={false}>
          <LoginPage />
        </ProtectedRoute>
      } />
      
      <Route path="/signup" element={
        <ProtectedRoute requireAuth={false}>
          <SignupPage />
        </ProtectedRoute>
      } />
      
      {/* Auth callback route - must be public */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      
      <Route path="/client-portal/:token" element={<ClientPortalPage />} />

      {/* Protected routes within MainLayout */}
      <Route
        path="/"
        element={
        <ProtectedRoute>
          <CaseProvider>
            <MainLayout />
          </CaseProvider>
        </ProtectedRoute>
        }
      />
      
        {/* Default route (dashboard/home) */}
      <Route
        path="/index"
        element={
          <ProtectedRoute>
            <CaseProvider>
              <CaseLibrary />
            </CaseProvider>
          </ProtectedRoute>
        }
      />
        
        {/* Cases routes */}
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CaseProvider>
              <CaseLibrary />
            </CaseProvider>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cases/:caseId"
        element={
          <ProtectedRoute>
            <CaseProvider>
              <CaseDetail />
            </CaseProvider>
          </ProtectedRoute>
        }
      />
        
        {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <CaseProvider>
              <div>Settings Page (TODO)</div>
            </CaseProvider>
          </ProtectedRoute>
        }
      />
        
        {/* Fallback for unknown routes */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <CaseProvider>
              <div>Page not found</div>
            </CaseProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
