import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devPort = Number(env.VITE_DEV_PORT) || 3000;
  
  return defineConfig({
    plugins: [react()],
    
    // Ensure proper resolution of TinyMCE resources
    resolve: {
      alias: {
        // Alias for TinyMCE resources
        tinymce: resolve(__dirname, 'node_modules/tinymce')
      }
    },
    
    // Configure server settings with dynamic port
    server: {
      port: devPort,
      strictPort: false,
      open: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    
    // Configure build options
    build: {
      // Ensure TinyMCE skins are included in the build
      // This copies TinyMCE resources to the public directory
      rollupOptions: {
        output: {
          manualChunks: {
            // Split TinyMCE into its own chunk to improve loading performance
            tinymce: ['tinymce', '@tinymce/tinymce-react']
          }
        }
      }
    },
    
    // Add optimizeDeps configuration to handle problematic dependencies
    optimizeDeps: {
      include: ['@tinymce/tinymce-react', 'tinymce']
    }
  });
}
