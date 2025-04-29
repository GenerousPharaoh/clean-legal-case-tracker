# Final TinyMCE Self-Hosting Fix

This is a comprehensive fix for your Legal Case Tracker that implements ChatGPT's self-hosting approach, which is ideal for offline presentations and supports custom plugins.

## What This Fix Does

1. **Installs the official TinyMCE React wrapper**
2. **Sets up proper self-hosting** with the postinstall script
3. **Creates a proper TinyMCE Editor component** that correctly references local files
4. **Implements a custom citeevidence plugin** for your legal citations
5. **Removes the problematic TinyMCE script loaders** that were causing issues

## How to Apply This Fix

1. Make the script executable:
   ```bash
   chmod +x tinymce-selfhost-fix.sh
   ```

2. Run the script:
   ```bash
   ./tinymce-selfhost-fix.sh
   ```

3. After it completes, test locally:
   ```bash
   npm run preview
   ```

4. If it works (which it should), deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Verification Checklist

After deploying, verify the following:
- TinyMCE editor loads completely (no errors in console)
- No 404 errors for plugin files
- The editor is not in "read-only" mode
- The citeevidence button appears in the toolbar

## Why This Works

1. The script installs `@tinymce/tinymce-react` which provides proper React integration
2. The postinstall script copies TinyMCE from node_modules to public/tinymce
3. The editor component correctly references `/tinymce/tinymce.min.js`
4. We've created a custom plugin for citeevidence functionality
5. All files are served locally - no external dependencies required for offline use

## For Your Presentation

This setup ensures everything works offline, which is perfect for your lawyer presentation. The editor will have all the functionality you need, and there will be no dependency on external CDNs.

Good luck with your pitch!
