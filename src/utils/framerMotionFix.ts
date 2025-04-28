/**
 * framerMotionFix.ts
 * 
 * This utility addresses the warning: 
 * "motion() is deprecated. Use motion.create() instead."
 */

import { useEffect } from 'react';

export function useFramerMotionFix() {
  useEffect(() => {
    try {
      // Check if framer-motion is loaded
      if (typeof window !== 'undefined' && window.document) {
        // Create a polyfill for motion.create if it's missing
        const patchFramerMotion = () => {
          // Find potential instances of the framer-motion library
          Object.entries(window).forEach(([key, value]) => {
            // Look for an object that might be framer-motion's exports
            if (
              typeof value === 'object' && 
              value !== null && 
              typeof value.motion === 'function' &&
              !value.motion.create
            ) {
              // Add the motion.create method
              value.motion.create = value.motion;
              console.log('[FramerMotionFix] Added motion.create method');
            }
          });
        };
        
        // Run the fix immediately and also after all scripts have loaded
        patchFramerMotion();
        window.addEventListener('load', patchFramerMotion);
        
        // Clean up
        return () => {
          window.removeEventListener('load', patchFramerMotion);
        };
      }
    } catch (error) {
      console.error('[FramerMotionFix] Error applying framer-motion fix:', error);
    }
  }, []);
}
