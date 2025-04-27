import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, styled } from '@mui/material';
import { cssTransitions } from '../utils/transitions';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  direction: 'horizontal' | 'vertical';
  disabled?: boolean;
  thickness?: number;
  color?: string;
  hoverColor?: string;
  activeColor?: string;
}

const StyledResizeHandle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isHovering' && prop !== 'direction' && prop !== 'thickness',
})<{
  isActive: boolean;
  isHovering: boolean;
  direction: 'horizontal' | 'vertical';
  thickness: number;
  $color: string;
  $hoverColor: string;
  $activeColor: string;
}>(({ isActive, isHovering, direction, thickness, $color, $hoverColor, $activeColor }) => ({
  position: 'relative',
  flex: 'none',
  width: direction === 'horizontal' ? `${thickness}px` : '100%',
  height: direction === 'vertical' ? `${thickness}px` : '100%',
  background: 'transparent',
  cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
  zIndex: 10,

  '&::after': {
    content: '""',
    position: 'absolute',
    top: direction === 'horizontal' ? 0 : '50%',
    left: direction === 'horizontal' ? '50%' : 0,
    transform: direction === 'horizontal' 
      ? 'translateX(-50%)' 
      : 'translateY(-50%)',
    width: direction === 'horizontal' ? '3px' : '100%',
    height: direction === 'horizontal' ? '100%' : '3px',
    backgroundColor: isActive 
      ? $activeColor 
      : isHovering 
        ? $hoverColor 
        : $color,
    transition: isActive ? 'none' : cssTransitions.fast,
  },

  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },

  '&:active': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
}));

/**
 * ResizeHandle - A draggable handle to resize adjacent elements
 * 
 * Place this component between panels to make them resizable.
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  direction = 'horizontal',
  disabled = false,
  thickness = 8,
  color = 'rgba(0, 0, 0, 0.1)',
  hoverColor = 'rgba(25, 118, 210, 0.5)',
  activeColor = 'rgba(25, 118, 210, 0.8)',
}) => {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const startPosRef = useRef(0);
  const lastPosRef = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  
  // Use requestAnimationFrame for smoother resizing
  const applyResize = useCallback((currentPos: number) => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    
    if (lastPosRef.current === currentPos) return;
    
    const delta = currentPos - lastPosRef.current;
    if (delta !== 0) {
      onResize(delta);
      lastPosRef.current = currentPos;
    }
  }, [onResize]);

  useEffect(() => {
    if (disabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      
      // Get current position based on direction
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      
      // Use requestAnimationFrame for smoother resize updates
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      
      frameRef.current = requestAnimationFrame(() => {
        applyResize(currentPos);
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Cancel any pending animation frame
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      
      // Remove global event listeners when not dragging
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [dragging, direction, applyResize, disabled]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    
    // Initial position
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    startPosRef.current = currentPos;
    lastPosRef.current = currentPos;
    
    setDragging(true);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
  };

  return (
    <StyledResizeHandle
      ref={handleRef}
      isActive={dragging}
      isHovering={hovering}
      direction={direction}
      thickness={thickness}
      $color={color}
      $hoverColor={hoverColor}
      $activeColor={activeColor}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      sx={{
        opacity: disabled ? 0.3 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        touchAction: 'none', // Prevent scrolling while dragging on touch screens
      }}
    />
  );
};

export default ResizeHandle; 