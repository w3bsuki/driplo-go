#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');

console.log(`Event Handler Naming Standardization`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log('-----------------------------------\n');

// Track changes
const changes = {
  files: [],
  totalProps: 0,
  totalHandlers: 0,
  totalDirectives: 0,
  errors: []
};

// Main execution
async function main() {
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
  
  for (const filePath of filesToProcess) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const updates = analyzeAndFix(content, filePath);
      
      if (updates.modified) {
        const relativePath = path.relative(srcDir, filePath);
        
        if (!DRY_RUN) {
          fs.writeFileSync(filePath, updates.content);
          console.log(`✓ Updated ${relativePath} (${updates.propsFixed} props, ${updates.handlersFixed} handlers, ${updates.directivesFixed} directives)`);
        } else {
          console.log(`Would update ${relativePath} (${updates.propsFixed} props, ${updates.handlersFixed} handlers, ${updates.directivesFixed} directives)`);
        }
        
        changes.files.push({
          path: relativePath,
          props: updates.propsFixed,
          handlers: updates.handlersFixed,
          directives: updates.directivesFixed
        });
        
        changes.totalProps += updates.propsFixed;
        changes.totalHandlers += updates.handlersFixed;
        changes.totalDirectives += updates.directivesFixed;
      }
    } catch (error) {
      changes.errors.push(`Failed to process ${filePath}: ${error.message}`);
    }
  }
  
  // Print summary
  console.log('\n-----------------------------------');
  console.log('SUMMARY\n');
  
  console.log(`Files updated: ${changes.files.length}`);
  console.log(`Props standardized: ${changes.totalProps}`);
  console.log(`Handlers standardized: ${changes.totalHandlers}`);
  console.log(`Event directives fixed: ${changes.totalDirectives}`);
  
  if (changes.errors.length > 0) {
    console.log(`\nErrors encountered: ${changes.errors.length}`);
    changes.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (!DRY_RUN && changes.files.length > 0) {
    console.log('\n⚠️  IMPORTANT: Please run your build/test suite to ensure everything works correctly!');
  }
}

function analyzeAndFix(content, filePath) {
  let modified = false;
  let propsFixed = 0;
  let handlersFixed = 0;
  let directivesFixed = 0;
  let result = content;
  
  // Fix TypeScript interfaces and type definitions
  if (filePath.endsWith('.ts') || filePath.endsWith('.svelte')) {
    // Fix prop type definitions that should be onEvent
    result = result.replace(/(\s+)(handle)([A-Z]\w+)(\??\s*:\s*\([^)]*\)\s*=>\s*(?:void|any|Promise<\w+>))/g, (match, prefix, handle, eventName, suffix) => {
      propsFixed++;
      modified = true;
      return `${prefix}on${eventName}${suffix}`;
    });
    
    // Fix incorrectly named event props (like "submit:", "click:", etc.)
    result = result.replace(/(\s+)(submit|click|change|input|focus|blur|keydown|keyup|mouseenter|mouseleave)(\??\s*:\s*\([^)]*\)\s*=>\s*(?:void|any|Promise<\w+>))/g, (match, prefix, event, suffix) => {
      propsFixed++;
      modified = true;
      return `${prefix}on${event.charAt(0).toUpperCase() + event.slice(1)}${suffix}`;
    });
  }
  
  // Fix Svelte-specific patterns
  if (filePath.endsWith('.svelte')) {
    // Fix event handler function declarations
    result = result.replace(/((?:const|let|function)\s+)(on)([A-Z]\w+)(\s*=?\s*(?:async\s*)?\([^)]*\)\s*(?:=>\s*)?{)/g, (match, prefix, on, eventName, suffix) => {
      handlersFixed++;
      modified = true;
      return `${prefix}handle${eventName}${suffix}`;
    });
    
    // Fix event directives (onclick={functionName})
    result = result.replace(/\bon(click|change|input|submit|focus|blur|keydown|keyup|mouseenter|mouseleave|scroll|touchstart|touchend|touchmove)=\{([^}]+)\}/g, (match, event, handler) => {
      // Skip if already properly named
      if (handler.trim().startsWith('handle') || handler.trim().startsWith('()')) {
        return match;
      }
      
      // Skip if it's an inline arrow function
      if (handler.includes('=>')) {
        return match;
      }
      
      // Skip if it's a method call with parentheses
      if (handler.includes('(') && handler.includes(')')) {
        return match;
      }
      
      directivesFixed++;
      modified = true;
      
      // If it's a simple function name, convert it
      const trimmedHandler = handler.trim();
      const newHandler = `handle${trimmedHandler.charAt(0).toUpperCase() + trimmedHandler.slice(1)}`;
      
      // Also update the function declaration if it exists
      const functionPattern = new RegExp(`((?:const|let|function)\\s+)${trimmedHandler}(\\s*=?\\s*(?:async\\s*)?\\([^)]*\\)\\s*(?:=>\\s*)?{)`, 'g');
      result = result.replace(functionPattern, `$1${newHandler}$2`);
      
      return `on${event}={${newHandler}}`;
    });
    
    // Fix bind:group and other directives that might have event handlers
    result = result.replace(/bind:(checked|value|group)=\{(\w+)\}/g, (match, directive, binding) => {
      if (directive === 'group' && !binding.startsWith('selected') && !binding.includes('group')) {
        modified = true;
        return `bind:${directive}={selected${binding.charAt(0).toUpperCase() + binding.slice(1)}}`;
      }
      return match;
    });
  }
  
  return {
    content: result,
    modified,
    propsFixed,
    handlersFixed,
    directivesFixed
  };
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});