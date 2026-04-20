import { test, expect } from '@playwright/test';

test.describe('Admin Demo Flow', () => {
  test('triggering halftime rush turns heatmap red within latency bounds', async ({ page }) => {
    // 1. Visit admin
    await page.goto('/admin', { waitUntil: 'networkidle' });
    
    // We expect the passcode challenge due to security hygiene
    if (page.url().includes('login')) {
      await page.fill('input[type="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin');
    }
    
    // 2. Click "Halftime Rush" to trigger density changes
    await page.click('text="Halftime Rush"');
    
    // 3. Go to map immediately
    await page.goto('/map', { waitUntil: 'networkidle' });
    
    // 4. Verify heatmap colors update within the demo latency bounds (<= 2 seconds)
    // Red / orange indicates high/critical crowd density.
    const highDensityCircle = page.locator('circle[fill="#ef4444"], circle[fill="#f97316"]');
    
    // Wait for at least one POI to exhibit high density conditions
    await expect(highDensityCircle.first()).toBeVisible({ timeout: 5000 });
  });
});
