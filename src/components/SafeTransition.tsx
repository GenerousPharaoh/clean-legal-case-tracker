import React, { useRef } from 'react';
import { 
  Fade, 
  Grow,
  Slide,
  Zoom,
  Collapse,
  SlideProps,
  FadeProps,
  GrowProps,
  ZoomProps,
  CollapseProps
} from '@mui/material';

// Common props for all transition components
interface CommonTransitionProps {
  children: React.ReactElement;
  in?: boolean;
  appear?: boolean;
  timeout?: number | { appear?: number; enter?: number; exit?: number };
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
}

/**
 * SafeFade - A properly typed wrapper around MUI Fade with nodeRef
 */
export const SafeFade: React.FC<Omit<FadeProps, 'children'> & { children: React.ReactElement }> = ({ 
  children, 
  ...props 
}) => {
  const nodeRef = useRef(null);
  
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Fade {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </Fade>
  );
};

/**
 * SafeGrow - A properly typed wrapper around MUI Grow with nodeRef
 */
export const SafeGrow: React.FC<Omit<GrowProps, 'children'> & { children: React.ReactElement }> = ({ 
  children, 
  ...props 
}) => {
  const nodeRef = useRef(null);
  
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Grow {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </Grow>
  );
};

/**
 * SafeSlide - A properly typed wrapper around MUI Slide with nodeRef
 */
export const SafeSlide: React.FC<Omit<SlideProps, 'children'> & { children: React.ReactElement }> = ({ 
  children, 
  ...props 
}) => {
  const nodeRef = useRef(null);
  
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Slide {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </Slide>
  );
};

/**
 * SafeZoom - A properly typed wrapper around MUI Zoom with nodeRef
 */
export const SafeZoom: React.FC<Omit<ZoomProps, 'children'> & { children: React.ReactElement }> = ({ 
  children, 
  ...props 
}) => {
  const nodeRef = useRef(null);
  
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Zoom {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </Zoom>
  );
};

/**
 * SafeCollapse - A properly typed wrapper around MUI Collapse with nodeRef
 */
export const SafeCollapse: React.FC<Omit<CollapseProps, 'children'> & { children: React.ReactElement }> = ({ 
  children, 
  ...props 
}) => {
  const nodeRef = useRef(null);
  
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Collapse {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </Collapse>
  );
};

// Export the safe transition components
export default {
  Fade: SafeFade,
  Grow: SafeGrow,
  Slide: SafeSlide,
  Zoom: SafeZoom,
  Collapse: SafeCollapse
}; 