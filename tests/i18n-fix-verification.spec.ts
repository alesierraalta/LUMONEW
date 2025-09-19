import { test, expect } from '@playwright/test';

test.describe('Internationalization Fix Verification', () => {
  test('should display Spanish translations without errors', async ({ page }) => {
    // Navigate to the inventory page (where the error was occurring)
    await page.goto('http://localhost:3000/inventory');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 });
    
    // Check for any console errors related to missing translations
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Wait a bit for any potential errors to appear
    await page.waitForTimeout(3000);
    
    // Check for translation-related errors
    const translationErrors = logs.filter(log => 
      log.includes('MISSING_MESSAGE') || 
      log.includes('Could not resolve') ||
      log.includes('inventory.noItemsFound')
    );
    
    // Should have no translation errors
    expect(translationErrors).toHaveLength(0);
    console.log('✅ No translation errors found in console');
    
    // Check if the "no items found" message is displayed properly
    const noItemsMessage = page.locator('text=No se encontraron artículos');
    if (await noItemsMessage.count() > 0) {
      console.log('✅ Spanish "no items found" message is displayed correctly');
    }
    
    // Verify the page loads without crashing
    const currentUrl = page.url();
    expect(currentUrl).toContain('/inventory');
    console.log('✅ Inventory page loads successfully');
  });

  test('should handle empty inventory state gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/inventory');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 });
    
    // Check if there are any items or if the empty state is shown
    const tableRows = page.locator('[data-testid="inventory-table"] tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount === 0) {
      // If no items, check that the empty state message is displayed
      const emptyStateMessage = page.locator('text=No se encontraron artículos que coincidan con tus criterios');
      await expect(emptyStateMessage).toBeVisible();
      console.log('✅ Empty state message is displayed correctly in Spanish');
    } else {
      console.log('✅ Inventory table has items and displays correctly');
    }
    
    // Check for any JavaScript errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Should have no errors
    const errorLogs = logs.filter(log => 
      !log.includes('favicon') && // Ignore favicon errors
      !log.includes('404') // Ignore 404 errors for assets
    );
    
    expect(errorLogs).toHaveLength(0);
    console.log('✅ No JavaScript errors found');
  });

  test('should maintain Spanish locale throughout the application', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Check that Spanish text is displayed
    const spanishText = page.locator('text=Panel de Control');
    await expect(spanishText).toBeVisible();
    console.log('✅ Dashboard displays in Spanish');
    
    // Navigate to inventory
    await page.click('a[href="/inventory"]');
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 });
    
    // Check that inventory page also displays in Spanish
    const inventoryTitle = page.locator('text=Inventario');
    await expect(inventoryTitle).toBeVisible();
    console.log('✅ Inventory page displays in Spanish');
    
    // Check for any console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    const translationErrors = logs.filter(log => 
      log.includes('MISSING_MESSAGE') || 
      log.includes('Could not resolve')
    );
    
    expect(translationErrors).toHaveLength(0);
    console.log('✅ No translation errors during navigation');
  });
});