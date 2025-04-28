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

/**
 * DirectFade - An alternative approach for MUI Fade with nodeRef
 * Instead of cloning the child, we simply pass the ref to the first child directly
 */
export const DirectFade = React.forwardRef<HTMLElement, FadeProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    <Fade {...props} nodeRef={nodeRef}>
      {props.children}
    </Fade>
  );
});

/**
 * DirectGrow - An alternative approach for MUI Grow with nodeRef
 */
export const DirectGrow = React.forwardRef<HTMLElement, GrowProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    <Grow {...props} nodeRef={nodeRef}>
      {props.children}
    </Grow>
  );
});

/**
 * DirectSlide - An alternative approach for MUI Slide with nodeRef
 */
export const DirectSlide = React.forwardRef<HTMLElement, SlideProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    <Slide {...props} nodeRef={nodeRef}>
      {props.children}
    </Slide>
  );
});

/**
 * DirectZoom - An alternative approach for MUI Zoom with nodeRef
 */
export const DirectZoom = React.forwardRef<HTMLElement, ZoomProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    <Zoom {...props} nodeRef={nodeRef}>
      {props.children}
    </Zoom>
  );
});

/**
 * DirectCollapse - An alternative approach for MUI Collapse with nodeRef
 */
export const DirectCollapse = React.forwardRef<HTMLElement, CollapseProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    <Collapse {...props} nodeRef={nodeRef}>
      {props.children}
    </Collapse>
  );
});

// Export the direct transition components
export default {
  Fade: DirectFade,
  Grow: DirectGrow,
  Slide: DirectSlide,
  Zoom: DirectZoom,
  Collapse: DirectCollapse
}; 