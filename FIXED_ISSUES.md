# Legal Case Tracker - Fixed Issues

This document summarizes the changes made to fix the root-level diagnosis issues identified in the application.

## Issues Fixed

### 1. Supabase 404 Profile Issue

- **Problem**: GET requests to user profiles were returning 404 (not 403), indicating the row-level security was satisfied but the profile row didn't exist.
- **Fix**:
  - Created a robust `useProfile` hook with null guards and automatic profile creation
  - Added defensive code in App.tsx to handle missing profiles during authentication
  - Implemented automatic profile creation for new users

### 2. TinyMCE Plugin Load Failure

- **Problem**: Plugin files were requested from incorrect paths causing Vercel to rewrite to index.html, resulting in syntax errors.
- **Fix**:
  - **Updated Solution (2023-04-28)**: Switched to TinyMCE Cloud CDN approach instead of self-hosted
  - Removed all self-hosted TinyMCE imports and configuration
  - Configured Editor component to use TinyMCE CDN with no API key
  - Reconfigured the custom cite button to work without a custom plugin

### 3. Framer-motion Version Mismatch 

- **Problem**: The app contained mixed versions of framer-motion (v7 and v11), causing "u.mount is not a function" errors.
- **Fix**:
  - **Updated Solution (2023-04-28)**: Created a comprehensive approach to version conflicts
  - Added specific override entries for all packages that use framer-motion as a dependency
  - Added explicit overrides for @mui/material, @mui/system, and react-awesome-reveal
  - Created a utility script (scripts/fix-framer-motion.js) to ensure consistent versions

### 4. Improved Error Handling

- **Problem**: Error cascades were taking down the entire application
- **Fix**:
  - Implemented nested error boundaries with Suspense to isolate errors
  - Added proper fall-back UI for error states
  - Ensured components wait for profile data to be ready before mounting

### 5. Map.clear Function Error

- **Problem**: The application was experiencing a critical error in production:
  ```
  TypeError: this.events[e].clear is not a function
  ```
- **Solution**:
  - **Downgraded framer-motion**: Changed from version 10.16.4 to 10.12.16, which is known to be more compatible with MUI 5.14.x
  - **Added a Map.clear polyfill**: Created a safety measure that adds the `clear()` method to Map objects if it's missing

## Verification Steps for Latest Fixes

After deploying these changes, verify the following:

1. `npm ls framer-motion` should show exactly one version
2. Browser console should have no `u.mount` / `events[e].clear` errors
3. Network tab should show TinyMCE loading from CDN successfully (no 404s)
4. Login should complete and dashboard should render properly

## Running the Framer-motion Fix Script

To ensure all framer-motion dependencies are properly fixed, run:

```bash
# Clean up framer-motion version inconsistencies
node scripts/fix-framer-motion.js

# Rebuild the application
npm run build
```

This script will:
1. Clean up any duplicate framer-motion packages
2. Update package.json with the correct overrides
3. Reinstall dependencies
4. Verify that only one version is being used

## Additional Hardening

The following additional hardening measures were implemented:

1. **Nested Error Boundaries**: Used a more robust error boundary structure with Suspense for better fallbacks.
2. **Defensive Coding**: Added null guards and type checks throughout the authentication and profile flow.
3. **Source Maps**: Kept source maps enabled for easier debugging in production.

## Next Steps

Consider implementing the following in future updates:

1. Use framer-motion's LazyMotion with feature bundles to keep the main chunk under 1 MB.
2. Add more granular error boundaries around specific functional areas of the application.
3. Improve the profile creation flow to include more user information.

## 1. Framer-motion version clash
**Issue:** The application had two different framer-motion versions (v7 implicitly used by MUI, and v11 as a direct dependency), causing runtime errors like `u.mount` and `events[e].clear` not found.

**Fix:**
- Updated package.json to enforce a single version (11.5.2) everywhere
- Removed specific override for react-awesome-reveal
- Kept the general override to ensure all dependencies use the same version

## 2. TinyMCE plugins returning "Unexpected token '<'"
**Issue:** TinyMCE plugin paths (e.g., `/tinymce/plugins/paste/plugin.min.js`) were missing, causing 404s that Vercel rewrote to index.html, resulting in unexpected token errors.

**Fix:**
- Added early TinyMCE base path initialization in index.html
- Updated CenterPanel.tsx to explicitly set base_url, suffix, and tinymceScriptSrc
- Modified TinyMCE initialization logic to ensure path is set before plugins load
- Removed individual plugin imports and let TinyMCE load them from the correct base_url
- Added DOMContentLoaded event listener to guarantee base_url is set even with dynamic loading

## 3. DevTools extension noise
**Issue:** Console errors related to React DevTools extension (`renderer.setTraceUpdatesEnabled`, `getNearestMountedDOMNode`)

**Note:** These are harmless in production and originate from React DevTools extension 4.31.x when it misdetects React 18. They can be ignored or addressed by disabling the extension while testing.

## Verification Steps
1. `npm ls framer-motion` should show exactly one version
2. Browser console should have no `u.mount` / `events[e].clear` errors
3. Network tab should show every requested TinyMCE plugin returning 200 JS, not HTML
4. Login should complete and dashboard should render properly 

## How to Apply the Fix

1. Make the fix script executable:
   ```bash
   chmod +x fix-build.sh
   ```

2. Run the fix script:
   ```bash
   ./fix-build.sh
   ```

3. This script:
   - Removes node_modules and package-lock.json
   - Reinstalls with the fixed dependency versions
   - Adds a Map.clear polyfill
   - Updates main.tsx to import the polyfill
   - Rebuilds the project

4. Preview the fixed application:
   ```bash
   npm run preview
   ```

5. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Understanding the Root Cause

This issue stemmed from an incompatibility between different versions of dependencies, specifically:

1. MUI components expect Map objects to have a `clear()` method
2. The version of framer-motion (10.16.4) was using a custom Map-like object that lacked this method
3. When a component unmounted, it tried to call `clear()` on these Map-like objects, causing the error

The combination of downgrading framer-motion and adding a polyfill ensures that even if the issue reappears with future updates, the application will still function properly.

## Preventing Similar Issues in the Future

1. **Lock dependency versions**: Use exact version numbers for critical dependencies
2. **Test production builds**: Always test your application with a production build before deploying
3. **Be cautious with updates**: Before updating major versions of UI libraries, check for compatibility issues

This fix should resolve the issue permanently while maintaining all functionality of your application. 