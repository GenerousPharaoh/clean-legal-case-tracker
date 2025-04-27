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
      <BrowserRouter>
            <ThemeProvider>
              <ToastProvider>
          <AuthErrorHandler />
                <CssBaseline /> {/* Normalize CSS and apply background color */}
                <App />
              </ToastProvider>
            </ThemeProvider>
      </BrowserRouter>
  </React.StrictMode>,
)

console.log('[main] App rendered successfully with all providers');
