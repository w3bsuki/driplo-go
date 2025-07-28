import fs from 'fs';
import { glob } from 'glob';

// Patterns to find unused imports
const unusedImportPatterns = [
  /'([^']+)' is declared but its value is never read/,
  /"([^"]+)" is declared but its value is never read/,
  /([a-zA-Z_$][a-zA-Z0-9_$]*) is declared but its value is never read/,
];

async function fixUnusedImports() {
  // Parse the TypeScript error log
  const errorLog = fs.readFileSync('typescript_errors.log', 'utf-8');
  const lines = errorLog.split('\n');
  
  // Map to store unused imports by file
  const unusedByFile = new Map();
  
  let currentFile = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract file path
    if (line.includes('[32m') && (line.includes('.svelte') || line.includes('.ts'))) {
      const match = line.match(/k:\\driplo-blue-main\\(.+?)\[39m/);
      if (match) {
        currentFile = match[1].replace(/\\/g, '/');
      }
    }
    
    // Check for unused import error
    if (line.includes('is declared but its value is never read')) {
      const prevLine = lines[i - 1] || '';
      let importName = '';
      
      // Try to extract the import name from the error
      for (const pattern of unusedImportPatterns) {
        const match = line.match(pattern);
        if (match) {
          importName = match[1];
          break;
        }
      }
      
      // Also try to extract from the highlighted code
      if (!importName && prevLine.includes('[35m')) {
        const codeMatch = prevLine.match(/\[35m([a-zA-Z_$][a-zA-Z0-9_$]*)\[36m/);
        if (codeMatch) {
          importName = codeMatch[1];
        }
      }
      
      if (importName && currentFile) {
        if (!unusedByFile.has(currentFile)) {
          unusedByFile.set(currentFile, new Set());
        }
        unusedByFile.get(currentFile).add(importName);
      }
    }
  }
  
  console.log(`Found ${unusedByFile.size} files with unused imports`);
  
  let totalFixed = 0;
  
  // Process each file
  for (const [filePath, unusedImports] of unusedByFile) {
    const fullPath = filePath;
    
    // Skip non-existent files
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping non-existent file: ${fullPath}`);
      continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');
    let newContent = content;
    let fixed = 0;
    
    for (const unusedImport of unusedImports) {
      // Pattern 1: Named imports - { Unused }
      const namedImportRegex = new RegExp(
        `(import\\s*{[^}]*?)\\b${unusedImport}\\b\\s*,?\\s*([^}]*}[^;]*;)`,
        'g'
      );
      
      newContent = newContent.replace(namedImportRegex, (match, before, after) => {
        fixed++;
        // Remove the import and clean up commas
        let result = before + after;
        result = result.replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
        // If empty import, remove the entire line
        if (result.match(/import\s*{\s*}\s*from/)) {
          return '';
        }
        return result;
      });
      
      // Pattern 2: Default imports - import Unused
      const defaultImportRegex = new RegExp(
        `^\\s*import\\s+${unusedImport}\\s+from\\s+['"'][^'"']+['"'];?\\s*$`,
        'gm'
      );
      
      newContent = newContent.replace(defaultImportRegex, (match) => {
        fixed++;
        return '';
      });
      
      // Pattern 3: Type imports - import type { Unused }
      const typeImportRegex = new RegExp(
        `(import\\s+type\\s*{[^}]*?)\\b${unusedImport}\\b\\s*,?\\s*([^}]*}[^;]*;)`,
        'g'
      );
      
      newContent = newContent.replace(typeImportRegex, (match, before, after) => {
        fixed++;
        let result = before + after;
        result = result.replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
        if (result.match(/import\s+type\s*{\s*}\s*from/)) {
          return '';
        }
        return result;
      });
    }
    
    // Clean up empty lines
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (fixed > 0 && newContent !== content) {
      fs.writeFileSync(fullPath, newContent);
      console.log(`Fixed ${fixed} unused imports in ${filePath}`);
      totalFixed += fixed;
    }
  }
  
  console.log(`\nTotal unused imports fixed: ${totalFixed}`);
}

fixUnusedImports().catch(console.error);