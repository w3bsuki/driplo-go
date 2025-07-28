import { test } from '@playwright/test';

/**
 * Visual Regression Test Suite - Baseline Capture
 * This captures screenshots of key pages before refactoring
 */

const pages = [
  { name: 'home', path: '/' },
  { name: 'browse', path: '/browse' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'profile', path: '/profile' },
  { name: 'create-listing', path: '/sell/create' },
  { name: 'checkout', path: '/checkout' },
  { name: 'messages', path: '/messages' }
];

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

test.describe('Visual Regression Baseline', () => {
  for (const page of pages) {
    for (const viewport of viewports) {
      test(`Capture ${page.name} - ${viewport.name}`, async ({ page: playwrightPage }) => {
        // Set viewport
        await playwrightPage.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });
        
        // Navigate to page
        await playwrightPage.goto(page.path, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Wait for any animations to complete
        await playwrightPage.waitForTimeout(1000);
        
        // Take screenshot
        await playwrightPage.screenshot({
          path: `tests/visual-regression/baseline/${page.name}-${viewport.name}.png`,
          fullPage: true
        });
      });
    }
  }
});

test.describe('Component Screenshots', () => {
  test('Capture key components', async ({ page }) => {
    await page.goto('/browse', { waitUntil: 'networkidle' });
    
    // Header component
    const header = page.locator('header').first();
    if (await header.isVisible()) {
      await header.screenshot({ 
        path: 'tests/visual-regression/baseline/component-header.png' 
      });
    }
    
    // Listing card component
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    if (await listingCard.isVisible()) {
      await listingCard.screenshot({ 
        path: 'tests/visual-regression/baseline/component-listing-card.png' 
      });
    }
    
    // Button variants
    await page.goto('/');
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      await buttons.screenshot({ 
        path: 'tests/visual-regression/baseline/component-button.png' 
      });
    }
  });
});