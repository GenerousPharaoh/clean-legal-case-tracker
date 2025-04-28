import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Special Vite config optimized for Vercel deployment
export default defineConfig({
  // Explicitly set root to current directory
  root: '.',
  
  // React plugin for JSX handling
  plugins: [react()],
  
  // Server config (not used in production but needed for config validation)
  server: {
    port: 8000,
    strictPort: true,
    host: true,
  },
  
  // Production build options
  build: {
    // Output directory
    outDir: 'dist',
    
    // Don't empty output directory (our emergency scripts may have put files there)
    emptyOutDir: false,
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Customize chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Critical: Configure Rollup to avoid problematic modules
    rollupOptions: {
      // Explicitly set entry point to avoid path resolution issues
      input: './index.html',
      
      // Externalize problematic dependencies to avoid bundling issues
      external: [
        // Problematic MUI icon imports
        '@mui/icons-material/AudioTrack',
        '@mui/icons-material/Audiotrack',
      ],
      
      // Optimize output format
      output: {
        // Break into smaller chunks
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@mui/system'],
          'vendor-utils': ['lodash', 'date-fns'],
        },
      },
    },
  },
  
  // Configure path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Make sure proper environment variables are available
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.ROLLUP_NATIVE_DISABLE': JSON.stringify('1'),
  },
  
  // Optimize dependencies to avoid common issues
  optimizeDeps: {
    // Exclude problematic dependencies from optimization
    exclude: [
      '@mui/icons-material/AudioTrack',
      '@mui/icons-material/Audiotrack',
    ],
    // Force include dependencies that might be missed
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/system',
    ],
  },
});
