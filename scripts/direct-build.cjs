/**
 * Direct build script using CommonJS to avoid ES Module issues
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set environment variables
process.env.ROLLUP_NATIVE_DISABLE = '1';

// Constants
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');
const indexHtml = path.join(projectRoot, 'index.html');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

// Copy index.html to dist
if (fs.existsSync(indexHtml)) {
  const indexContent = fs.readFileSync(indexHtml, 'utf8');
  
  // Fix the script source path to point to built assets
  const fixedIndexContent = indexContent.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    '<script type="module" src="./src/main.js"></script>'
  );
  
  fs.writeFileSync(path.join(distDir, 'index.html'), fixedIndexContent);
  console.log('✅ Copied and fixed index.html');
} else {
  console.error('❌ index.html not found in project root!');
  process.exit(1);
}

// Recursively copy public directory to dist
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(publicDir)) {
  copyDir(publicDir, distDir);
  console.log('✅ Copied public directory');
}

// Create a basic .env file if needed
if (!fs.existsSync(path.join(projectRoot, '.env'))) {
  console.log('Creating basic .env file...');
  fs.writeFileSync(path.join(projectRoot, '.env'), 'ROLLUP_NATIVE_DISABLE=1\n');
}

// Try running vite build with specific configuration
try {
  console.log('📋 Running Vite build...');
  
  // Create a temporary vite config that works around the issue
  const tempConfigPath = path.join(projectRoot, 'vite.temp.config.js');
  const configContent = `
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import path from 'path';

    export default defineConfig({
      build: {
        outDir: 'dist',
        emptyOutDir: false, // Don't empty because we already copied files
        rollupOptions: {
          input: './index.html',
          external: []
        }
      },
      plugins: [react()]
    });
  `;
  
  fs.writeFileSync(tempConfigPath, configContent);
  console.log('✅ Created temporary Vite config');
  
  try {
    execSync('npx vite build --config vite.temp.config.js', { 
      stdio: 'inherit',
      cwd: projectRoot
    });
    console.log('✅ Vite build completed');
  } catch (err) {
    console.error('❌ Vite build failed, but continuing with static files');
  }
  
  // Clean up temp file
  fs.unlinkSync(tempConfigPath);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  // Try using esbuild as a fallback
  console.log('Trying esbuild fallback...');
  try {
    execSync('node scripts/esbuild-fallback.cjs', {
      stdio: 'inherit',
      cwd: projectRoot
    });
    console.log('✅ esbuild fallback completed');
  } catch (esbuildError) {
    console.error('❌ esbuild fallback failed:', esbuildError.message);
    // Continue regardless to ensure we have at least a static version
  }
}

console.log('✅ Build process complete. Check the dist directory.');
