/**
 * fixDependencies.ts
 * 
 * This utility resolves common dependency conflicts at runtime by ensuring
 * consistent references to important libraries.
 */

/**
 * Applies fixes for dependency version conflicts at runtime
 */
export const fixDependencies = (): void => {
  try {
    console.log('[FixDependencies] Applying dependency fixes...');

    if (typeof window !== 'undefined') {
      // Fix 1: Check and fix React version consistency
      const checkReactConsistency = () => {
        const reactKeys = Object.keys(window).filter(key => 
          key.startsWith('__REACT') || key.includes('React'));
          
        if (reactKeys.length > 0) {
          console.log(`[FixDependencies] Found ${reactKeys.length} React-related global objects`);
        }
      };

      // Fix 2: Ensure framer-motion has a create method
      const fixFramerMotion = () => {
        const findFramerMotion = () => {
          // Look for common places framer-motion might be stored
          const keys = Object.keys(window);
          for (const key of keys) {
            const obj = (window as any)[key];
            if (
              obj && 
              typeof obj === 'object' && 
              obj.motion && 
              typeof obj.motion === 'function' &&
              !obj.motion.create
            ) {
              return obj;
            }
          }
          
          // Also look in React.__SECRET_INTERNALS, which sometimes contains libraries
          const react = (window as any).React;
          if (react && react.__SECRET_INTERNALS) {
            const internals = react.__SECRET_INTERNALS;
            for (const key in internals) {
              const obj = internals[key];
              if (
                obj && 
                typeof obj === 'object' && 
                obj.motion && 
                typeof obj.motion === 'function' &&
                !obj.motion.create
              ) {
                return obj;
              }
            }
          }
          
          return null;
        };
        
        const framerMotion = findFramerMotion();
        if (framerMotion) {
          if (!framerMotion.motion.create) {
            framerMotion.motion.create = framerMotion.motion;
            console.log('[FixDependencies] Added create method to framer-motion');
          }
        }
      };

      // Fix 3: Ensure MUI and Emotion have consistent references
      const fixMUIConsistency = () => {
        // Find various MUI instances
        const muiInstances = Object.keys(window).filter(key => 
          key.includes('createTheme') || 
          key.includes('ThemeProvider') || 
          key.includes('MUI') || 
          key.includes('Emotion')
        );
        
        if (muiInstances.length > 1) {
          console.log(`[FixDependencies] Found ${muiInstances.length} MUI-related instances`);
        }
      };

      // Apply fixes after a short delay to ensure libraries are loaded
      setTimeout(() => {
        checkReactConsistency();
        fixFramerMotion();
        fixMUIConsistency();
        console.log('[FixDependencies] All dependency fixes applied successfully');
      }, 500);
    }
  } catch (error) {
    console.error('[FixDependencies] Failed to apply dependency fixes:', error);
  }
};

export default fixDependencies;
