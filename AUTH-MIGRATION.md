# Authentication System Migration Guide

## Overview

This project has migrated from React Context API to Zustand for state management, including authentication. This document explains how to use the enhanced authentication system correctly.

## The Problem

Previously, the project used React Context API (`AuthContext`) for authentication. This was deprecated in favor of Zustand store (`useAuthStore`), but the migration was inconsistent across the codebase. Different components used different approaches, leading to:

1. Inconsistent authentication state updates
2. Multiple sources of truth for auth data
3. Missing initialization logic in some components
4. Authentication issues after token refresh

## The Solution

We've implemented a standardized approach that combines the best of both worlds:

1. Created an enhanced `useAuth()` hook in `src/hooks/useAuth.ts` that:
   - Uses `useAuthStore` internally for state management
   - Provides backward compatibility with the old Context API
   - Adds session initialization and listeners automatically
   - Handles token refresh properly

2. Updated key components to use the enhanced hook:
   - Protected routes
   - Layouts and panels
   - Authentication error handlers

## How to Use Authentication in Your Components

### Recommended Approach (For All Components)

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  // Get authentication state and methods
  const { 
    // User state
    user,                   // The current user object
    session,                // The current session object
    loading,                // Whether auth is still initializing
    isAuthenticated,        // Boolean shorthand for !!session
    isAdmin,                // Boolean for user.role === 'admin'
    
    // Actions
    setUser,                // Update user state
    setSession,             // Update session state
    refreshSession,         // Refresh the auth session
    clearUser,              // Clear user state (log out)
    
    // Permissions
    hasPermission,          // Check if user has a specific permission
    isProjectOwner,         // Check if user is a project owner
    isClientUploader        // Check if user is a client uploader
  } = useAuth();
  
  // Use auth state and methods in your component
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.firstName || user?.email}</h1>
      {isProjectOwner() && <button>Admin Actions</button>}
    </div>
  );
}
```

### Important Notes

1. **Always use `useAuth()` from `hooks/useAuth.ts`**, not from `context/AuthContext.tsx` or directly accessing `useAuthStore`

2. **Authentication is automatically initialized** when you use the `useAuth()` hook - you don't need to set up listeners manually

3. The old `AuthContext.tsx` file still exists but is just a compatibility layer that forwards to our enhanced hook.

## Permissions System

The authentication system includes role-based permissions. Use the included functions for authorization checks:

```tsx
// Check if user can perform a specific action
const canEdit = hasPermission('edit_project');

// Check specific roles
if (isProjectOwner()) {
  // Show owner-specific UI
}

if (isClientUploader()) {
  // Show client uploader specific UI
}
```

## Using Auth Outside React Components

If you need to access authentication state outside of React components (e.g., in utility functions), use the following approach:

```tsx
// In utility files
import { useAuthStore } from '../store/store';

// Create a utility function
export function performAuthenticatedAction() {
  // Get current auth state
  const { user, session } = useAuthStore.getState();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  // Perform action with auth data
  // ...
}
```

## Testing Components That Use Authentication

When testing components that use the `useAuth` hook:

```tsx
// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-id', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    loading: false,
    isAuthenticated: true,
    // ...other props and methods as needed
  })
}));
```

## Troubleshooting

If you encounter authentication issues:

1. Make sure you're using `useAuth()` from `hooks/useAuth.ts` consistently throughout the app
2. Verify that auth initialization is complete (`loading === false`) before assuming authentication state
3. Check browser console for auth-related errors (they're usually prefixed with `[Auth]`)
4. If you suspect cached credentials are causing issues, try clearing local storage and cookies

For persistent problems, check:
1. The Supabase session handling in `useAuth.ts`
2. The token refresh mechanism in `useAuthStore`
3. The authentication error handling in `AuthErrorHandler.tsx`

 