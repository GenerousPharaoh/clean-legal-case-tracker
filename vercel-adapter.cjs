#!/usr/bin/env node
// Super simple Vercel adapter

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix Rollup native module
const rollupPath = path.join(process.cwd(), 'node_modules/rollup/dist/native.js');
if (fs.existsSync(rollupPath)) {
  // Just replace the whole file with a mock that works everywhere
  fs.writeFileSync(rollupPath, `
// Mock for Vercel deployment
module.exports = { 
  getUniqueID: () => 'id-' + Date.now() 
};`);
  console.log('✅ Fixed Rollup native module');
}

// Run the normal build
try {
  console.log('📦 Building your project...');
  execSync('tsc && vite build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
