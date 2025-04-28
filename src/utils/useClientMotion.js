'use client';

import { animated, useSpring, useTransition, useInView } from 'react-spring';

// This utility creates motion components that are safe to use in both client and server components
// Now using react-spring instead of framer-motion

/**
 * Pre-created motion components with react-spring
 * These provide the same functionality as framer-motion components
 */
export const MotionDiv = animated.div;
export const MotionSpan = animated.span;
export const MotionUl = animated.ul;
export const MotionLi = animated.li;
export const MotionP = animated.p;
export const MotionSection = animated.section;
export const MotionImg = animated.img;
export const MotionH1 = animated.h1;
export const MotionH2 = animated.h2;
export const MotionH3 = animated.h3;
export const MotionButton = animated.button;
export const MotionA = animated.a;

// Re-export react-spring utilities
export { useSpring, useTransition, useInView };

/**
 * Helper function to provide safe animations
 * @param {Object} animationObject - The animation properties to apply
 * @returns {Object} A safe version of the animation object
 */
export function safeAnimation(animationObject) {
  if (!animationObject) return {};
  
  try {
    // Make a deep copy to avoid modifying the original
    const safeCopy = JSON.parse(JSON.stringify(animationObject));
    return safeCopy;
  } catch (e) {
    console.warn('Error creating safe animation object:', e);
    return {};
  }
}

export default {
  MotionDiv,
  MotionSpan,
  MotionUl,
  MotionLi,
  MotionP,
  MotionSection,
  MotionImg,
  MotionH1,
  MotionH2,
  MotionH3,
  MotionButton,
  MotionA,
  safeAnimation,
  useSpring,
  useTransition,
  useInView
}; 