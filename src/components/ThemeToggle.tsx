import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { animated, useSpring } from 'react-spring';

interface ThemeToggleProps {
  onToggle: () => void;
}

/**
 * ThemeToggle - A visually appealing toggle button for switching between light and dark mode
 * Now using react-spring for animations
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ onToggle }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Animation for rotation when theme changes
  const springProps = useSpring({
    rotate: isDarkMode ? 180 : 0,
    config: { 
      tension: 200, 
      friction: 20,
      precision: 0.001
    }
  });

  return (
    <Tooltip title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={onToggle}
        color="inherit"
        aria-label="toggle theme"
        sx={{
          transition: 'transform 0.3s ease, background-color 0.3s ease',
          '&:hover': {
            transform: 'rotate(10deg)',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <animated.div style={springProps}>
          {isDarkMode ? (
            <Brightness7Icon fontSize="small" />
          ) : (
            <Brightness4Icon fontSize="small" />
          )}
        </animated.div>
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
