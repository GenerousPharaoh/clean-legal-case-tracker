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

// Type for all transition components
type TransitionComponentProps = 
  | FadeProps 
  | GrowProps 
  | SlideProps 
  | ZoomProps 
  | CollapseProps;

// Common props for all transition components
interface CommonTransitionProps {
  children: React.ReactElement; // Must be a single React element, not just any ReactNode
  in?: boolean;
  appear?: boolean;
  timeout?: number | { appear?: number; enter?: number; exit?: number };
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
}

/**
 * SafeFade - A safe wrapper around MUI Fade with a proper nodeRef
 */
export const SafeFade: React.FC<FadeProps & CommonTransitionProps> = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  
  // Clone the child element and attach the ref to it
  return (
    <Fade nodeRef={nodeRef} {...props}>
      {React.cloneElement(children, { ref: nodeRef })}
    </Fade>
  );
};

/**
 * SafeGrow - A safe wrapper around MUI Grow with a proper nodeRef
 */
export const SafeGrow: React.FC<GrowProps & CommonTransitionProps> = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  
  return (
    <Grow nodeRef={nodeRef} {...props}>
      {React.cloneElement(children, { ref: nodeRef })}
    </Grow>
  );
};

/**
 * SafeSlide - A safe wrapper around MUI Slide with a proper nodeRef
 */
export const SafeSlide: React.FC<SlideProps & CommonTransitionProps> = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  
  return (
    <Slide nodeRef={nodeRef} {...props}>
      {React.cloneElement(children, { ref: nodeRef })}
    </Slide>
  );
};

/**
 * SafeZoom - A safe wrapper around MUI Zoom with a proper nodeRef
 */
export const SafeZoom: React.FC<ZoomProps & CommonTransitionProps> = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  
  return (
    <Zoom nodeRef={nodeRef} {...props}>
      {React.cloneElement(children, { ref: nodeRef })}
    </Zoom>
  );
};

/**
 * SafeCollapse - A safe wrapper around MUI Collapse with a proper nodeRef
 */
export const SafeCollapse: React.FC<CollapseProps & CommonTransitionProps> = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  
  return (
    <Collapse nodeRef={nodeRef} {...props}>
      {React.cloneElement(children, { ref: nodeRef })}
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