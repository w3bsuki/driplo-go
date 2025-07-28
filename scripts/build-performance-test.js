#!/usr/bin/env node

/**
 * Build Performance Measurement Script
 * Measures build time and analyzes bundle composition
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function measureBuildTime() {
  console.log('🚀 Starting build performance measurement...');
  
  try {
    // Clear build cache
    console.log('🧹 Clearing build cache...');
    try {
      await fs.rm('.svelte-kit', { recursive: true, force: true });
      await fs.rm('build', { recursive: true, force: true });
    } catch (e) {
      // Cache might not exist, that's fine
    }
    
    // Measure build time
    console.log('⏱️  Starting build timer...');
    const startTime = Date.now();
    
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: process.cwd(),
      timeout: 300000 // 5 minute timeout
    });
    
    const endTime = Date.now();
    const buildTimeSeconds = (endTime - startTime) / 1000;
    
    console.log('✅ Build completed successfully!');
    console.log(`⚡ Build time: ${buildTimeSeconds.toFixed(2)}s`);
    
    // Analyze bundle if build directory exists
    try {
      const buildStats = await analyzeBundleSize();
      console.log('📊 Bundle Analysis:');
      console.log(`   Total size: ${(buildStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   CSS files: ${buildStats.cssFiles} (${(buildStats.cssSize / 1024).toFixed(2)} KB)`);
      console.log(`   Font files: ${buildStats.fontFiles} (${(buildStats.fontSize / 1024).toFixed(2)} KB)`);
      console.log(`   JS files: ${buildStats.jsFiles} (${(buildStats.jsSize / 1024 / 1024).toFixed(2)} MB)`);
      
      // Performance assessment
      const performanceGrade = getPerformanceGrade(buildTimeSeconds, buildStats);
      console.log(`\n🎯 Performance Grade: ${performanceGrade}`);
      
      return {
        buildTime: buildTimeSeconds,
        ...buildStats,
        grade: performanceGrade
      };
    } catch (e) {
      console.warn('⚠️  Could not analyze bundle (build directory not found)');
      return { buildTime: buildTimeSeconds };
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    throw error;
  }
}

async function analyzeBundleSize() {
  const buildDir = 'build';
  const stats = {
    totalSize: 0,
    cssFiles: 0,
    cssSize: 0,
    fontFiles: 0,
    fontSize: 0,
    jsFiles: 0,
    jsSize: 0
  };
  
  async function scanDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        const size = stat.size;
        stats.totalSize += size;
        
        const ext = path.extname(entry.name).toLowerCase();
        
        if (ext === '.css') {
          stats.cssFiles++;
          stats.cssSize += size;
        } else if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) {
          stats.fontFiles++;
          stats.fontSize += size;
        } else if (['.js', '.mjs'].includes(ext)) {
          stats.jsFiles++;
          stats.jsSize += size;
        }
      }
    }
  }
  
  await scanDirectory(buildDir);
  return stats;
}

function getPerformanceGrade(buildTime, stats) {
  let score = 100;
  
  // Build time scoring (target: <20s)
  if (buildTime > 60) score -= 40;
  else if (buildTime > 30) score -= 20;
  else if (buildTime > 20) score -= 10;
  
  // Bundle size scoring
  const totalMB = stats.totalSize / 1024 / 1024;
  if (totalMB > 10) score -= 20;
  else if (totalMB > 5) score -= 10;
  
  // CSS size scoring
  const cssKB = stats.cssSize / 1024;
  if (cssKB > 500) score -= 15;
  else if (cssKB > 200) score -= 5;
  
  // Font size scoring
  const fontKB = stats.fontSize / 1024;
  if (fontKB > 1000) score -= 15;
  else if (fontKB > 500) score -= 5;
  
  if (score >= 90) return '🟢 A+ (Excellent)';
  if (score >= 80) return '🟢 A (Very Good)';
  if (score >= 70) return '🟡 B (Good)';
  if (score >= 60) return '🟡 C (Fair)';
  if (score >= 50) return '🟠 D (Poor)';
  return '🔴 F (Critical)';
}

// Run the measurement
if (import.meta.url === `file://${process.argv[1]}`) {
  measureBuildTime()
    .then(results => {
      console.log('\n📈 Performance Summary:');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
}

export { measureBuildTime };