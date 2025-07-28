import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Performance thresholds
const THRESHOLDS = {
  bundleSize: {
    total: 1000 * 1024, // 1MB total
    jsSize: 500 * 1024, // 500KB JS
    cssSize: 200 * 1024, // 200KB CSS
  },
  lighthouse: {
    performance: 80,
    accessibility: 90,
    bestPractices: 90,
    seo: 90,
  },
  coverage: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  }
};

// Check bundle sizes
function checkBundleSizes() {
  console.log('📦 Checking bundle sizes...');
  
  try {
    // Build the project
    execSync('npm run build', { stdio: 'inherit' });
    
    // Analyze build output
    const buildDir = '.svelte-kit/output/client';
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          totalSize += stat.size;
          if (file.endsWith('.js') || file.endsWith('.mjs')) {
            jsSize += stat.size;
          } else if (file.endsWith('.css')) {
            cssSize += stat.size;
          }
        }
      }
    }
    
    if (fs.existsSync(buildDir)) {
      walkDir(buildDir);
      
      console.log(`Total size: ${(totalSize / 1024).toFixed(2)}KB`);
      console.log(`JS size: ${(jsSize / 1024).toFixed(2)}KB`);
      console.log(`CSS size: ${(cssSize / 1024).toFixed(2)}KB`);
      
      // Check against thresholds
      const errors = [];
      if (totalSize > THRESHOLDS.bundleSize.total) {
        errors.push(`Total bundle size (${(totalSize / 1024).toFixed(2)}KB) exceeds threshold (${(THRESHOLDS.bundleSize.total / 1024).toFixed(2)}KB)`);
      }
      if (jsSize > THRESHOLDS.bundleSize.jsSize) {
        errors.push(`JS bundle size (${(jsSize / 1024).toFixed(2)}KB) exceeds threshold (${(THRESHOLDS.bundleSize.jsSize / 1024).toFixed(2)}KB)`);
      }
      if (cssSize > THRESHOLDS.bundleSize.cssSize) {
        errors.push(`CSS bundle size (${(cssSize / 1024).toFixed(2)}KB) exceeds threshold (${(THRESHOLDS.bundleSize.cssSize / 1024).toFixed(2)}KB)`);
      }
      
      return { success: errors.length === 0, errors };
    }
  } catch (error) {
    return { success: false, errors: [error.message] };
  }
}

// Run Lighthouse CI
function runLighthouse() {
  console.log('\n🚨 Running Lighthouse CI...');
  
  try {
    execSync('npm run lighthouse', { stdio: 'inherit' });
    return { success: true };
  } catch (error) {
    return { success: false, errors: ['Lighthouse CI failed'] };
  }
}

// Check test coverage
function checkTestCoverage() {
  console.log('\n🧪 Checking test coverage...');
  
  try {
    execSync('npm run test:coverage', { stdio: 'inherit' });
    
    // Read coverage summary
    const coveragePath = './coverage/coverage-summary.json';
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;
      
      console.log(`Statements: ${total.statements.pct}%`);
      console.log(`Branches: ${total.branches.pct}%`);
      console.log(`Functions: ${total.functions.pct}%`);
      console.log(`Lines: ${total.lines.pct}%`);
      
      // Check against thresholds
      const errors = [];
      if (total.statements.pct < THRESHOLDS.coverage.statements) {
        errors.push(`Statement coverage (${total.statements.pct}%) below threshold (${THRESHOLDS.coverage.statements}%)`);
      }
      if (total.branches.pct < THRESHOLDS.coverage.branches) {
        errors.push(`Branch coverage (${total.branches.pct}%) below threshold (${THRESHOLDS.coverage.branches}%)`);
      }
      if (total.functions.pct < THRESHOLDS.coverage.functions) {
        errors.push(`Function coverage (${total.functions.pct}%) below threshold (${THRESHOLDS.coverage.functions}%)`);
      }
      if (total.lines.pct < THRESHOLDS.coverage.lines) {
        errors.push(`Line coverage (${total.lines.pct}%) below threshold (${THRESHOLDS.coverage.lines}%)`);
      }
      
      return { success: errors.length === 0, errors };
    }
  } catch (error) {
    return { success: false, errors: ['Coverage check failed'] };
  }
}

// Main
async function main() {
  console.log('🎯 Performance Monitoring Report\n');
  
  const results = [];
  
  // Run checks
  results.push({
    name: 'Bundle Sizes',
    ...checkBundleSizes()
  });
  
  results.push({
    name: 'Lighthouse CI',
    ...runLighthouse()
  });
  
  results.push({
    name: 'Test Coverage',
    ...checkTestCoverage()
  });
  
  // Summary
  console.log('\n📊 Summary:');
  let hasErrors = false;
  
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.name}: PASSED`);
    } else {
      hasErrors = true;
      console.log(`❌ ${result.name}: FAILED`);
      if (result.errors) {
        result.errors.forEach(err => console.log(`   - ${err}`));
      }
    }
  }
  
  process.exit(hasErrors ? 1 : 0);
}

main();