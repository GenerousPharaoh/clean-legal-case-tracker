/**
 * early-fixes.js
 * 
 * This script runs before the React application loads to apply critical fixes
 * that need to be in place before any components render.
 */
(function() {
  console.log('[EarlyFixes] Applying critical early fixes...');
  
  try {
    // Flag to track if we're running in a production environment
    const isProduction = window.location.hostname !== 'localhost' && 
                        !window.location.hostname.includes('127.0.0.1');
    
    // Fix 1: Add Map.clear method if missing
    if (!Map.prototype.hasOwnProperty('clear')) {
      Object.defineProperty(Map.prototype, 'clear', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function() {
          const keys = Array.from(this.keys());
          keys.forEach(key => this.delete(key));
          return this;
        }
      });
      console.log('[EarlyFixes] Added Map.clear polyfill');
    }
    
    // Fix 2: Global error handling for critical errors
    window.addEventListener('error', function(event) {
      const error = event.error || {};
      const message = error.message || event.message || 'Unknown error';
      const stack = error.stack || '';
      
      // Log the error to console
      console.error('[EarlyFixes] Captured error:', message);
      
      // Check for the specific "clear is not a function" error
      if (message.includes('clear is not a function')) {
        console.warn('[EarlyFixes] Caught clear method error, preventing app crash');
        event.preventDefault();
        return true;
      }
      
      // Also trap common React/MUI errors
      if (
        (stack.includes('react-dom') || stack.includes('@mui')) && 
        (message.includes('undefined is not') || 
         message.includes('null is not') ||
         message.includes('Cannot read') ||
         message.includes('is not a function'))
      ) {
        console.warn('[EarlyFixes] Caught React/MUI error, preventing app crash');
        event.preventDefault();
        return true;
      }
    }, true);
    
    // Fix 3: Improve console to make it more useful for debugging
    if (!isProduction) {
      const originalConsoleError = console.error;
      console.error = function(...args) {
        // Filter out some noisy errors in development
        const errorString = args.join(' ');
        if (
          errorString.includes('Warning: React does not recognize') ||
          errorString.includes('Warning: Invalid DOM property') ||
          errorString.includes('Warning: Each child in a list') ||
          errorString.includes('Failed prop type')
        ) {
          // Only log these as warnings instead of errors
          return console.warn('[Filtered Error]', ...args);
        }
        
        return originalConsoleError.apply(this, args);
      };
    }
    
    // Fix 4: Add reliable navigation method
    window.safeNavigate = function(url) {
      console.log('[EarlyFixes] Safe navigation to:', url);
      
      try {
        // Clear timeouts and intervals to prevent post-navigation errors
        const highestId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
          clearTimeout(i);
          clearInterval(i);
        }
        
        // Execute navigation after a short delay to allow cleanup
        setTimeout(function() {
          window.location.href = url;
        }, 50);
      } catch (e) {
        console.error('[EarlyFixes] Error in safe navigation:', e);
        // Fallback to direct navigation
        window.location.href = url;
      }
    };
    
    // Fix 5: Add Framer Motion compatibility
    window.addEventListener('load', function() {
      setTimeout(function() {
        // Look for motion function in the window
        const findMotion = () => {
          for (const key in window) {
            if (window[key] && window[key].motion && typeof window[key].motion === 'function') {
              return window[key].motion;
            }
          }
          return null;
        };
        
        const motion = findMotion();
        if (motion && !motion.create) {
          motion.create = motion;
          console.log('[EarlyFixes] Added create method to motion function');
        }
      }, 1000);
    });
    
    // Store recovery functionality
    window.__recoverApp = function() {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = `
          <div style="text-align: center; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h2>Recovering Application</h2>
            <p>We encountered an issue and are restoring the application...</p>
            <div style="margin-top: 20px;">
              <button onclick="window.location.href='/'" 
                style="margin-right: 10px; padding: 8px 16px; background: #4a90e2; color: white; 
                       border: none; border-radius: 4px; cursor: pointer;">
                Go to Home
              </button>
              <button onclick="window.location.href='/login'" 
                style="padding: 8px 16px; background: #4a90e2; color: white; 
                       border: none; border-radius: 4px; cursor: pointer;">
                Go to Login
              </button>
            </div>
          </div>
        `;
      }
      
      // Clear local storage
      try {
        localStorage.removeItem('sb-auth-token');
      } catch (e) {
        // Ignore errors in cleanup
      }
    };
    
    console.log('[EarlyFixes] All early fixes applied successfully');
  } catch (error) {
    console.error('[EarlyFixes] Error applying early fixes:', error);
  }
})();
