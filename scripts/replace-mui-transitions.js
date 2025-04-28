#!/usr/bin/env node

/**
 * Replace MUI Transitions Script
 * 
 * This script finds all remaining direct usages of Material-UI transition components
 * and replaces them with our safe versions from SafeTransitions.
 * 
 * Usage:
 * node scripts/replace-mui-transitions.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const srcDir = path.resolve(__dirname, '../src');
const safeTransitionsPath = './SafeTransitions';
const skipFiles = [
  'SafeTransitions.tsx',
  'DirectTransition.tsx',
  'SafeTransition.tsx'
];

// Transition components to replace
const transitions = ['Fade', 'Grow', 'Slide', 'Zoom', 'Collapse'];

// Helper to find files recursively
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') && !skipFiles.includes(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Process a file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let relativePath = '';
  
  // Calculate relative path to SafeTransitions from this file
  const fileDir = path.dirname(filePath);
  const relativeToSrc = path.relative(fileDir, path.join(srcDir, 'components'));
  relativePath = relativeToSrc 
    ? path.join(relativeToSrc, 'SafeTransitions')
    : safeTransitionsPath;
  relativePath = relativePath.replace(/\\/g, '/');  // Normalize for Windows
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  // Check for imports from @mui/material that include transitions
  const importRegex = /import\s+{([^}]*)}\s+from\s+['"]@mui\/material['"]/g;
  let importMatch;
  
  while ((importMatch = importRegex.exec(content)) !== null) {
    const importItems = importMatch[1].split(',').map(i => i.trim());
    const transitionsToImport = [];
    
    // Check if any transition components are imported
    const filteredImports = importItems.filter(item => {
      const cleanItem = item.trim();
      if (transitions.includes(cleanItem)) {
        transitionsToImport.push(cleanItem);
        return false;
      }
      return true;
    });
    
    if (transitionsToImport.length > 0) {
      modified = true;
      
      // Replace the original import
      let newImport = '';
      if (filteredImports.length > 0) {
        newImport = `import { ${filteredImports.join(', ')} } from '@mui/material'`;
      }
      
      // Add the new import for safe transitions
      const transitionsImport = `import { ${transitionsToImport.join(', ')} } from '${relativePath}'`;
      
      // Replace in content
      content = content.replace(
        importMatch[0],
        newImport + (newImport ? ';\n' : '') + transitionsImport
      );
    }
  }
  
  // Write the changes
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated imports in ${filePath}`);
  } else {
    console.log(`⏭️ No transition imports found in ${filePath}`);
  }
}

// Main function
function main() {
  console.log('🔍 Finding TypeScript files...');
  const files = findTsxFiles(srcDir);
  console.log(`Found ${files.length} .tsx files to process`);
  
  let processedCount = 0;
  
  files.forEach(file => {
    try {
      processFile(file);
      processedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  });
  
  console.log(`\n✨ Processed ${processedCount} files`);
  console.log('🎉 Done!');
}

main(); 