import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip,
  Divider,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import RestoreIcon from '@mui/icons-material/Restore';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/store';
import { useNavigate } from 'react-router-dom';
import LeftPanel from './panels/LeftPanel';
import CenterPanel from './panels/CenterPanel';
import RightPanel from './panels/RightPanel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EnhancedTooltip from '../components/EnhancedTooltip';
import { cssTransitions } from '../utils/transitions';
import ResizeHandle from '../components/ResizeHandle';
import { useLayoutStore, MIN_PANEL_WIDTH } from '../store/layoutStore';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeContext } from '../context/ThemeContext';
import ErrorNotification from '../components/ErrorNotification';
import { handleSupabaseError } from '../utils/authErrorHandler';

// Constants for panel sizing constraints
const CENTER_MIN_WIDTH = 400; // Minimum width for center panel
const MAX_PANEL_PERCENTAGE = 0.6; // Max percentage of window a single panel can take

// Define a cache for panel updates to reduce rerenders
let panelUpdateTimeoutId: NodeJS.Timeout | null = null;
const PANEL_UPDATE_DEBOUNCE = 10; // Minimal debounce in ms

/**
 * MainLayout - The primary layout for the application
 * 
 * Contains the header, footer, and the three-panel structure with resizable panels
 */
const MainLayout: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const theme = useTheme();
    const { 
        leftPanelWidth, 
        rightPanelWidth, 
        setLeftPanelWidth, 
        setRightPanelWidth,
        isLeftPanelCollapsed,
        isRightPanelCollapsed,
        toggleLeftPanelCollapse,
        toggleRightPanelCollapse,
        resetLayout
    } = useLayoutStore();
    
    // Theme mode management
    const { toggleThemeMode } = useThemeContext();
    
    // State for layout settings menu
    const [layoutMenuAnchor, setLayoutMenuAnchor] = useState<null | HTMLElement>(null);
    
    // State for keyboard shortcuts help menu
    const [shortcutsMenuAnchor, setShortcutsMenuAnchor] = useState<null | HTMLElement>(null);
    
    // Track window width for responsive constraints
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    // Check if we're on a small screen
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    // Refs for direct DOM manipulation during resize
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const centerPanelRef = useRef<HTMLDivElement>(null);

    // Update window width on resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only if control/meta key is pressed
        if (e.ctrlKey || e.metaKey) {
            // Ctrl+[ / Cmd+[ - Toggle left panel
            if (e.key === '[') {
                e.preventDefault();
                toggleLeftPanelCollapse();
            }
            // Ctrl+] / Cmd+] - Toggle right panel
            else if (e.key === ']') {
                e.preventDefault();
                toggleRightPanelCollapse();
            }
            // Ctrl+\ / Cmd+\ - Toggle both panels (focus/unfocus center)
            else if (e.key === '\\') {
                e.preventDefault();
                if (isLeftPanelCollapsed && isRightPanelCollapsed) {
                    // Unfocus (expand both panels)
                    toggleLeftPanelCollapse();
                    toggleRightPanelCollapse();
                } else {
                    // Focus (collapse both panels)
                    if (!isLeftPanelCollapsed) toggleLeftPanelCollapse();
                    if (!isRightPanelCollapsed) toggleRightPanelCollapse();
                }
            }
        }
    }, [
        toggleLeftPanelCollapse, 
        toggleRightPanelCollapse, 
        isLeftPanelCollapsed, 
        isRightPanelCollapsed
    ]);
    
    // Add keyboard shortcuts
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                handleSupabaseError(error, 'Error logging out');
            }
        } catch (error) {
            handleSupabaseError(error, 'Unexpected error during logout');
        }
    };
    
    // Calculate the actual available space for all panels
    const getTotalAvailableWidth = useCallback(() => {
        // Account for any margins, borders, or padding in the container
        return windowWidth - 20; // Adjust the offset as needed based on your layout
    }, [windowWidth]);
    
    // Handle resizing left panel with advanced constraints and direct DOM updates
    const handleResizeLeftPanel = (delta: number) => {
        if (isLeftPanelCollapsed || isRightPanelCollapsed) return; // Don't resize when collapsed
        
        // Calculate available width to ensure proper constraints
        const availableWidth = getTotalAvailableWidth();
        const minRequiredWidth = rightPanelWidth + CENTER_MIN_WIDTH;
        const maxAllowedWidth = availableWidth - minRequiredWidth;
        const maxWidthByPercentage = availableWidth * MAX_PANEL_PERCENTAGE;
        
        // Apply constraints to ensure center panel has enough space
        const newWidth = Math.min(
            maxAllowedWidth,
            Math.min(maxWidthByPercentage, leftPanelWidth + delta)
        );
        
        // Ensure we maintain at least the minimum width
        const constrainedWidth = Math.max(MIN_PANEL_WIDTH, newWidth);
        
        // Direct DOM update for responsive drag
        if (leftPanelRef.current) {
            leftPanelRef.current.style.width = `${constrainedWidth}px`;
        }
        
        // Debounce the state update to reduce rerenders
        if (panelUpdateTimeoutId) {
            clearTimeout(panelUpdateTimeoutId);
        }
        
        panelUpdateTimeoutId = setTimeout(() => {
            setLeftPanelWidth(constrainedWidth);
        }, PANEL_UPDATE_DEBOUNCE);
    };
    
    // Handle resizing right panel with advanced constraints and direct DOM updates
    const handleResizeRightPanel = (delta: number) => {
        if (isLeftPanelCollapsed || isRightPanelCollapsed) return; // Don't resize when collapsed
        
        // Calculate available width to ensure proper constraints
        const availableWidth = getTotalAvailableWidth();
        const minRequiredWidth = leftPanelWidth + CENTER_MIN_WIDTH;
        const maxAllowedWidth = availableWidth - minRequiredWidth;
        const maxWidthByPercentage = availableWidth * MAX_PANEL_PERCENTAGE;
        
        // For right panel, positive delta means shrinking (dragging left)
        const newWidth = rightPanelWidth - delta;
        
        // Apply constraints to ensure center panel has enough space
        const constrainedWidth = Math.max(
            MIN_PANEL_WIDTH,
            Math.min(maxAllowedWidth, Math.min(maxWidthByPercentage, newWidth))
        );
        
        // Direct DOM update for responsive drag
        if (rightPanelRef.current) {
            rightPanelRef.current.style.width = `${constrainedWidth}px`;
        }
        
        // Debounce the state update to reduce rerenders
        if (panelUpdateTimeoutId) {
            clearTimeout(panelUpdateTimeoutId);
        }
        
        panelUpdateTimeoutId = setTimeout(() => {
            setRightPanelWidth(constrainedWidth);
        }, PANEL_UPDATE_DEBOUNCE);
    };
    
    // Ensure panels stay within bounds on window resize
    useEffect(() => {
        const availableWidth = getTotalAvailableWidth();
        const currentTotalWidth = leftPanelWidth + rightPanelWidth;
        
        // If panels would take up too much space after window resize:
        if (availableWidth - currentTotalWidth < CENTER_MIN_WIDTH) {
            // Calculate how much we need to reduce each panel proportionally
            const excess = CENTER_MIN_WIDTH - (availableWidth - currentTotalWidth);
            const leftReduction = excess * (leftPanelWidth / currentTotalWidth);
            const rightReduction = excess * (rightPanelWidth / currentTotalWidth);
            
            // Apply reductions while respecting minimum sizes
            setLeftPanelWidth(Math.max(MIN_PANEL_WIDTH, leftPanelWidth - leftReduction));
            setRightPanelWidth(Math.max(MIN_PANEL_WIDTH, rightPanelWidth - rightReduction));
        }
    }, [windowWidth, leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth, getTotalAvailableWidth]);
    
    // Layout menu handlers
    const handleOpenLayoutMenu = (event: React.MouseEvent<HTMLElement>) => {
        setLayoutMenuAnchor(event.currentTarget);
    };
    
    const handleCloseLayoutMenu = () => {
        setLayoutMenuAnchor(null);
    };
    
    const handleResetLayout = () => {
        resetLayout();
        handleCloseLayoutMenu();
    };
    
    // Shortcuts menu handlers
    const handleOpenShortcutsMenu = (event: React.MouseEvent<HTMLElement>) => {
        setShortcutsMenuAnchor(event.currentTarget);
    };
    
    const handleCloseShortcutsMenu = () => {
        setShortcutsMenuAnchor(null);
    };
    
    // Get center panel width based on collapsed state
    const getCenterPanelWidth = () => {
        const bothCollapsed = isLeftPanelCollapsed && isRightPanelCollapsed;
        const leftCollapsed = isLeftPanelCollapsed;
        const rightCollapsed = isRightPanelCollapsed;
        
        if (bothCollapsed) {
            return '100%'; // Full width
        } else if (leftCollapsed) {
            return `calc(100% - ${rightPanelWidth}px)`;
        } else if (rightCollapsed) {
            return `calc(100% - ${leftPanelWidth}px)`;
        } else {
            return 'auto'; // Flex will make it take the remaining space
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Error Notification Component */}
            <ErrorNotification />
            
            {/* Top AppBar */}
            <AppBar 
                position="static" 
                sx={{ 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    boxShadow: 2,
                    background: 'linear-gradient(to right, #1976d2, #2196f3)',
                }}
                elevation={0}
            >
                <Toolbar sx={{ minHeight: 56 }}>
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            flexGrow: 1, 
                            fontWeight: 600,
                            fontSize: '1.25rem',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        Clarity Suite
                        <Tooltip title="Version 2.0" arrow>
                            <Typography 
                                component="span" 
                                sx={{ 
                                    ml: 1, 
                                    fontSize: '0.7rem', 
                                    opacity: 0.8,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    px: 0.8,
                                    py: 0.2,
                                    borderRadius: 1,
                                }}
                            >
                                BETA
                            </Typography>
                        </Tooltip>
                    </Typography>
                    
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Theme Toggle */}
                            <EnhancedTooltip title="Toggle dark/light mode" placement="bottom">
                                <span>
                                    <ThemeToggle onToggle={toggleThemeMode} />
                                </span>
                            </EnhancedTooltip>
                            
                            <EnhancedTooltip title="Keyboard Shortcuts" placement="bottom">
                                <IconButton 
                                    color="inherit" 
                                    sx={{ 
                                        mr: 1,
                                        transition: cssTransitions.fast,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                        }
                                    }}
                                    onClick={handleOpenShortcutsMenu}
                                >
                                    <KeyboardIcon />
                                </IconButton>
                            </EnhancedTooltip>
                            
                            <Menu
                                anchorEl={shortcutsMenuAnchor}
                                open={Boolean(shortcutsMenuAnchor)}
                                onClose={handleCloseShortcutsMenu}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                PaperProps={{
                                    elevation: 3,
                                    sx: {
                                        mt: 1,
                                        borderRadius: 1,
                                        minWidth: 250,
                                    }
                                }}
                            >
                                <MenuItem disabled>
                                    <Typography variant="subtitle2" color="primary">
                                        Panel Controls
                                    </Typography>
                                </MenuItem>
                                <MenuItem>
                                    <ListItemText 
                                        primary="Toggle Left Panel"
                                        secondary="Ctrl/Cmd + ["
                                    />
                                </MenuItem>
                                <MenuItem>
                                    <ListItemText 
                                        primary="Toggle Right Panel"
                                        secondary="Ctrl/Cmd + ]"
                                    />
                                </MenuItem>
                                <MenuItem>
                                    <ListItemText 
                                        primary="Focus Center Panel"
                                        secondary="Ctrl/Cmd + \"
                                    />
                                </MenuItem>
                                <Divider />
                                <MenuItem disabled>
                                    <Typography variant="caption" color="text.secondary">
                                        You can also use the arrow buttons on panel edges
                                    </Typography>
                                </MenuItem>
                            </Menu>
                            
                            <EnhancedTooltip title="Layout Settings" placement="bottom">
                                <IconButton 
                                    color="inherit" 
                                    sx={{ 
                                        mr: 1,
                                        transition: cssTransitions.fast,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                        }
                                    }}
                                    onClick={handleOpenLayoutMenu}
                                >
                                    <ViewQuiltIcon />
                                </IconButton>
                            </EnhancedTooltip>
                            
                            <Menu
                                anchorEl={layoutMenuAnchor}
                                open={Boolean(layoutMenuAnchor)}
                                onClose={handleCloseLayoutMenu}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                PaperProps={{
                                    elevation: 3,
                                    sx: {
                                        mt: 1,
                                        borderRadius: 1,
                                        minWidth: 180,
                                    }
                                }}
                            >
                                <MenuItem onClick={handleResetLayout}>
                                    <ListItemIcon>
                                        <RestoreIcon fontSize="small" />
                                    </ListItemIcon>
                                    Reset Panel Layout
                                </MenuItem>
                                <Divider />
                                <MenuItem disabled>
                                    <Typography variant="caption" color="text.secondary">
                                        Drag the panel dividers to resize
                                    </Typography>
                                </MenuItem>
                            </Menu>
                        
                            <EnhancedTooltip title="Help & Documentation" placement="bottom">
                                <IconButton 
                                    color="inherit" 
                                    sx={{ 
                                        mr: 2,
                                        transition: cssTransitions.fast,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                        }
                                    }}
                                >
                                    <HelpOutlineIcon />
                                </IconButton>
                            </EnhancedTooltip>
                            
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    mr: 2,
                                    opacity: 0.9,
                                    fontWeight: 400,
                                }}
                            >
                                {user.email}
                            </Typography>
                            <EnhancedTooltip title="Logout" placement="bottom">
                                <IconButton 
                                    color="inherit" 
                                    onClick={handleLogout}
                                    sx={{ 
                                        transition: cssTransitions.fast,
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                        }
                                    }}
                                >
                                    <LogoutIcon />
                                </IconButton>
                            </EnhancedTooltip>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Main Content Area (Three Panels with Resize Handles) */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Left Panel - with ref for direct DOM manipulation */}
                <Box ref={leftPanelRef} sx={{ position: 'relative' }}>
                <LeftPanel />
                </Box>
                
                {/* Left Resize Handle - only visible when not collapsed */}
                {!isLeftPanelCollapsed && !isRightPanelCollapsed && (
                <ResizeHandle 
                    onResize={handleResizeLeftPanel} 
                    direction="horizontal"
                    disabled={isSmallScreen}
                />
                )}

                {/* Center Panel - with ref for direct DOM manipulation */}
                <Box 
                    ref={centerPanelRef}
                    sx={{ 
                        flexGrow: 1, 
                        width: getCenterPanelWidth(),
                        transition: !isLeftPanelCollapsed && !isRightPanelCollapsed ? 'none' : 'width 0.3s ease',
                    }}
                >
                <CenterPanel />
                </Box>
                
                {/* Right Resize Handle - only visible when not collapsed */}
                {!isLeftPanelCollapsed && !isRightPanelCollapsed && (
                <ResizeHandle 
                    onResize={handleResizeRightPanel} 
                    direction="horizontal"
                    disabled={isSmallScreen}
                />
                )}

                {/* Right Panel - with ref for direct DOM manipulation */}
                <Box ref={rightPanelRef} sx={{ position: 'relative' }}>
                <RightPanel />
                </Box>
            </Box>
            
            {/* Footer */}
            <Box 
                component="footer"
                sx={{
                    p: 0.75,
                    backgroundColor: theme.palette.grey[100],
                    borderTop: '1px solid',
                    borderColor: theme.palette.divider,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                }}
            >
                <Typography variant="caption" sx={{ ml: 2 }}>
                    Clarity Suite © {new Date().getFullYear()} - Evidence Synthesis Platform
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 2 }}>
                    <Typography 
                        variant="caption" 
                        component="a" 
                        href="#"
                        sx={{ 
                            color: 'inherit', 
                            textDecoration: 'none',
                            '&:hover': { color: theme.palette.primary.main }
                        }}
                    >
                        Terms
                    </Typography>
                    
                    <Typography 
                        variant="caption" 
                        component="a" 
                        href="#"
                        sx={{ 
                            color: 'inherit', 
                            textDecoration: 'none',
                            '&:hover': { color: theme.palette.primary.main }
                        }}
                    >
                        Privacy
                    </Typography>
                    
                    <Typography 
                        variant="caption" 
                        component="a" 
                        href="#"
                        sx={{ 
                            color: 'inherit', 
                            textDecoration: 'none',
                            '&:hover': { color: theme.palette.primary.main }
                        }}
                    >
                        Help Center
                    </Typography>
                    
                    <Typography variant="caption">
                        v2.0.0
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;