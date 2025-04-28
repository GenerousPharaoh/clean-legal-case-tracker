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
  - Created `TinyMCEScriptLoader` component that properly loads TinyMCE either from CDN or self-hosted
  - Updated TinyMCE configuration with correct paths for plugins
  - Added proper error handling for TinyMCE loading failures

### 3. Framer-motion Version Mismatch 

- **Problem**: The app contained mixed versions of framer-motion (v7 and v11), causing "u.mount is not a function" errors.
- **Fix**:
  - Locked framer-motion to version 11.5.2 in package.json
  - Added override and resolution configuration to ensure all dependent packages use the same version
  - Fixed imports to use the standardized version

### 4. Improved Error Handling

- **Problem**: Error cascades were taking down the entire application
- **Fix**:
  - Implemented nested error boundaries with Suspense to isolate errors
  - Added proper fall-back UI for error states
  - Ensured components wait for profile data to be ready before mounting

## Deployment Verification Checklist

After deploying these changes, verify the following:

1. ✅ `/profiles?...` API requests return 200 with JSON instead of 404
2. ✅ Network tab shows tinymce.min.js loading with 200 status (not HTML)
3. ✅ No "u.mount" errors in the console
4. ✅ Source maps are enabled in production build

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