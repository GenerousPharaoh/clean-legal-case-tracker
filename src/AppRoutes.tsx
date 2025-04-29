import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';
import { supabase } from './supabaseClient';
import { handleSupabaseError, ErrorCategory, reportError } from './utils/authErrorHandler';

// Import the standard ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

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
import SignoutPage from './pages/SignoutPage';

// Main routes configuration
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes - use the imported ProtectedRoute */}
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

      {/* Public signout route */}
      <Route path="/signout" element={<SignoutPage />} />

      {/* Protected routes within MainLayout - use the imported ProtectedRoute */}
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
