'use client';

import React from 'react';
import { 
  animated, 
  useSpring, 
  useSprings, 
  useTransition, 
  useTrail, 
  useChain, 
  useInView 
} from 'react-spring';

/**
 * React Spring animation utilities
 * This file provides replacements for framer-motion components
 * with react-spring equivalents
 */

// Pre-created animated components to use in place of framer-motion's motion components
export const SpringDiv = animated.div;
export const SpringSpan = animated.span;
export const SpringUl = animated.ul;
export const SpringLi = animated.li;
export const SpringP = animated.p;
export const SpringSection = animated.section;
export const SpringImg = animated.img;
export const SpringH1 = animated.h1;
export const SpringH2 = animated.h2;
export const SpringH3 = animated.h3;
export const SpringButton = animated.button;
export const SpringA = animated.a;

/**
 * Transition component to replace framer-motion's AnimatePresence
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The elements to animate
 * @param {boolean} props.show - Whether to show the elements
 * @param {Object} props.config - Animation configuration
 * @returns {React.ReactElement} Animated transition component
 */
export const SpringTransition = ({ 
  children, 
  show, 
  config = { tension: 125, friction: 20, precision: 0.001 }, 
  from = { opacity: 0, y: 20 }, 
  enter = { opacity: 1, y: 0 }, 
  leave = { opacity: 0, y: -20 },
  trail = 0
}) => {
  const transitions = useTransition(show ? [children] : [], {
    from,
    enter,
    leave,
    trail,
    config
  });
  
  return transitions((styles, item) => 
    item ? <animated.div style={styles}>{item}</animated.div> : null
  );
};

/**
 * Utility to create spring animations for common use cases
 * 
 * @param {string} type - Animation type (fade, slide, etc.)
 * @param {Object} options - Animation options
 * @returns {Object} Spring animation configuration
 */
export const useSpringAnimation = (type, options = {}) => {
  const defaults = {
    config: { tension: 280, friction: 60 }
  };
  
  const mergedOptions = { ...defaults, ...options };
  
  switch (type) {
    case 'fade':
      return useSpring({
        from: { opacity: 0 },
        to: { opacity: 1 },
        ...mergedOptions
      });
      
    case 'slideUp':
      return useSpring({
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        ...mergedOptions
      });
      
    case 'slideDown':
      return useSpring({
        from: { opacity: 0, y: -20 },
        to: { opacity: 1, y: 0 },
        ...mergedOptions
      });
      
    case 'scale':
      return useSpring({
        from: { opacity: 0, scale: 0.9 },
        to: { opacity: 1, scale: 1 },
        ...mergedOptions
      });
      
    case 'rotate':
      return useSpring({
        from: { opacity: 0, rotate: 0 },
        to: { opacity: 1, rotate: options.value || 180 },
        ...mergedOptions
      });
      
    default:
      return useSpring(mergedOptions);
  }
};

export default {
  SpringDiv,
  SpringSpan,
  SpringUl,
  SpringLi,
  SpringP,
  SpringSection,
  SpringImg,
  SpringH1,
  SpringH2,
  SpringH3,
  SpringButton,
  SpringA,
  SpringTransition,
  useSpringAnimation,
  useSpring,
  useSprings,
  useTransition,
  useTrail,
  useChain,
  useInView
}; 