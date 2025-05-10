import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { lightTheme, darkTheme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import NotificationProvider from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import useAppStore from './store';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/NotFound';
import AITestPage from './pages/AITestPage';

// Create a ProjectListPage component that's just a wrapper around MainLayout
// This way the MainLayout will handle showing the welcome screen for the root route
const ProjectListPage = () => <MainLayout />;

function App() {
  const themeMode = useAppStore((state) => state.themeMode);
  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <NotificationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                        <ErrorBoundary>
                    <ProjectListPage />
                        </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              
              {/* Project route */}
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                        <ErrorBoundary>
                    <MainLayout />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* AI Test Page */}
                  <Route
                    path="/ai-test"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <AITestPage />
                        </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect to home */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              
              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
        </NotificationProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
