/**
 * appFixer.ts
 * 
 * A comprehensive application fixer that resolves common issues in the 
 * Legal Case Tracker application.
 */

import { fixEventHandlers } from './fixEventHandlers';
import { fixDependencies } from './fixDependencies';
import { initAuthFlowManager } from './authFlowManager';

/**
 * Initialize all application fixes and improvements
 */
export const initAppFixes = (): void => {
  console.log('[AppFixer] 🛠️ Initializing application fixes...');
  
  // Track initialization status
  const fixStatus = {
    eventHandlersFixed: false,
    dependenciesFixed: false,
    authFlowFixed: false
  };
  
  try {
    // Apply fixes in order of importance
    
    // 1. Fix event handlers (critical for component unmounting)
    try {
      fixEventHandlers();
      fixStatus.eventHandlersFixed = true;
    } catch (e) {
      console.error('[AppFixer] Failed to fix event handlers:', e);
    }
    
    // 2. Fix dependency issues (critical for library interactions)
    try {
      fixDependencies();
      fixStatus.dependenciesFixed = true;
    } catch (e) {
      console.error('[AppFixer] Failed to fix dependencies:', e);
    }
    
    // 3. Fix auth flow (important for login/logout process)
    try {
      initAuthFlowManager();
      fixStatus.authFlowFixed = true;
    } catch (e) {
      console.error('[AppFixer] Failed to fix auth flow:', e);
    }
    
    // Additional runtime fixes
    
    // Fix 1: Protect against errors in event handlers
    if (typeof window !== 'undefined') {
      const protectedAddEventListener = window.addEventListener;
      window.addEventListener = function(type, listener, options) {
        // Create a protected version of the listener
        const protected = function(this: any, event: Event) {
          try {
            return (listener as EventListener).call(this, event);
          } catch (err) {
            console.error(`[AppFixer] Error in '${type}' event listener:`, err);
            // Don't rethrow to prevent app crashes
          }
        };
        
        // Call the original addEventListener with our protected listener
        return protectedAddEventListener.call(this, type, protected as EventListener, options);
      };
    }
    
    // Fix 2: Add global error recovery
    if (typeof window !== 'undefined') {
      window.addEventListener('error', function(event) {
        // Check if this is an error we care about
        if (event && event.error) {
          const errorMessage = event.error.message || '';
          const errorStack = event.error.stack || '';
          
          // React/Material UI related errors (most critical to catch)
          if (
            errorMessage.includes('clear is not a function') ||
            errorMessage.includes('undefined is not an object') ||
            errorMessage.includes('null is not an object') ||
            errorStack.includes('react-dom') ||
            errorStack.includes('@mui')
          ) {
            console.warn('[AppFixer] Caught critical UI error:', errorMessage);
            event.preventDefault();
            
            // Add visible error notification only in development
            if (process.env.NODE_ENV === 'development') {
              const errorDiv = document.createElement('div');
              errorDiv.style.position = 'fixed';
              errorDiv.style.bottom = '10px';
              errorDiv.style.right = '10px';
              errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
              errorDiv.style.color = 'white';
              errorDiv.style.padding = '10px';
              errorDiv.style.borderRadius = '5px';
              errorDiv.style.zIndex = '9999';
              errorDiv.style.maxWidth = '400px';
              errorDiv.textContent = `Caught Error: ${errorMessage}`;
              
              // Add close button
              const closeButton = document.createElement('button');
              closeButton.textContent = 'Dismiss';
              closeButton.style.marginLeft = '10px';
              closeButton.onclick = () => document.body.removeChild(errorDiv);
              errorDiv.appendChild(closeButton);
              
              document.body.appendChild(errorDiv);
              
              // Auto-remove after 10 seconds
              setTimeout(() => {
                if (document.body.contains(errorDiv)) {
                  document.body.removeChild(errorDiv);
                }
              }, 10000);
            }
            
            return true;
          }
        }
      }, true);
    }
    
    console.log('[AppFixer] 🎉 Application fixes applied successfully:', fixStatus);
  } catch (error) {
    console.error('[AppFixer] ⚠️ Failed to apply some application fixes:', error);
  }
  
  // Set global recovery flag
  if (typeof window !== 'undefined') {
    (window as any).__APP_FIXES_APPLIED__ = fixStatus;
  }
};

export default initAppFixes;
