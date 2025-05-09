# PDF Viewer Fix

## Problem

The PDF viewer component was unable to load PDF files, resulting in the error message "Failed to load PDF file" even though the file was successfully uploaded and a URL was being provided to the viewer.

## Root Cause

The issue was with the PDF.js worker configuration. In the EnhancedPdfViewer component, the worker URL was incorrectly set to:

```javascript
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();
```

This was trying to resolve the worker path relative to the component file, but:

1. The worker file extension was incorrectly specified as `.js` when it's actually `.mjs` in the node_modules
2. The import.meta.url approach doesn't work correctly for bundled files in production
3. The PDF.js worker wasn't being copied to a public directory for browser access

## Solution

1. Copied the PDF.js worker file to the public directory:
   ```bash
   mkdir -p public/pdf
   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf/pdf.worker.min.js
   ```

2. Updated the EnhancedPdfViewer component to use the public URL:
   ```javascript
   // Set up the worker for PDF.js - use the worker file we copied to the public directory
   pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';
   ```

3. Added PDF.js worker copying to the build process by updating the `copy-tinymce.js` script:
   ```javascript
   // Copy the PDF.js worker file for PDF viewer
   console.log('\nSetting up PDF.js worker file...');
   
   const pdfJsWorkerSrc = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
   const pdfJsWorkerDest = path.join(__dirname, 'public', 'pdf');
   
   // Create pdf directory if it doesn't exist
   if (!fs.existsSync(pdfJsWorkerDest)) {
     fs.mkdirSync(pdfJsWorkerDest, { recursive: true });
   }
   
   // Copy the worker file with .js extension 
   const pdfJsWorkerDestFile = path.join(pdfJsWorkerDest, 'pdf.worker.min.js');
   fs.copyFileSync(pdfJsWorkerSrc, pdfJsWorkerDestFile);
   ```

This ensures that:
- The PDF.js worker is available at a predictable URL
- The worker is copied along with TinyMCE resources during the build process
- The PDF component can find the worker file in both development and production environments

## Testing

After implementing the fix, PDF files can now be loaded and displayed correctly in the application. The viewer shows the PDF content and allows for navigation and zooming as expected. 