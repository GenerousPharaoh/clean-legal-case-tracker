// React initialization - must be first
import { ensureReactAvailable } from './react-init';
ensureReactAvailable();

// Ensure React is globally available 
import './utils/ensureReact';

// Clean main.tsx without polyfill imports
import React from 'react'

import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { initializeErrorHandlers } from './utils/errorHandler'
import AuthErrorHandler from './components/AuthErrorHandler'
import GlobalErrorBoundary from './components/GlobalErrorBoundary'

// These are the only utility imports we're keeping
import './utils/safeAccess'
// Import TinyMCE initialization and fixes (with .js extension explicitly for clarity)
import './utils/tinymce-init.js'
import './utils/tinymce-fix.js'

// Import dark theme enhancements
import './styles/darkThemeEnhancement.css'

// Initialize error handlers (keeping this since it's part of the core app)
initializeErrorHandlers()

// Simple log for debugging
console.log('[main] Starting application')

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
  </React.StrictMode>
)

console.log('[main] App rendered successfully with all providers')
