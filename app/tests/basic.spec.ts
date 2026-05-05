import { test, expect } from '@playwright/test';

test.describe('LuxPOS Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to load
    await page.goto('http://localhost:3001');
  });

  test('application loads without errors', async ({ page }) => {
    // Check that the page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check that it's not stuck on loading
    await expect(page.locator('text=Loading LuxPOS...')).not.toBeVisible({ timeout: 10000 });
    
    // Check for main navigation elements
    await expect(page.locator('h1')).toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    // Should redirect to login if not authenticated
    await page.waitForTimeout(2000);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('can navigate to login page', async ({ page }) => {
    // Navigate directly to login
    await page.goto('http://localhost:3001/login');
    
    // Verify login page elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
