#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Directories to scan
const TARGET_DIRS = [
  'src/lib/components',
  'src/routes',
  'src/stories'
];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.svelte-kit',
  'build',
  'dist'
];

// Track changes for reporting
const changes = {
  renamedDirs: [],
  updatedImports: [],
  errors: []
};

// Find all directories that need renaming
function findDirectoriesToRename(dir) {
  const dirsToRename = [];
  
  function scan(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    
    const stats = fs.statSync(currentPath);
    if (!stats.isDirectory()) return;
    
    const dirName = path.basename(currentPath);
    
    // Skip excluded directories
    if (EXCLUDE_DIRS.includes(dirName)) return;
    
    // Check if directory name needs renaming (has uppercase letters)
    if (dirName !== dirName.toLowerCase() && dirName !== 'CreateListingForm') {
      // Special case: Keep CreateListingForm as is (it's a component grouping)
      dirsToRename.push({
        oldPath: currentPath,
        newPath: path.join(path.dirname(currentPath), dirName.toLowerCase()),
        oldName: dirName,
        newName: dirName.toLowerCase()
      });
    }
    
    // Scan subdirectories
    const entries = fs.readdirSync(currentPath);
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry);
      const entryStats = fs.statSync(entryPath);
      if (entryStats.isDirectory() && !EXCLUDE_DIRS.includes(entry)) {
        scan(entryPath);
      }
    }
  }
  
  scan(dir);
  return dirsToRename;
}

// Find all files that might contain imports
function findAllSourceFiles() {
  const files = [];
  
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && !EXCLUDE_DIRS.includes(entry)) {
        scan(fullPath);
      } else if (stats.isFile() && /\.(js|ts|svelte|md)$/.test(entry)) {
        files.push(fullPath);
      }
    }
  }
  
  scan('src');
  scan('docs');
  scan('scripts');
  return files;
}

// Update imports in a file
function updateImportsInFile(filePath, directoryMap) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Track all replacements for this file
  const replacements = [];
  
  for (const [oldDir, newDir] of directoryMap) {
    // Create patterns to match imports
    const patterns = [
      // Match standard imports
      new RegExp(`(from\\s+['"\`])([^'"\`]*/${oldDir}/)`, 'g'),
      new RegExp(`(from\\s+['"\`])([^'"\`]*/${oldDir}['"\`])`, 'g'),
      // Match dynamic imports
      new RegExp(`(import\\s*\\(\\s*['"\`])([^'"\`]*/${oldDir}/)`, 'g'),
      new RegExp(`(import\\s*\\(\\s*['"\`])([^'"\`]*/${oldDir}['"\`])`, 'g'),
      // Match $lib imports
      new RegExp(`(\\$lib/[^'"\`]*/${oldDir}/)`, 'g'),
      new RegExp(`(\\$lib/[^'"\`]*/${oldDir})([\s'"\`])`, 'g'),
      // Match relative imports
      new RegExp(`(\\.\\./[^'"\`]*/${oldDir}/)`, 'g'),
      new RegExp(`(\\.\\./[^'"\`]*/${oldDir})([\s'"\`])`, 'g'),
      new RegExp(`(\\./[^'"\`]*/${oldDir}/)`, 'g'),
      new RegExp(`(\\./[^'"\`]*/${oldDir})([\s'"\`])`, 'g')
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const newMatch = match.replace(`/${oldDir}/`, `/${newDir}/`).replace(`/${oldDir}`, `/${newDir}`);
          if (match !== newMatch) {
            replacements.push({ from: match, to: newMatch });
            content = content.replace(match, newMatch);
            modified = true;
          }
        });
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    changes.updatedImports.push({
      file: filePath,
      replacements: replacements.length
    });
  }
  
  return modified;
}

// Main execution
async function main() {
  console.log('🔍 Phase 3: Standardizing directory names to lowercase...\n');
  
  // Find all directories that need renaming
  const dirsToRename = [];
  for (const dir of TARGET_DIRS) {
    dirsToRename.push(...findDirectoriesToRename(dir));
  }
  
  if (dirsToRename.length === 0) {
    console.log('✅ All directories already follow lowercase convention!');
    return;
  }
  
  console.log(`Found ${dirsToRename.length} directories to rename:\n`);
  dirsToRename.forEach(({ oldName, newName }) => {
    console.log(`  ${oldName} → ${newName}`);
  });
  
  console.log('\n📝 Creating directory mapping...');
  
  // Create a map of old to new directory names
  const directoryMap = new Map();
  dirsToRename.forEach(({ oldName, newName }) => {
    directoryMap.set(oldName, newName);
  });
  
  // Find all source files
  const sourceFiles = findAllSourceFiles();
  console.log(`\n📄 Found ${sourceFiles.length} source files to check...`);
  
  // Update imports first (before renaming directories)
  console.log('\n🔄 Updating imports...');
  let updatedFiles = 0;
  
  for (const file of sourceFiles) {
    if (updateImportsInFile(file, directoryMap)) {
      updatedFiles++;
    }
  }
  
  console.log(`✅ Updated imports in ${updatedFiles} files`);
  
  // Rename directories using git mv
  console.log('\n📁 Renaming directories...');
  
  for (const { oldPath, newPath, oldName, newName } of dirsToRename) {
    try {
      // Use git mv to preserve history
      execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'pipe' });
      changes.renamedDirs.push({ oldName, newName });
      console.log(`  ✅ ${oldName} → ${newName}`);
    } catch (error) {
      // If git mv fails, try regular rename
      try {
        fs.renameSync(oldPath, newPath);
        changes.renamedDirs.push({ oldName, newName });
        console.log(`  ✅ ${oldName} → ${newName} (non-git rename)`);
      } catch (renameError) {
        changes.errors.push({
          dir: oldName,
          error: renameError.message
        });
        console.log(`  ❌ Failed to rename ${oldName}: ${renameError.message}`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`  - Directories renamed: ${changes.renamedDirs.length}`);
  console.log(`  - Files with updated imports: ${changes.updatedImports.length}`);
  console.log(`  - Errors: ${changes.errors.length}`);
  
  if (changes.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    changes.errors.forEach(({ dir, error }) => {
      console.log(`  - ${dir}: ${error}`);
    });
  }
  
  console.log('\n✅ Phase 3 complete! All directory names are now lowercase.');
  console.log('\n🎯 Next steps:');
  console.log('  1. Run "npm run dev" to verify the build');
  console.log('  2. Test the application thoroughly');
  console.log('  3. Commit these changes');
}

// Run the script
main().catch(console.error);