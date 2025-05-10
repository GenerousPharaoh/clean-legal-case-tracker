import React, { useEffect, Children, ReactElement, cloneElement, useState, useRef } from 'react';
import { Box, IconButton, Tooltip, Typography, alpha } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels';
import useAppStore from '../store';
import { usePanelState } from '../hooks/usePanelState';

// Minimum size for collapsed panels - ABSOLUTE MINIMUM to ensure visibility
const MIN_COLLAPSED_SIZE = 5;
// Fixed size for collapsed panels
const COLLAPSED_PANEL_SIZE = 8;
// Animation durations
const TRANSITION_DURATION = '200ms';

// Resize handle component with professional, subtle styling
const ResizeHandle = ({ id, disabled = false }: { 
  id: string;
  disabled?: boolean;
}) => {
  return (
    <PanelResizeHandle id={id} disabled={disabled}>
          <Box
            sx={{
          width: '8px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `all ${TRANSITION_DURATION} ease`,
          opacity: disabled ? 0 : 0.5,
              cursor: disabled ? 'default' : 'col-resize',
          '&:hover': {
            opacity: disabled ? 0 : 0.8,
            backgroundColor: (theme) => disabled ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          },
          '&:active': {
            opacity: disabled ? 0 : 1,
            backgroundColor: (theme) => disabled ? 'transparent' : alpha(theme.palette.primary.main, 0.1),
          },
          '&::after': {
            content: '""',
            height: '40%',
            width: '2px',
            borderRadius: '2px',
            backgroundColor: (theme) => disabled 
              ? 'transparent' 
              : alpha(theme.palette.text.secondary, 0.3),
            transition: 'all 0.2s ease',
          },
          zIndex: 10,
      }}
      />
    </PanelResizeHandle>
  );
};

// Panel header container with fold/expand button
interface PanelHeaderProps {
  children: React.ReactNode;
  isLeft?: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const PanelHeader = ({ children, isLeft = false, isCollapsed, onToggle }: PanelHeaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 2,
      height: '48px',
      borderBottom: '1px solid',
      borderColor: (theme) => theme.palette.divider,
      bgcolor: (theme) => theme.palette.mode === 'dark' 
        ? alpha(theme.palette.primary.dark, 0.15)
        : alpha(theme.palette.primary.light, 0.08),
      transition: `all ${TRANSITION_DURATION} ease`,
      boxShadow: (theme) => `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
      zIndex: 5,
      position: 'relative',
    }}
  >
    {isLeft ? (
      <>
        {isCollapsed ? (
          <Typography
            variant="body2"
            sx={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              textAlign: 'center',
              fontWeight: 500,
              color: 'text.primary',
              flexGrow: 1,
              my: 2,
            }}
          >
            Projects
          </Typography>
        ) : (
          children
        )}
        <Tooltip title={isCollapsed ? 'Expand panel' : 'Collapse panel'}>
            <IconButton
              data-test={isCollapsed ? "unfold-left-tab" : "fold-left-button"}
              size="small"
              onClick={onToggle}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand left panel' : 'Collapse left panel'}
            sx={{ 
              minWidth: '28px', 
              minHeight: '28px',
              color: 'text.secondary',
            }}
            >
            <ChevronLeft fontSize="small" />
            </IconButton>
        </Tooltip>
      </>
    ) : (
      <>
        <Tooltip title={isCollapsed ? 'Expand panel' : 'Collapse panel'}>
            <IconButton
              data-test={isCollapsed ? "unfold-right-tab" : "fold-right-button"}
              size="small"
              onClick={onToggle}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand right panel' : 'Collapse right panel'}
            sx={{ 
              minWidth: '28px', 
              minHeight: '28px',
              color: 'text.secondary',
            }}
            >
            <ChevronRight fontSize="small" />
            </IconButton>
        </Tooltip>
        {isCollapsed ? (
          <Typography
            variant="body2"
            sx={{
              writingMode: 'vertical-rl',
              textAlign: 'center',
              fontWeight: 500,
              color: 'text.primary',
              flexGrow: 1,
              my: 2,
            }}
          >
            Details
          </Typography>
        ) : (
          children
        )}
      </>
    )}
  </Box>
);

export interface ResizablePanelsProps {
  children: React.ReactNode;
  initialSizes?: number[];
  minSizes?: number[];
}

export const ResizablePanels = ({
  children,
  initialSizes = [20, 60, 20],
  minSizes = [10, 30, 10],
}: ResizablePanelsProps) => {
  const childrenArray = Children.toArray(children) as ReactElement[];
  const panelGroupRef = useRef<any>(null);
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const centerPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  
  // Validate children
  if (childrenArray.length !== 3) {
    console.error('ResizablePanels requires exactly 3 child components');
    return null;
  }
  
  // Get panel states from the store
  const panelSizes = useAppStore(state => state.panelSizes);
  const leftCollapsed = useAppStore(state => state.leftCollapsed);
  const rightCollapsed = useAppStore(state => state.rightCollapsed);
  const setPanelSizes = useAppStore(state => state.setPanelSizes);
  const toggleLeft = useAppStore(state => state.toggleLeft);
  const toggleRight = useAppStore(state => state.toggleRight);
  
  // Track current sizes for resize handle rendering
  const [currentSizes, setCurrentSizes] = useState<number[]>(
    panelSizes.length === 3 ? panelSizes : initialSizes
  );
  
  // Enforce absolute minimum sizes
  const absoluteMinSizes = minSizes.map(size => Math.max(size, MIN_COLLAPSED_SIZE));
  
  // Calculate maxSizes for each panel based on other panels' minimum sizes
  const calculateMaxSizes = () => {
    const sumOfOtherMinSizes = absoluteMinSizes.reduce((sum, size) => sum + size, 0);
    return absoluteMinSizes.map((_, i) => {
      const otherMinSizes = sumOfOtherMinSizes - absoluteMinSizes[i];
      return 100 - otherMinSizes;
    });
  };
  
  const maxSizes = calculateMaxSizes();
  
  // Get effective panel sizes based on collapse state
  const getEffectiveSizes = () => {
    const sizes = [...(panelSizes.length === 3 ? panelSizes : initialSizes)];
    
    // Set collapsed panels to their fixed size
    if (leftCollapsed) {
      sizes[0] = COLLAPSED_PANEL_SIZE;
    }
    
    if (rightCollapsed) {
      sizes[2] = COLLAPSED_PANEL_SIZE;
    }
    
    // Adjust center panel to fill remaining space
    const totalSideSpace = sizes[0] + sizes[2];
    sizes[1] = 100 - totalSideSpace;
    
    return sizes;
  };
  
  // Panel resize handler with improved clamping
  const handleResize = (sizes: number[]) => {
    // Skip resize if either panel is collapsed (we'll handle this in useEffect)
    if (leftCollapsed || rightCollapsed) {
      return;
    }
    
    // Ensure minimum sizes are respected by clamping
    const safe = sizes.map((size, index) => Math.max(size, absoluteMinSizes[index]));
    
    // Store current sizes for resize handle rendering
    setCurrentSizes(safe);
    
    // Apply clamped values back to the panel group if needed
    if (JSON.stringify(safe) !== JSON.stringify(sizes) && panelGroupRef.current) {
      panelGroupRef.current.setLayout(safe);
    }
    
    // Only update store if sizes have actually changed
    if (JSON.stringify(safe) !== JSON.stringify(panelSizes)) {
      setPanelSizes(safe);
    }
  };
  
  // Use either stored panel sizes or initialSizes prop, with collapsed adjustments
  const activeSizes = getEffectiveSizes();
  
  // Enforce collapsed panel sizes and handle panel collapse/expand programmatically
  useEffect(() => {
    // Calculate new sizes based on collapse state
    const newSizes = getEffectiveSizes();
    setCurrentSizes(newSizes);
    
    // Only update the store if sizes have changed
    if (JSON.stringify(newSizes) !== JSON.stringify(panelSizes)) {
      setPanelSizes(newSizes);
    }
    
    // Programmatically collapse/expand panels using refs
    if (leftPanelRef.current) {
      if (leftCollapsed) {
        leftPanelRef.current.collapse();
      } else {
        leftPanelRef.current.expand();
      }
    }
    
    if (rightPanelRef.current) {
      if (rightCollapsed) {
        rightPanelRef.current.collapse();
      } else {
        rightPanelRef.current.expand();
      }
    }
  }, [leftCollapsed, rightCollapsed]);
  
  const { selectedNoteId, selectedFileId } = usePanelState();
  
  // Auto-collapse/expand center & right panels based on selection
  useEffect(() => {
    if (centerPanelRef.current) {
      if (!selectedNoteId) {
        centerPanelRef.current.collapse();
      } else {
        centerPanelRef.current.expand();
      }
    }
    if (rightPanelRef.current) {
      if (!selectedFileId) {
        rightPanelRef.current.collapse();
      } else {
        rightPanelRef.current.expand();
      }
    }
  }, [selectedNoteId, selectedFileId]);
  
  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%',
      position: 'relative',
      borderRadius: 1,
      overflow: 'hidden',
      boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
    }}>
      <PanelGroup
        ref={panelGroupRef}
        direction="horizontal"
        onLayout={handleResize}
        autoSaveId="clarity-hub-panels"
        style={{ height: '100%' }}
      >
        {/* Left Panel */}
        <Panel
          id="left-panel"
          data-test="left-panel"
          ref={leftPanelRef}
          minSize={leftCollapsed ? COLLAPSED_PANEL_SIZE : absoluteMinSizes[0]}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxWidth: '100%',
              transition: `all ${TRANSITION_DURATION} ease`,
              bgcolor: 'background.paper',
              borderRight: 1,
                borderColor: 'divider',
              boxShadow: (theme) => `inset -2px 0 5px ${alpha(theme.palette.common.black, 0.02)}`,
            }}
          >
            {cloneElement(childrenArray[0], {
              isCollapsed: leftCollapsed,
              onToggleCollapse: toggleLeft,
              panelWidth: leftCollapsed ? 'collapsed' : 'expanded',
              headerComponent: (headerContent: React.ReactNode) => (
                <PanelHeader isLeft isCollapsed={leftCollapsed} onToggle={toggleLeft}>
                  {headerContent}
                </PanelHeader>
              ),
            })}
          </Box>
        </Panel>
        
        {/* Resize Handle for Left Panel - Disabled when collapsed */}
        <ResizeHandle 
          id="left-resize-handle" 
          disabled={leftCollapsed}
        />
        
        {/* Center Panel */}
        <Panel
          id="center-panel"
          data-test="center-panel"
          ref={centerPanelRef}
          minSize={absoluteMinSizes[1]}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: `all ${TRANSITION_DURATION} ease`,
              backgroundColor: 'background.paper',
              boxShadow: (theme) => `0 0 8px ${alpha(theme.palette.common.black, 0.08)}`,
              position: 'relative',
              zIndex: 2,
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.05)}`,
            }}
          >
            {cloneElement(childrenArray[1], {
              panelWidth: 'center',
            })}
          </Box>
        </Panel>
        
        {/* Resize Handle for Right Panel - Disabled when collapsed */}
        <ResizeHandle 
          id="right-resize-handle" 
          disabled={rightCollapsed}
        />
        
        {/* Right Panel */}
        <Panel
          id="right-panel"
          data-test="right-panel"
          ref={rightPanelRef}
          minSize={rightCollapsed ? COLLAPSED_PANEL_SIZE : absoluteMinSizes[2]}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxWidth: '100%',
              transition: `all ${TRANSITION_DURATION} ease`,
              bgcolor: 'background.paper',
              borderLeft: 1,
                borderColor: 'divider',
              boxShadow: (theme) => `inset 2px 0 5px ${alpha(theme.palette.common.black, 0.02)}`,
            }}
          >
            {cloneElement(childrenArray[2], {
              isCollapsed: rightCollapsed,
              onToggleCollapse: toggleRight,
              panelWidth: rightCollapsed ? 'collapsed' : 'expanded',
              headerComponent: (headerContent: React.ReactNode) => (
                <PanelHeader isLeft={false} isCollapsed={rightCollapsed} onToggle={toggleRight}>
                  {headerContent}
                </PanelHeader>
              ),
            })}
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
};

export default ResizablePanels; 