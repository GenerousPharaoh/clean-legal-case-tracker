/**
 * SafeTransitions.tsx
 * 
 * This file provides safe versions of Material-UI transition components that avoid
 * PropType validation errors related to nodeRef. These components can be used as drop-in
 * replacements for the standard MUI transitions.
 */

import React, { useRef } from 'react';
import {
  Fade as MuiFade,
  Grow as MuiGrow,
  Slide as MuiSlide,
  Zoom as MuiZoom,
  Collapse as MuiCollapse,
  FadeProps,
  GrowProps,
  SlideProps,
  ZoomProps,
  CollapseProps
} from '@mui/material';

/**
 * Safe version of MUI Fade transition
 */
export const Fade: React.FC<FadeProps> = (props) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is a valid prop at runtime
    <MuiFade {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </MuiFade>
  );
};

/**
 * Safe version of MUI Grow transition
 */
export const Grow: React.FC<GrowProps> = (props) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is a valid prop at runtime
    <MuiGrow {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </MuiGrow>
  );
};

/**
 * Safe version of MUI Slide transition
 */
export const Slide: React.FC<SlideProps> = (props) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is a valid prop at runtime
    <MuiSlide {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </MuiSlide>
  );
};

/**
 * Safe version of MUI Zoom transition
 */
export const Zoom: React.FC<ZoomProps> = (props) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is a valid prop at runtime
    <MuiZoom {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </MuiZoom>
  );
};

/**
 * Safe version of MUI Collapse transition
 */
export const Collapse: React.FC<CollapseProps> = (props) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is a valid prop at runtime
    <MuiCollapse {...props} nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </MuiCollapse>
  );
};

/**
 * Export all safe transitions as a default object
 */
export default {
  Fade,
  Grow,
  Slide,
  Zoom,
  Collapse
}; 