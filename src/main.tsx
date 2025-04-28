// -- CRITICAL FIXES FIRST -- //
// Direct fix for useTimeout
import './utils/directFix.js';

// Import the new comprehensive timeout fixes first
import './utils/reactTimeoutFixes';
import './utils/useTimeoutWrapper.js';

// Import the fixed timeout patch 
import './utils/reactTimeoutPatch.js';

// Import the emergency fix 
import './utils/emergency-fix.js';

// Import the Map.clear polyfill
import './utils/mapPolyfill.js';

// Import React patch to fix unmount issues
import './utils/reactPatch.js';

// Activate the polyfill globally
if (typeof window !== 'undefined') {
  // Find any EventTarget-like objects with events that need clear
  document.addEventListener('DOMContentLoaded', () => {
    // Scan common libraries for event objects
    const eventTargets = [
      window,
      document,
      ...Array.from(document.querySelectorAll('*')) // All DOM elements 
    ];
    
    eventTargets.forEach(target => {
      if (target && typeof target === 'object' && target.events) {
        // Apply the polyfill to event objects
        window.ensureEventsClearable?.(target.events);
      }
    });
    
    console.log('[Polyfill] Applied Map.clear polyfill to DOM events');
  });
}

// Disable PropType warnings FIRST - before any component imports 
import initDisablePropTypeWarnings from './utils/disablePropTypeWarnings';
// Initialize the warning suppression
initDisablePropTypeWarnings();

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css' // Keep basic Vite styling or customize later
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { initializeErrorHandlers } from './utils/errorHandler';
// Using useAuthStore from Zustand instead of AuthProvider
// import { AuthProvider } from './context/AuthContext'
import AuthErrorHandler from './components/AuthErrorHandler'
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

// Initialize global error handlers
initializeErrorHandlers();

// Import safe access utilities to prevent undefined errors
import './utils/safeAccess';

// Import TinyMCE config (but don't initialize here - let App handle it)
import './utils/tinymce-init';

// Add error logging
console.log('[main] Starting application with full feature set');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthErrorHandler />
            <CssBaseline /> {/* Normalize CSS and apply background color */}
            <App />
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>,
)

console.log('[main] App rendered successfully with all providers');
