module.exports = {
  ci: {
    collect: {
      // Start server command
      startServerCommand: 'npm run build && npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      
      // URLs to test
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/browse',
        'http://localhost:4173/listings/test-listing',
        'http://localhost:4173/profile/test-user',
        'http://localhost:4173/login'
      ],
      
      // Number of test runs
      numberOfRuns: 3,
      
      // Lighthouse settings
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    
    upload: {
      target: 'temporary-public-storage'
    },
    
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        
        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // PWA - warn only as it's optional
        'categories:pwa': ['warn', { minScore: 0.5 }],
        
        // Allow some specific issues
        'uses-http2': 'off',
        'uses-long-cache-ttl': 'off',
        'csp-xss': 'off' // CSP can be strict in dev
      }
    }
  }
};