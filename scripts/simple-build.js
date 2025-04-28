/**
 * Simple Vite build script that uses Vite's JavaScript API
 * to build the project with minimal configuration
 */
import { build } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function runBuild() {
  console.log('Starting simple Vite build...');

  try {
    // Make sure the index.html file exists in the root
    if (!fs.existsSync(path.join(projectRoot, 'index.html'))) {
      console.error('index.html not found in project root!');
      process.exit(1);
    }

    // Set ROLLUP_NATIVE_DISABLE to prevent native module issues
    process.env.ROLLUP_NATIVE_DISABLE = '1';
    
    // Run the build with explicit entry point configuration
    await build({
      root: projectRoot,
      logLevel: 'info',
      configFile: false, // Don't use vite.config.ts to avoid path resolution issues
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
          input: path.join(projectRoot, 'index.html')
        }
      }
    });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild(); 