import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Check if index.html exists
const indexHtmlPath = path.resolve('./index.html')
const indexHtmlExists = fs.existsSync(indexHtmlPath)

if (!indexHtmlExists) {
  console.error('Error: index.html not found in project root!')
  // Create a simple index.html if it doesn't exist
  const basicHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  
  try {
    fs.writeFileSync(indexHtmlPath, basicHtml)
    console.log('Created a basic index.html file')
  } catch (err) {
    console.error('Failed to create index.html:', err)
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  // Use a simple string for input to avoid path resolution issues
  root: '.', 
  plugins: [
    react()
  ],
  server: {
    port: 8000,
    strictPort: true,
    host: true,
  },
  build: {
    // Don't show warnings for large chunks
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
    rollupOptions: {
      // Use a simple relative path for index.html
      input: './index.html',
      // Don't treat anything as external
      external: []
    },
    // Avoid empty chunks
    emptyOutDir: false
  },
  // Simple path alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
