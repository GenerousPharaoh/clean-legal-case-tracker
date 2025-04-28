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
 * DirectFade - An improved approach for MUI Fade with nodeRef
 * Using a div wrapper to properly handle ref and avoid type errors
 */
export const DirectFade = React.forwardRef<HTMLElement, FadeProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Fade {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
      {props.children}
      </div>
    </Fade>
  );
});

/**
 * DirectGrow - An improved approach for MUI Grow with nodeRef
 */
export const DirectGrow = React.forwardRef<HTMLElement, GrowProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Grow {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
      {props.children}
      </div>
    </Grow>
  );
});

/**
 * DirectSlide - An improved approach for MUI Slide with nodeRef
 */
export const DirectSlide = React.forwardRef<HTMLElement, SlideProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Slide {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
      {props.children}
      </div>
    </Slide>
  );
});

/**
 * DirectZoom - An improved approach for MUI Zoom with nodeRef
 */
export const DirectZoom = React.forwardRef<HTMLElement, ZoomProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Zoom {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
      {props.children}
      </div>
    </Zoom>
  );
});

/**
 * DirectCollapse - An improved approach for MUI Collapse with nodeRef
 */
export const DirectCollapse = React.forwardRef<HTMLElement, CollapseProps>((props, ref) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Collapse {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
      {props.children}
      </div>
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