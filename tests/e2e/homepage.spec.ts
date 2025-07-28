import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage and show key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Driplo/);
    
    // Check header elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible();
    
    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check search functionality
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Browse' }).click();
    await expect(page).toHaveURL('/browse');
    
    // Check browse page loaded
    await expect(page.locator('h1')).toContainText(/Browse/i);
  });

  test('should show login/register buttons when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Look for auth buttons
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });
});