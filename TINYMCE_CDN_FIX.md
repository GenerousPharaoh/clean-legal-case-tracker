# TinyMCE CDN Fix

## The Root Problem

After analyzing your application, I've identified the fundamental issue causing your grey screen and infinite refresh loop:

**The application was trying to load TinyMCE plugins from a local path that doesn't exist.**

Specifically, I noticed:
1. Your `App.tsx` file was initializing TinyMCE with `useCDN={false}`, forcing it to use self-hosted mode
2. In self-hosted mode, TinyMCE looks for plugins at `/tinymce/plugins/...` which don't exist on your server
3. This caused the 404 errors and the infinite refresh loop as your error handlers kept trying to recover

## The Solution

I've made three targeted changes:

1. **Modified App.tsx**:
   - Changed `<TinyMCEScriptLoader useCDN={false} />` to `<TinyMCEScriptLoader useCDN={true} />`
   - This forces TinyMCE to load from the CDN instead of looking for local files

2. **Updated TinyMCEScriptLoader.tsx**:
   - Enhanced to always use the CDN regardless of the prop value
   - Added proper CDN configuration for the TinyMCE base URL
   - Added global settings to simplify plugin usage

3. **Simplified tinymce-init.js**:
   - Removed references to custom plugins that aren't available on the CDN
   - Updated configuration to use only standard plugins
   - Set proper CDN paths for all TinyMCE assets

## How to Apply

I've created a simple script to build and test your application with these changes:

```bash
chmod +x tinymce-fix.sh
./tinymce-fix.sh
```

This will:
1. Clean up old build artifacts
2. Build your application with the TinyMCE CDN fix
3. Start a preview server to test the results

If it works, deploy to Vercel:
```bash
vercel --prod
```

## Notes

- The "React DevTools" errors in the console can be ignored - they're from your browser extension, not your app
- The app might have slightly reduced TinyMCE functionality (some custom plugins may be unavailable)
- If needed, you can explore adding proper TinyMCE plugin implementation later, but this fix gets your app working for your pitch

This approach directly addresses the root cause instead of adding complex patches that mask the symptoms.
