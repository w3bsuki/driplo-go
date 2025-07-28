import { test, expect } from '@playwright/test';

/**
 * Visual Regression Test Suite - Comparison
 * This compares current screenshots against baseline
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

test.describe('Visual Regression Comparison', () => {
  for (const page of pages) {
    for (const viewport of viewports) {
      test(`Compare ${page.name} - ${viewport.name}`, async ({ page: playwrightPage }) => {
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
        
        // Compare against baseline
        await expect(playwrightPage).toHaveScreenshot(
          `${page.name}-${viewport.name}.png`,
          {
            fullPage: true,
            maxDiffPixels: 100, // Allow small differences
            threshold: 0.2 // 20% threshold for pixel differences
          }
        );
      });
    }
  }
});

test.describe('Component Comparison', () => {
  test('Compare key components', async ({ page }) => {
    await page.goto('/browse', { waitUntil: 'networkidle' });
    
    // Header component
    const header = page.locator('header').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('component-header.png', {
        maxDiffPixels: 50,
        threshold: 0.2
      });
    }
    
    // Listing card component
    const listingCard = page.locator('[data-testid="listing-card"]').first();
    if (await listingCard.isVisible()) {
      await expect(listingCard).toHaveScreenshot('component-listing-card.png', {
        maxDiffPixels: 50,
        threshold: 0.2
      });
    }
    
    // Button variants
    await page.goto('/');
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      await expect(buttons).toHaveScreenshot('component-button.png', {
        maxDiffPixels: 50,
        threshold: 0.2
      });
    }
  });
});