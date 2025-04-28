import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styled from '@emotion/styled';
import { cssTransitions } from '../utils/transitions';
import { getTransition, getShadow } from '../utils/themeUtils';
import { Zoom } from './SafeTransitions';

interface PanelCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  position: 'left' | 'right';
  size?: 'small' | 'medium';
  label?: string;
}

// Styled button with enhanced hover effect
const StyledIconButton = styled(IconButton)<{ isCollapsed: boolean; theme: any }>(({ isCollapsed, theme }) => `
  background-color: ${theme.palette.background.paper};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1200;
  border: 1px solid ${theme.palette.divider};
  box-shadow: ${isCollapsed ? theme.shadows[2] : '0 1px 2px rgba(0,0,0,0.08)'};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  color: ${isCollapsed ? theme.palette.primary.main : theme.palette.text.secondary};
  
  &:hover {
    background-color: ${isCollapsed ? theme.palette.primary.light + '15' : theme.palette.action.hover};
    transform: translateY(-50%) ${isCollapsed ? 'scale(1.08)' : 'scale(1.05)'};
    box-shadow: ${isCollapsed ? theme.shadows[4] : theme.shadows[2]};
    color: ${isCollapsed ? theme.palette.primary.main : theme.palette.text.primary};
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`);

/**
 * PanelCollapseButton - A button for collapsing and expanding panels
 */
const PanelCollapseButton: React.FC<PanelCollapseButtonProps> = ({
  isCollapsed,
  onToggle,
  position,
  size = 'small',
  label = position === 'left' 
    ? (isCollapsed ? 'Expand Panel' : 'Collapse Panel')
    : (isCollapsed ? 'Expand Panel' : 'Collapse Panel')
}) => {
  const theme = useTheme();
  
  return (
    <Tooltip 
      title={label} 
      placement={position === 'left' ? 'right' : 'left'}
      arrow
      TransitionComponent={Zoom}
      enterDelay={300}
      leaveDelay={200}
    >
      <StyledIconButton
        onClick={onToggle}
        size={size}
        isCollapsed={isCollapsed}
        theme={theme}
        aria-label={label}
        sx={{
          height: size === 'small' ? 28 : 36,
          width: size === 'small' ? 28 : 36,
          // Subtle pulsing animation when collapsed
          animation: isCollapsed 
            ? 'subtlePulse 3s ease-in-out infinite'
            : 'none',
          '@keyframes subtlePulse': {
            '0%': { boxShadow: theme.shadows[2] },
            '50%': { boxShadow: theme.shadows[4] },
            '100%': { boxShadow: theme.shadows[2] },
          },
          // Position on the edge of the panel
          ...(position === 'left' 
            ? { 
                left: isCollapsed ? 12 : -14,
                borderRadius: '0 40% 40% 0',
                borderLeft: 'none',
              } 
            : { 
                right: isCollapsed ? 12 : -14,
                borderRadius: '40% 0 0 40%',
                borderRight: 'none',
              })
        }}
      >
        {position === 'left' 
          ? (isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />)
          : (isCollapsed ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />)
        }
      </StyledIconButton>
    </Tooltip>
  );
};

export default PanelCollapseButton;