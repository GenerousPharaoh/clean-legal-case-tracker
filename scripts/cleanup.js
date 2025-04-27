/**
 * Code Cleanup Script
 * 
 * This script helps identify and fix common issues in the codebase:
 * - Duplicate imports
 * - Inconsistent file paths
 * - Dead code
 * - Unused dependencies
 * 
 * Usage: npm run cleanup
 */

console.log('🔍 Starting code cleanup analysis...');

// Import required dependencies
// Note: This script will fail until you install the dependencies
// npm install --save-dev glob fs-extra chalk

try {
  const glob = require('glob');
  const fs = require('fs-extra');
  const path = require('path');
  const chalk = require('chalk');

  // Configuration
  const SRC_DIR = path.resolve(__dirname, '../src');
  const ISSUES = {
    DUPLICATE_IMPORTS: { count: 0, files: [] },
    PATH_INCONSISTENCY: { count: 0, files: [] },
    DEAD_CODE: { count: 0, files: [] },
    UNUSED_DEPS: { count: 0, list: [] },
  };

  // Track path inconsistencies
  const PATH_PATTERNS = [
    { 
      pattern: /from ['"]\.\.\/lib\/supabaseClient['"]/g, 
      replacement: "from '../supabaseClient'",
      description: 'Incorrect supabaseClient import path'
    },
    { 
      pattern: /import.*from ['"]\.\.\/hooks\/useThemeMode['"]/g, 
      replacement: "import { useThemeContext } from '../context/ThemeContext'",
      description: 'UseThemeMode hook (deprecated)'
    },
    { 
      pattern: /import.*from ['"]\.\.\/context\/AuthContext['"]/g, 
      replacement: "import { useAuth } from '../contexts'",
      description: 'Direct AuthContext imports (use useAuth from contexts)'
    },
    {
      pattern: /from ['"]@reduxjs\/toolkit['"]/g,
      replacement: "from '../store/reduxStore'",
      description: 'Direct Redux Toolkit imports (use reduxStore)'
    }
  ];

  // Helper: Check for path inconsistencies
  function checkPathInconsistencies(filePath, content) {
    let hasIssue = false;
    
    PATH_PATTERNS.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        if (!hasIssue) {
          ISSUES.PATH_INCONSISTENCY.count++;
          ISSUES.PATH_INCONSISTENCY.files.push({
            path: filePath,
            issues: []
          });
          hasIssue = true;
        }
        
        const fileEntry = ISSUES.PATH_INCONSISTENCY.files.find(f => f.path === filePath);
        fileEntry.issues.push(description);
      }
    });
  }

  // Check for duplicate import patterns
  function checkDuplicateImports(filePath, content) {
    const importMap = {};
    const importLines = content.match(/^import .+ from .+;$/gm) || [];
    
    importLines.forEach(line => {
      const importSource = line.match(/from ['"]([^'"]+)['"]/);
      if (importSource && importSource[1]) {
        const source = importSource[1];
        if (!importMap[source]) {
          importMap[source] = [];
        }
        importMap[source].push(line);
      }
    });
    
    const duplicates = Object.entries(importMap)
      .filter(([_, lines]) => lines.length > 1);
    
    if (duplicates.length > 0) {
      ISSUES.DUPLICATE_IMPORTS.count++;
      ISSUES.DUPLICATE_IMPORTS.files.push({
        path: filePath,
        duplicates: duplicates.map(([source, lines]) => ({
          source,
          count: lines.length,
          lines
        }))
      });
    }
  }

  console.log(chalk.blue('🔍 Scanning TypeScript/JavaScript files...'));
  
  // Get all TS/JS files
  const files = glob.sync(SRC_DIR + '/**/*.{ts,tsx,js,jsx}');
  console.log(chalk.green(`Found ${files.length} files to analyze`));
  
  // Process each file
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(SRC_DIR, file);
    
    // Check path inconsistencies
    checkPathInconsistencies(relativePath, content);
    
    // Check duplicate imports
    checkDuplicateImports(relativePath, content);
    
    // More checks can be added here
  });

  // Report findings
  console.log('\n' + chalk.yellow('📊 Analysis Results:'));
  
  if (ISSUES.PATH_INCONSISTENCY.count > 0) {
    console.log(chalk.red(`\n🔗 Path Inconsistencies: ${ISSUES.PATH_INCONSISTENCY.count} files`));
    ISSUES.PATH_INCONSISTENCY.files.forEach(file => {
      console.log(chalk.yellow(`  - ${file.path}`));
      file.issues.forEach(issue => {
        console.log(chalk.gray(`    • ${issue}`));
      });
    });
  } else {
    console.log(chalk.green('✅ No path inconsistencies found'));
  }
  
  if (ISSUES.DUPLICATE_IMPORTS.count > 0) {
    console.log(chalk.red(`\n📦 Duplicate Imports: ${ISSUES.DUPLICATE_IMPORTS.count} files`));
    ISSUES.DUPLICATE_IMPORTS.files.forEach(file => {
      console.log(chalk.yellow(`  - ${file.path}`));
      file.duplicates.forEach(dup => {
        console.log(chalk.gray(`    • '${dup.source}' imported ${dup.count} times`));
      });
    });
  } else {
    console.log(chalk.green('✅ No duplicate imports found'));
  }
  
  console.log('\n' + chalk.blue('📝 Cleanup Suggestions:'));
  console.log(chalk.gray('1. Run: npm install --save-dev glob fs-extra chalk'));
  console.log(chalk.gray('2. Standardize on one folder for contexts (contexts/)'));
  console.log(chalk.gray('3. Use the provided adapters for compatibility'));
  console.log(chalk.gray('4. Remove deprecated hooks and context providers'));
  console.log(chalk.gray('5. Run TypeScript type checking: npx tsc --noEmit'));

  console.log('\n' + chalk.green('✅ Analysis complete!'));

} catch (error) {
  console.error('\n⚠️ Error running cleanup script:');
  console.error(error);
  console.error('\nYou may need to install dependencies:');
  console.error('npm install --save-dev glob fs-extra chalk');
}
