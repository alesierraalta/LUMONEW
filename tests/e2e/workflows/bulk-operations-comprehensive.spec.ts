import { test, expect } from '@playwright/test';
import { InventoryFlow } from '../page-objects/inventory-page';
import { AuthPage } from '../page-objects/auth-page';
import { formData, testInventoryItems, urls, testUsers } from '../fixtures/test-data';

test.describe('Comprehensive Bulk Operations Tests', () => {
  let inventoryFlow: InventoryFlow;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    inventoryFlow = new InventoryFlow(page);
    authPage = new AuthPage(page);
    
    // Login as admin before each test
    await authPage.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.describe('Bulk Create Operations', () => {
    test('Bulk create with valid data - all fields filled', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill all rows with complete data
      const bulkData = [
        { sku: 'BULK-001', name: 'Bulk Item 1', category: 'Electronics' },
        { sku: 'BULK-002', name: 'Bulk Item 2', category: 'Clothing' },
        { sku: 'BULK-003', name: 'Bulk Item 3', category: 'Books' }
      ];
      
      for (let i = 0; i < bulkData.length; i++) {
        await page.fill(`[data-testid="bulk-sku-${i + 1}"]`, bulkData[i].sku);
        await page.fill(`[data-testid="bulk-name-${i + 1}"]`, bulkData[i].name);
        await page.selectOption(`[data-testid="bulk-category-${i + 1}"]`, bulkData[i].category);
      }
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify all items were created
      await inventoryFlow.inventory.goto();
      for (const item of bulkData) {
        await inventoryFlow.inventory.expectInventoryItemVisible(item.name);
      }
    });

    test('Bulk create with partial data - some fields empty', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill only required fields (SKU and name)
      await page.fill('[data-testid="bulk-sku-1"]', 'PARTIAL-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Partial Data Item 1');
      
      await page.fill('[data-testid="bulk-sku-2"]', 'PARTIAL-002');
      await page.fill('[data-testid="bulk-name-2"]', 'Partial Data Item 2');
      
      // Leave third row empty
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify only filled items were created
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible('Partial Data Item 1');
      await inventoryFlow.inventory.expectInventoryItemVisible('Partial Data Item 2');
    });

    test('Bulk create validation - empty required fields', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Try to submit with empty required fields
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name is required');
    });

    test('Bulk create with duplicate SKUs', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Create items with duplicate SKUs
      await page.fill('[data-testid="bulk-sku-1"]', 'DUPLICATE-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Duplicate Item 1');
      
      await page.fill('[data-testid="bulk-sku-2"]', 'DUPLICATE-001'); // Same SKU
      await page.fill('[data-testid="bulk-name-2"]', 'Duplicate Item 2');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show duplicate SKU error
      await expect(page.locator('[data-testid="duplicate-sku-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="duplicate-sku-error"]')).toContainText('Duplicate SKU found');
    });

    test('Bulk create with special characters and long names', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      const specialData = [
        { sku: 'SPEC-@#$%-001', name: 'Item with Special Chars: @#$%^&*()' },
        { sku: 'LONG-001', name: 'A'.repeat(100) }, // Long name
        { sku: 'EMOJI-001', name: 'Item with émojis 🚀 and ñ characters' }
      ];
      
      for (let i = 0; i < specialData.length; i++) {
        await page.fill(`[data-testid="bulk-sku-${i + 1}"]`, specialData[i].sku);
        await page.fill(`[data-testid="bulk-name-${i + 1}"]`, specialData[i].name);
      }
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify items were created
      await inventoryFlow.inventory.goto();
      for (const item of specialData) {
        await inventoryFlow.inventory.expectInventoryItemVisible(item.name.substring(0, 50)); // Truncated display
      }
    });

    test('Bulk create with advanced mode - location and quantity', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Enable advanced mode
      await page.click('[data-testid="advanced-mode-toggle"]');
      
      // Fill advanced fields
      await page.fill('[data-testid="bulk-sku-1"]', 'ADV-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Advanced Item 1');
      await page.selectOption('[data-testid="bulk-location-1"]', 'Warehouse A');
      await page.fill('[data-testid="bulk-quantity-1"]', '25');
      
      await page.fill('[data-testid="bulk-sku-2"]', 'ADV-002');
      await page.fill('[data-testid="bulk-name-2"]', 'Advanced Item 2');
      await page.selectOption('[data-testid="bulk-location-2"]', 'Store Front');
      await page.fill('[data-testid="bulk-quantity-2"]', '10');
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify items were created with correct quantities
      await inventoryFlow.inventory.goto();
      const item1 = await inventoryFlow.inventory.getInventoryItemDetails(0);
      const item2 = await inventoryFlow.inventory.getInventoryItemDetails(1);
      
      expect(item1.quantity).toContain('25');
      expect(item2.quantity).toContain('10');
    });

    test('Bulk create performance with large dataset', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Add more rows for large dataset test
      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="add-row-button"]');
      }
      
      // Fill all rows
      for (let i = 1; i <= 23; i++) { // 3 initial + 20 added
        await page.fill(`[data-testid="bulk-sku-${i}"]`, `PERF-${i.toString().padStart(3, '0')}`);
        await page.fill(`[data-testid="bulk-name-${i}"]`, `Performance Test Item ${i}`);
      }
      
      const startTime = Date.now();
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
      
      // Verify all items were created
      await inventoryFlow.inventory.goto();
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThanOrEqual(23);
    });
  });

  test.describe('Bulk Update Operations', () => {
    test('Bulk price update', async ({ page }) => {
      // First create some test items
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      for (let i = 1; i <= 3; i++) {
        await page.fill(`[data-testid="bulk-sku-${i}"]`, `UPDATE-${i}`);
        await page.fill(`[data-testid="bulk-name-${i}"]`, `Update Test Item ${i}`);
      }
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Now test bulk update
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Update prices
      await inventoryFlow.bulkOperations.performBulkUpdate('price', '99.99');
      
      // Verify prices were updated
      await inventoryFlow.inventory.goto();
      const item1 = await inventoryFlow.inventory.getInventoryItemDetails(0);
      const item2 = await inventoryFlow.inventory.getInventoryItemDetails(1);
      const item3 = await inventoryFlow.inventory.getInventoryItemDetails(2);
      
      expect(item1.price).toContain('99.99');
      expect(item2.price).toContain('99.99');
      expect(item3.price).toContain('99.99');
    });

    test('Bulk category update', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Update categories
      await inventoryFlow.bulkOperations.performBulkUpdate('category', 'Electronics');
      
      // Verify categories were updated
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByCategory('Electronics');
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });

    test('Bulk location update', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Update locations
      await inventoryFlow.bulkOperations.performBulkUpdate('location', 'Warehouse A');
      
      // Verify locations were updated
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByLocation('Warehouse A');
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });

    test('Bulk status update', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Update status to inactive
      await inventoryFlow.bulkOperations.performBulkUpdate('status', 'inactive');
      
      // Verify status was updated
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByStatus('inactive');
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });
  });

  test.describe('Bulk Delete Operations', () => {
    test('Bulk delete with confirmation', async ({ page }) => {
      // Create test items first
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      for (let i = 1; i <= 3; i++) {
        await page.fill(`[data-testid="bulk-sku-${i}"]`, `DELETE-${i}`);
        await page.fill(`[data-testid="bulk-name-${i}"]`, `Delete Test Item ${i}`);
      }
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Now test bulk delete
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('delete');
      await inventoryFlow.bulkOperations.expectModalVisible();
      await inventoryFlow.bulkOperations.expectSelectedItemsCount(3);
      
      // Confirm deletion
      await inventoryFlow.bulkOperations.performBulkDelete();
      
      // Verify items were deleted
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemNotVisible('Delete Test Item 1');
      await inventoryFlow.inventory.expectInventoryItemNotVisible('Delete Test Item 2');
      await inventoryFlow.inventory.expectInventoryItemNotVisible('Delete Test Item 3');
    });

    test('Bulk delete cancellation', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('delete');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Cancel deletion
      await page.click('[data-testid="cancel-bulk-delete"]');
      
      // Verify items are still there
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });

    test('Bulk delete with items that have transactions', async ({ page }) => {
      // This test assumes there are business rules preventing deletion of items with transactions
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('delete');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      await inventoryFlow.bulkOperations.performBulkDelete();
      
      // Check for error message if items have transactions
      const errorMessage = page.locator('[data-testid="bulk-delete-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText('Cannot delete items with active transactions');
      }
    });
  });

  test.describe('Bulk Operations Edge Cases', () => {
    test('Bulk operations with no items selected', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Try to perform bulk action without selecting items
      await inventoryFlow.inventory.performBulkAction('update');
      
      // Should show message about selecting items
      await expect(page.locator('[data-testid="no-items-selected"]')).toBeVisible();
    });

    test('Bulk operations with mixed item types', async ({ page }) => {
      // Create items with different categories and locations
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      await page.fill('[data-testid="bulk-sku-1"]', 'MIXED-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Mixed Item 1');
      await page.selectOption('[data-testid="bulk-category-1"]', 'Electronics');
      
      await page.fill('[data-testid="bulk-sku-2"]', 'MIXED-002');
      await page.fill('[data-testid="bulk-name-2"]', 'Mixed Item 2');
      await page.selectOption('[data-testid="bulk-category-2"]', 'Clothing');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Select mixed items and try bulk update
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectInventoryItem(0);
      await inventoryFlow.inventory.selectInventoryItem(1);
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Should show warning about mixed item types
      await expect(page.locator('[data-testid="mixed-items-warning"]')).toBeVisible();
    });

    test('Bulk operations with network failure', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      // Simulate network failure
      await page.route('**/api/inventory/bulk-update', route => {
        route.abort('failed');
      });
      
      await inventoryFlow.bulkOperations.performBulkUpdate('price', '99.99');
      
      // Should show error message
      await expect(page.locator('[data-testid="bulk-operation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-bulk-operation"]')).toBeVisible();
    });

    test('Bulk operations with partial success', async ({ page }) => {
      // Mock partial success response
      await page.route('**/api/inventory/bulk-update', route => {
        route.fulfill({
          status: 207, // Multi-status
          contentType: 'application/json',
          body: JSON.stringify({
            success: 2,
            failed: 1,
            errors: [
              { item: 'Item 3', error: 'Invalid price format' }
            ]
          })
        });
      });
      
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      
      await inventoryFlow.bulkOperations.performBulkUpdate('price', '99.99');
      
      // Should show partial success message
      await expect(page.locator('[data-testid="partial-success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="partial-success-message"]')).toContainText('2 items updated successfully, 1 failed');
    });
  });

  test.describe('Bulk Operations Performance', () => {
    test('Bulk operations with large selection', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/inventory/items', route => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          sku: `SKU-${i}`,
          quantity: Math.floor(Math.random() * 100),
          price: Math.random() * 100
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: largeDataset })
        });
      });
      
      await inventoryFlow.inventory.goto();
      
      // Select all items (1000 items)
      await inventoryFlow.inventory.selectAllInventoryItems();
      
      const startTime = Date.now();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      const endTime = Date.now();
      
      // Should handle large selection efficiently
      expect(endTime - startTime).toBeLessThan(5000);
      
      // Verify selected count is correct
      await inventoryFlow.bulkOperations.expectSelectedItemsCount(1000);
    });

    test('Bulk operations with concurrent users', async ({ page, context }) => {
      // Create multiple browser contexts
      const contexts = await Promise.all([
        context.browser()?.newContext(),
        context.browser()?.newContext()
      ]);
      
      const pages = await Promise.all(contexts.map(ctx => ctx?.newPage()));
      
      // Login all users
      await Promise.all(pages.map(async (p) => {
        if (p) {
          const authPage = new AuthPage(p);
          await authPage.login.goto();
          await authPage.login.loginAsAdmin();
        }
      }));
      
      // Perform concurrent bulk operations
      const operations = pages.map(async (p, index) => {
        if (p) {
          const inventoryFlow = new InventoryFlow(p);
          await inventoryFlow.inventory.goto();
          await inventoryFlow.inventory.selectAllInventoryItems();
          await inventoryFlow.inventory.performBulkAction('update');
          await inventoryFlow.bulkOperations.expectModalVisible();
          await inventoryFlow.bulkOperations.performBulkUpdate('price', `${99 + index}.99`);
        }
      });
      
      // Wait for all operations to complete
      await Promise.all(operations);
      
      // Verify no conflicts occurred
      const mainPage = pages[0];
      if (mainPage) {
        await mainPage.goto(urls.inventory);
        // Check that items still exist and are accessible
        const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
        expect(itemsCount).toBeGreaterThan(0);
      }
      
      // Clean up
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });
  });
});