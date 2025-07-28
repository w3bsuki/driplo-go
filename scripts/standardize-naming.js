#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const PHASE = process.argv.find(arg => arg.startsWith('--phase='))?.split('=')[1] || '1';

console.log(`Running naming standardization script - Phase ${PHASE}`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log('-----------------------------------\n');

// Track changes for summary
const changes = {
  renamedFiles: [],
  updatedImports: [],
  updatedProps: [],
  updatedHandlers: [],
  errors: []
};

// Helper to convert kebab-case to PascalCase
function kebabToPascal(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Helper to check if file is a Svelte component
function isSvelteComponent(filePath) {
  return filePath.endsWith('.svelte');
}

// Helper to check if file name is already PascalCase
function isPascalCase(fileName) {
  const baseName = path.basename(fileName, '.svelte');
  return /^[A-Z][a-zA-Z0-9]*$/.test(baseName);
}

// Phase 1: Rename kebab-case component files to PascalCase
async function phase1_renameComponents() {
  console.log('Phase 1: Renaming kebab-case component files to PascalCase\n');
  
  const componentsDir = path.join(__dirname, '..', 'src', 'lib', 'components');
  const uiDir = path.join(componentsDir, 'ui');
  
  // Get all .svelte files that need renaming
  const filesToRename = [];
  
  function scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (isSvelteComponent(entry.name) && !isPascalCase(entry.name)) {
          filesToRename.push(fullPath);
        }
      }
    } catch (error) {
      changes.errors.push(`Error scanning directory ${dir}: ${error.message}`);
    }
  }
  
  // Scan UI components directory (where most kebab-case files are)
  scanDirectory(uiDir);
  
  console.log(`Found ${filesToRename.length} files to rename:\n`);
  
  // Create rename map
  const renameMap = new Map();
  
  for (const oldPath of filesToRename) {
    const dir = path.dirname(oldPath);
    const oldName = path.basename(oldPath);
    const baseName = path.basename(oldName, '.svelte');
    const newBaseName = kebabToPascal(baseName);
    const newName = `${newBaseName}.svelte`;
    const newPath = path.join(dir, newName);
    
    renameMap.set(oldPath, { newPath, oldName, newName });
    console.log(`  ${oldName} → ${newName}`);
  }
  
  if (filesToRename.length === 0) {
    console.log('No files need renaming in Phase 1.');
    return;
  }
  
  console.log('\n-----------------------------------\n');
  
  if (!DRY_RUN) {
    console.log('Renaming files...\n');
    
    // Rename files
    for (const [oldPath, { newPath, oldName, newName }] of renameMap) {
      try {
        fs.renameSync(oldPath, newPath);
        changes.renamedFiles.push({ oldName, newName });
        console.log(`✓ Renamed ${oldName} to ${newName}`);
      } catch (error) {
        changes.errors.push(`Failed to rename ${oldName}: ${error.message}`);
        console.error(`✗ Failed to rename ${oldName}: ${error.message}`);
      }
    }
    
    console.log('\n-----------------------------------\n');
    console.log('Updating imports...\n');
    
    // Update imports throughout the codebase
    await updateImports(renameMap);
  }
}

// Update import statements throughout the codebase
async function updateImports(renameMap) {
  const srcDir = path.join(__dirname, '..', 'src');
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  
  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Check each import
      content = content.replace(importRegex, (match, importPath) => {
        // Check if this import needs updating
        for (const [oldPath, { oldName, newName }] of renameMap) {
          const oldBaseName = path.basename(oldName, '.svelte');
          const newBaseName = path.basename(newName, '.svelte');
          
          // Check various import patterns
          const patterns = [
            { old: `/${oldBaseName}.svelte`, new: `/${newBaseName}.svelte` },
            { old: `/${oldBaseName}`, new: `/${newBaseName}` },
            { old: `ui/${oldBaseName}.svelte`, new: `ui/${newBaseName}.svelte` },
            { old: `ui/${oldBaseName}`, new: `ui/${newBaseName}` }
          ];
          
          for (const pattern of patterns) {
            if (importPath.includes(pattern.old)) {
              const newImportPath = importPath.replace(pattern.old, pattern.new);
              modified = true;
              changes.updatedImports.push({
                file: path.relative(srcDir, filePath),
                oldImport: importPath,
                newImport: newImportPath
              });
              return `from '${newImportPath}'`;
            }
          }
        }
        
        return match;
      });
      
      if (modified && !DRY_RUN) {
        fs.writeFileSync(filePath, content);
        console.log(`✓ Updated imports in ${path.relative(srcDir, filePath)}`);
      }
    } catch (error) {
      changes.errors.push(`Failed to process ${filePath}: ${error.message}`);
    }
  }
  
  function scanForImports(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanForImports(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.svelte'))) {
        processFile(fullPath);
      }
    }
  }
  
  scanForImports(srcDir);
}

// Phase 2: Standardize event handler naming
async function phase2_standardizeEventHandlers() {
  console.log('Phase 2: Standardizing event handler naming patterns\n');
  console.log('Convention: Props use "onEvent", internal handlers use "handleEvent"\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const filesToProcess = [];
  
  // Find all Svelte and TypeScript files
  function scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.svelte') || entry.name.endsWith('.ts'))) {
          filesToProcess.push(fullPath);
        }
      }
    } catch (error) {
      changes.errors.push(`Error scanning directory ${dir}: ${error.message}`);
    }
  }
  
  scanDirectory(srcDir);
  
  console.log(`Found ${filesToProcess.length} files to analyze\n`);
  
  // Patterns to find and replace
  const eventPatterns = [
    // Props that should be onEvent
    { pattern: /(\s+)(handle)([A-Z]\w+)(\s*[:=]\s*\(.*?\)\s*=>\s*(?:void|any))/g, replacement: '$1on$3$4', type: 'prop' },
    { pattern: /(\s+)(on)([a-z]\w+)(\s*[:=]\s*\(.*?\)\s*=>\s*(?:void|any))/g, replacement: (match, prefix, on, event, suffix) => `${prefix}on${event.charAt(0).toUpperCase() + event.slice(1)}${suffix}`, type: 'prop' },
    { pattern: /(export\s+let\s+)(handle)([A-Z]\w+)(\s*[:=])/g, replacement: '$1on$3$4', type: 'prop' },
    
    // Internal functions that should be handleEvent
    { pattern: /(function\s+)(on)([A-Z]\w+)(\s*\()/g, replacement: '$1handle$3$4', type: 'handler' },
    { pattern: /(const\s+)(on)([A-Z]\w+)(\s*=\s*(?:async\s*)?\()/g, replacement: '$1handle$3$4', type: 'handler' },
    { pattern: /(let\s+)(on)([A-Z]\w+)(\s*=\s*(?:async\s*)?\()/g, replacement: '$1handle$3$4', type: 'handler' },
    
    // Common incorrect patterns
    { pattern: /(\s+)(submit|click|change|input|focus|blur)(\s*[:=]\s*\(.*?\)\s*=>\s*(?:void|any))/g, replacement: (match, prefix, event, suffix) => `${prefix}on${event.charAt(0).toUpperCase() + event.slice(1)}${suffix}`, type: 'prop' },
  ];
  
  let totalPropsFixed = 0;
  let totalHandlersFixed = 0;
  
  for (const filePath of filesToProcess) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let propsFixed = 0;
      let handlersFixed = 0;
      
      // Apply each pattern
      for (const { pattern, replacement, type } of eventPatterns) {
        const newContent = content.replace(pattern, (match, ...args) => {
          modified = true;
          if (type === 'prop') {
            propsFixed++;
          } else {
            handlersFixed++;
          }
          
          if (typeof replacement === 'function') {
            return replacement(match, ...args);
          }
          return match.replace(pattern, replacement);
        });
        content = newContent;
      }
      
      // Special handling for Svelte event directives
      if (filePath.endsWith('.svelte')) {
        // Fix onclick={handle...} to onclick={handle...}
        content = content.replace(/on(click|change|input|submit|focus|blur|keydown|keyup|mouseenter|mouseleave)=\{(\w+)\}/g, (match, event, handler) => {
          if (!handler.startsWith('handle') && !handler.startsWith('on')) {
            modified = true;
            handlersFixed++;
            return `on${event}={handle${handler.charAt(0).toUpperCase() + handler.slice(1)}}`;
          }
          return match;
        });
      }
      
      if (modified && !DRY_RUN) {
        fs.writeFileSync(filePath, content);
        const relativePath = path.relative(srcDir, filePath);
        console.log(`✓ Updated ${relativePath} (${propsFixed} props, ${handlersFixed} handlers)`);
        
        if (propsFixed > 0) {
          changes.updatedProps.push({ file: relativePath, count: propsFixed });
          totalPropsFixed += propsFixed;
        }
        if (handlersFixed > 0) {
          changes.updatedHandlers.push({ file: relativePath, count: handlersFixed });
          totalHandlersFixed += handlersFixed;
        }
      } else if (modified && DRY_RUN) {
        const relativePath = path.relative(srcDir, filePath);
        console.log(`Would update ${relativePath} (${propsFixed} props, ${handlersFixed} handlers)`);
      }
    } catch (error) {
      changes.errors.push(`Failed to process ${filePath}: ${error.message}`);
    }
  }
  
  console.log(`\nTotal: ${totalPropsFixed} props and ${totalHandlersFixed} handlers would be updated`);
}

// Main execution
async function main() {
  switch (PHASE) {
    case '1':
      await phase1_renameComponents();
      break;
    case '2':
      await phase2_standardizeEventHandlers();
      break;
    default:
      console.error(`Unknown phase: ${PHASE}`);
      process.exit(1);
  }
  
  // Print summary
  console.log('\n-----------------------------------');
  console.log('SUMMARY\n');
  
  if (changes.renamedFiles.length > 0) {
    console.log(`Files renamed: ${changes.renamedFiles.length}`);
    if (DRY_RUN) {
      console.log('(DRY RUN - no actual changes made)');
    }
  }
  
  if (changes.updatedImports.length > 0) {
    console.log(`Import statements updated: ${changes.updatedImports.length}`);
  }
  
  if (changes.updatedProps.length > 0) {
    const totalProps = changes.updatedProps.reduce((sum, { count }) => sum + count, 0);
    console.log(`Event props standardized: ${totalProps} in ${changes.updatedProps.length} files`);
  }
  
  if (changes.updatedHandlers.length > 0) {
    const totalHandlers = changes.updatedHandlers.reduce((sum, { count }) => sum + count, 0);
    console.log(`Event handlers standardized: ${totalHandlers} in ${changes.updatedHandlers.length} files`);
  }
  
  if (changes.errors.length > 0) {
    console.log(`\nErrors encountered: ${changes.errors.length}`);
    changes.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (!DRY_RUN && changes.renamedFiles.length > 0) {
    console.log('\n⚠️  IMPORTANT: Please run your build/test suite to ensure everything works correctly!');
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});