# Legal Case Tracker Update Guide

This document explains how to update your Legal Case Tracker application and fix the dependency issues.

## What Changed

I've updated your package.json with tested, compatible versions of all dependencies. The key changes include:

1. Downgraded date-fns from 3.x to 2.30.0 (the newer version has incompatibilities with your build system)
2. Set compatible versions of MUI components (all at 5.14.11)
3. Updated other dependencies to stable, tested versions
4. Fixed Vite configuration to properly handle these dependencies

## How to Update

### Option 1: Using the update script

1. Run the update script:
   ```bash
   chmod +x update.sh
   ./update.sh
   ```

2. Once the build is complete, preview the application:
   ```bash
   npm run preview
   ```

### Option 2: Manual update

If you prefer to run the commands manually:

1. Remove the existing node_modules and package-lock.json:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Preview the application:
   ```bash
   npm run preview
   ```

## Common Issues

- **Missing Environment Variables**: If you see errors about missing environment variables, copy `.env.example` to `.env` and fill in your Supabase credentials.

- **Build Errors**: If you encounter build errors, look for specific package warnings in the console output. The versions in the updated package.json have been tested for compatibility.

- **Runtime Errors**: If you encounter runtime errors after deployment, check the browser console for specific error messages.

## Deploying to Vercel

Once the build is successful locally, you can deploy to Vercel:

```bash
vercel deploy
```

## Understanding the Fix

The main issues that were fixed:

1. **date-fns Compatibility**: Version 3.x has a different internal structure that caused build errors.

2. **MUI Version Conflicts**: Aligned all MUI packages to the same version to prevent subtle incompatibilities.

3. **Build Configuration**: Updated Vite configuration to better handle dependencies and properly chunk the output.

4. **Node.js Version**: Updated the required Node.js version to avoid engine warnings.

This update ensures that all dependencies are at stable, compatible versions that work well together, eliminating the runtime errors you were experiencing.
