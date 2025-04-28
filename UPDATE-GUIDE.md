# Legal Case Tracker - Update Guide

This guide explains the updates that were made to fix the dependency issues and runtime errors in the Legal Case Tracker application.

## Changes Made

### 1. Updated Dependencies

We've updated all dependencies to compatible, stable versions:

- **Core React Dependencies**:
  - Kept `react` and `react-dom` at 18.2.0 for stability
  - Updated `react-router-dom` to 6.21.3 (from 7.5.2 which is a nightly build)

- **Material UI Components**:
  - Updated all MUI packages to stable version 5.15.10
  - Fixed version alignment between `@mui/material`, `@mui/system`, etc.
  - Updated `@mui/x-date-pickers` to a compatible version

- **framer-motion**:
  - Downgraded from 11.5.2 (beta) to stable 10.16.16
  - Removed all overrides, resolutions, and peerDependencyOverrides

- **Third-party Libraries**:
  - Updated `react-pdf` and `pdfjs-dist` to compatible versions
  - Fixed `tinymce` version to work with `@tinymce/tinymce-react`
  - Updated `react-error-boundary` and other error handling libraries

### 2. Improved Build Configuration

- Updated `vite.config.ts` to better handle dependencies
- Added special handling for event-related functions during minification
- Improved chunk management for better performance
- Optimized dependency pre-bundling

### 3. Dependency Cleanup

- Added `cleanup-deps.js` script to remove duplicate dependencies
- Added logic to detect and fix nested incompatible versions
- Fixed MUI and framer-motion compatibility issues

### 4. Removed Runtime Patches

- Removed all runtime patches from `index.html`
- Cleaned up `main.tsx` to use the proper dependency versions
- Removed unnecessary error handling now that the root causes are fixed

## How to Apply These Updates

Follow these steps to apply the updates:

1. **Delete node_modules and lock file**:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

2. **Install the updated dependencies**:
   ```bash
   npm install
   ```

3. **Run the dependency cleanup script**:
   ```bash
   node cleanup-deps.js
   ```

4. **Rebuild the application**:
   ```bash
   npm run build
   ```

5. **Test the application**:
   ```bash
   npm run preview
   ```

6. **Deploy the updated application**:
   ```bash
   # If using vercel:
   vercel deploy
   ```

## Troubleshooting

If you still encounter issues after updating:

1. **Check console errors**: Look for specific errors in the browser console
2. **Clear browser cache**: Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Try private browsing**: Test in an incognito/private window

## Why This Fixes the Issues

The core problem was a compatibility issue between MUI and framer-motion versions. MUI version 5.14.18 doesn't work well with framer-motion 11.5.2, and your setup had various overrides trying to force compatibility.

By updating to a stable set of dependencies and properly aligning versions, we've fixed the root cause instead of applying runtime patches. This is a more maintainable solution that will prevent similar issues in the future.

The critical fix was downgrading framer-motion to a version that's fully compatible with MUI components while updating the rest of the ecosystem to their stable, compatible versions.
