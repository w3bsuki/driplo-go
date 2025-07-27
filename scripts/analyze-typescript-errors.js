import fs from 'fs';

// Read the error log
const content = fs.readFileSync('typescript_errors.log', 'utf-8');
const lines = content.split('\n');

// Categories for errors
const categories = {
  deprecatedEvents: [],
  unusedVars: [],
  typeErrors: [],
  missingImports: [],
  indexSignature: [],
  otherErrors: [],
  warnings: []
};

// Parse errors
let currentFile = '';
lines.forEach((line, index) => {
  // Extract file path
  if (line.includes('\\[32m') && line.includes('.svelte') || line.includes('.ts')) {
    const match = line.match(/k:\\driplo-blue-main\\(.+?)(?:\[39m|$)/);
    if (match) {
      currentFile = match[1];
    }
  }
  
  // Categorize errors
  if (line.includes('event_directive_deprecated')) {
    categories.deprecatedEvents.push({ file: currentFile, line });
  } else if (line.includes('is declared but its value is never read')) {
    categories.unusedVars.push({ file: currentFile, line });
  } else if (line.includes('Type ') && line.includes('is not assignable to type')) {
    categories.typeErrors.push({ file: currentFile, line });
  } else if (line.includes('Cannot find module') || line.includes('has no exported member')) {
    categories.missingImports.push({ file: currentFile, line });
  } else if (line.includes('Element implicitly has an')) {
    categories.indexSignature.push({ file: currentFile, line });
  } else if (line.includes('[31mError[39m:')) {
    categories.otherErrors.push({ file: currentFile, line });
  } else if (line.includes('[33mWarn[39m:')) {
    categories.warnings.push({ file: currentFile, line });
  }
});

// Get unique files with deprecated events
const filesWithDeprecatedEvents = new Set();
categories.deprecatedEvents.forEach(err => {
  if (err.file) filesWithDeprecatedEvents.add(err.file);
});

// Summary
console.log('TypeScript Error Analysis:');
console.log('=========================');
console.log(`Deprecated event handlers: ${categories.deprecatedEvents.length} (${filesWithDeprecatedEvents.size} files)`);
console.log(`Unused variables/imports: ${categories.unusedVars.length}`);
console.log(`Type assignment errors: ${categories.typeErrors.length}`);
console.log(`Missing imports/exports: ${categories.missingImports.length}`);
console.log(`Index signature errors: ${categories.indexSignature.length}`);
console.log(`Other errors: ${categories.otherErrors.length}`);
console.log(`Warnings: ${categories.warnings.length}`);

// List files with most deprecated events
console.log('\nFiles with deprecated events:');
const eventCounts = {};
categories.deprecatedEvents.forEach(err => {
  if (err.file) {
    eventCounts[err.file] = (eventCounts[err.file] || 0) + 1;
  }
});
Object.entries(eventCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([file, count]) => {
    console.log(`  ${file}: ${count} events`);
  });

// Save detailed report
const report = {
  summary: {
    deprecatedEvents: categories.deprecatedEvents.length,
    unusedVars: categories.unusedVars.length,
    typeErrors: categories.typeErrors.length,
    missingImports: categories.missingImports.length,
    indexSignature: categories.indexSignature.length,
    otherErrors: categories.otherErrors.length,
    warnings: categories.warnings.length
  },
  filesWithDeprecatedEvents: Array.from(filesWithDeprecatedEvents),
  categories
};

fs.writeFileSync('typescript-error-analysis.json', JSON.stringify(report, null, 2));
console.log('\nDetailed report saved to: typescript-error-analysis.json');