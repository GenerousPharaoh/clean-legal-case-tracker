import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportError, ErrorCategory } from '../utils/authErrorHandler';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isAdmin, loading, refreshSession } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Only proceed if initial auth check is complete
      if (!loading) {
        // If we require authentication and user is not authenticated,
        // attempt a session refresh
        if (requireAuth && !isAuthenticated && !isRefreshing) {
          setIsRefreshing(true);
          
          try {
            const refreshed = await refreshSession();
            
            // If refresh failed, prepare for redirect
            if (!refreshed) {
              reportError(
                'Authentication required',
                ErrorCategory.AUTH,
                'You need to be logged in to access this page.',
                true
              );
              setShouldRedirect(true);
            }
          } catch (error) {
            console.error('Session refresh failed:', error);
            setShouldRedirect(true);
          } finally {
            setIsRefreshing(false);
          }
        }
        
        // If we require admin and user is not admin, prepare for redirect
        if (requireAdmin && !isAdmin) {
          reportError(
            'Admin access required',
            ErrorCategory.PERMISSION,
            'You do not have permission to access this page.',
            true
          );
          setShouldRedirect(true);
        }
      }
    };
    
    checkAuth();
  }, [loading, isAuthenticated, isAdmin, requireAuth, requireAdmin, refreshSession, isRefreshing]);
  
  // Show loading state while authentication is being checked
  if (loading || isRefreshing) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Redirect if needed
  if (shouldRedirect) {
    if (requireAuth && !isAuthenticated) {
      // Redirect to login and save the current location
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    
    if (requireAdmin && !isAdmin) {
      // Redirect to dashboard for non-admin users
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // If access is allowed, render children
  return <>{children}</>;
};

export default ProtectedRoute; 