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
  children: React.ReactNode;
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
  return (
    <Fade nodeRef={nodeRef} {...props}>
      <div ref={nodeRef}>
        {children}
      </div>
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
      <div ref={nodeRef}>
        {children}
      </div>
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
      <div ref={nodeRef}>
        {children}
      </div>
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
      <div ref={nodeRef}>
        {children}
      </div>
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
      <div ref={nodeRef}>
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