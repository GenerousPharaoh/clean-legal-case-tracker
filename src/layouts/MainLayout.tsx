import { useEffect, useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Container } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode, Logout } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAppStore from '../store';

// Panels
import LeftPanel from './panels/LeftPanel';
import CenterPanelWrapper from './panels/CenterPanelWrapper';
import RightPanelWrapper from './panels/RightPanelWrapper';
import ResizablePanels from '../components/ResizablePanels';

const MainLayout = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { signOut, user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Use individual selectors for each state value to prevent infinite re-renders
  const isLeftPanelOpen = useAppStore((state) => state.isLeftPanelOpen);
  const isRightPanelOpen = useAppStore((state) => state.isRightPanelOpen);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const toggleLeftPanel = useAppStore((state) => state.toggleLeftPanel);
  const toggleRightPanel = useAppStore((state) => state.toggleRightPanel);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const themeMode = useAppStore((state) => state.themeMode);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);

  // Set the selected project from the URL parameter
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId, setSelectedProject]);

  // Reset selectedFile when selectedProject changes
  useEffect(() => {
    setSelectedFile(null);
  }, [selectedProjectId, setSelectedFile]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
    setSelectedProject(null);
    navigate('/login');
  };

  return (
    <Box 
      component="main" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        overflow: 'hidden', 
        bgcolor: 'background.default',
        backgroundImage: (theme) => theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle at 50% 14%, rgba(78, 109, 148, 0.05) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(28, 31, 44, 0.8) 0%, rgba(28, 31, 44, 0.4) 100%)'
          : 'radial-gradient(circle at 50% 14%, rgba(44, 79, 124, 0.03) 0%, rgba(0, 0, 0, 0) 60%), linear-gradient(to bottom, rgba(250, 250, 250, 0.8) 0%, rgba(244, 244, 244, 0.4) 100%)',
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          zIndex: 1300, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backgroundImage: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, #3A5E86 0%, #4E6D94 100%)'
            : 'linear-gradient(90deg, #2C4F7C 0%, #3A5E86 100%)',
        }}>
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleLeftPanel}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {import.meta.env.VITE_APP_NAME || 'Legal Case Tracker'}
          </Typography>
          
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={user?.user_metadata?.avatar_url}
              alt={user?.email?.charAt(0).toUpperCase() || 'U'}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="section" sx={{ 
        flexGrow: 1, 
        overflow: 'hidden', 
        position: 'relative', 
        transition: 'all 0.3s ease', 
        p: { xs: 1, sm: 2 } 
      }}>
        <Container 
          maxWidth={false} 
          disableGutters 
          sx={{ 
            maxWidth: 1920, 
            mx: 'auto', 
            height: '100%',
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: (theme) => `0 8px 32px ${theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.35)' 
              : 'rgba(0, 0, 0, 0.15)'}`,
          }}
        >
          <ResizablePanels initialSizes={[20, 60, 20]} minSizes={[10, 30, 10]}>
            <LeftPanel />
            <CenterPanelWrapper />
            <RightPanelWrapper />
          </ResizablePanels>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 1, 
          textAlign: 'center', 
          bgcolor: 'background.paper', 
          borderTop: 1, 
          borderColor: 'divider',
          color: 'text.secondary',
          fontSize: '0.75rem',
          backdropFilter: 'blur(10px)',
          mt: 1,
          boxShadow: (theme) => `0 -2px 10px ${theme.palette.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.2)' 
            : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <Typography variant="caption" color="inherit">
          © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'Legal Case Tracker'}. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout; 