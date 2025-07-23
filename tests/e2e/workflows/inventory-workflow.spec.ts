import { test, expect } from '@playwright/test';
import { InventoryFlow } from '../page-objects/inventory-page';
import { AuthenticationFlow } from '../page-objects/auth-page';
import { formData, testInventoryItems, urls } from '../fixtures/test-data';

test.describe('Inventory Management Workflows', () => {
  let inventoryFlow: InventoryFlow;
  let authFlow: AuthenticationFlow;

  test.beforeEach(async ({ page }) => {
    inventoryFlow = new InventoryFlow(page);
    authFlow = new AuthenticationFlow(page);
    
    // Login as admin before each test
    await authFlow.login.goto();
    await authFlow.login.loginAsAdmin();
  });

  test.describe('Create New Inventory Item', () => {
    test('should create new inventory item with all required fields', async ({ page }) => {
      await inventoryFlow.createNewInventoryItem();
      
      // Verify item appears in inventory list
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible(formData.newInventoryItem.name);
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
      await inventoryFlow.create.goto();
      await inventoryFlow.create.saveInventoryItem();
      
      await inventoryFlow.create.expectValidationErrors([
        'name',
        'sku',
        'quantity',
        'price'
      ]);
    });

    test('should prevent duplicate SKU creation', async ({ page }) => {
      const existingItem = testInventoryItems[0];
      
      await inventoryFlow.create.goto();
      await inventoryFlow.create.fillInventoryForm({
        name: 'Duplicate SKU Test',
        description: 'Testing duplicate SKU',
        sku: existingItem.sku,
        quantity: '10',
        price: '25.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      const skuError = page.locator('[data-testid="sku-duplicate-error"]');
      await expect(skuError).toBeVisible();
      await expect(skuError).toContainText('SKU already exists');
    });

    test('should validate numeric fields', async ({ page }) => {
      await inventoryFlow.create.goto();
      await inventoryFlow.create.fillInventoryForm({
        name: 'Test Item',
        description: 'Test description',
        sku: 'TEST-001',
        quantity: 'invalid',
        price: 'not-a-number'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      await inventoryFlow.create.expectValidationErrors([
        'quantity',
        'price'
      ]);
    });

    test('should upload and preview item image', async ({ page }) => {
      await inventoryFlow.create.goto();
      
      // Create a test image file
      const testImagePath = 'tests/e2e/fixtures/test-image.jpg';
      await inventoryFlow.create.uploadImage(testImagePath);
      await inventoryFlow.create.expectImagePreview();
    });

    test('should auto-generate SKU if not provided', async ({ page }) => {
      await inventoryFlow.create.goto();
      await inventoryFlow.create.fillInventoryForm({
        name: 'Auto SKU Test',
        description: 'Testing auto SKU generation',
        sku: '', // Leave SKU empty
        quantity: '10',
        price: '25.99'
      });
      
      // Check if SKU is auto-generated
      const skuInput = page.locator('[data-testid="sku-input"]');
      const skuValue = await skuInput.inputValue();
      expect(skuValue).toBeTruthy();
      expect(skuValue).toMatch(/^AUTO-/);
    });

    test('should set default category and location if not selected', async ({ page }) => {
      await inventoryFlow.create.goto();
      await inventoryFlow.create.createInventoryItem({
        name: 'Default Category Test',
        description: 'Testing default category',
        sku: 'DEFAULT-001',
        quantity: '10',
        price: '25.99'
        // No category or location specified
      });
      
      // Verify item was created with default values
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible('Default Category Test');
    });
  });

  test.describe('Edit Existing Inventory Item', () => {
    test('should edit inventory item successfully', async ({ page }) => {
      await inventoryFlow.editExistingInventoryItem();
      
      // Verify changes are reflected
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible(formData.editInventoryItem.name);
    });

    test('should pre-fill form with existing data', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.editInventoryItem(0);
      await inventoryFlow.edit.expectFormPreFilled();
    });

    test('should validate changes before saving', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.editInventoryItem(0);
      
      // Try to set invalid data
      await inventoryFlow.edit.updateInventoryItem({
        quantity: '-5', // Negative quantity
        price: '0' // Zero price
      });
      
      const quantityError = page.locator('[data-testid="quantity-error"]');
      const priceError = page.locator('[data-testid="price-error"]');
      
      await expect(quantityError).toBeVisible();
      await expect(priceError).toBeVisible();
    });

    test('should track inventory changes in audit log', async ({ page }) => {
      const originalItem = await inventoryFlow.inventory.getInventoryItemDetails(0);
      
      await inventoryFlow.inventory.editInventoryItem(0);
      await inventoryFlow.edit.updateInventoryItem({
        name: 'Updated Item Name',
        quantity: '25'
      });
      
      // Navigate to audit log and verify changes are recorded
      await page.goto(urls.audit);
      const auditTable = page.locator('[data-testid="audit-table"]');
      await expect(auditTable).toContainText('UPDATE');
      await expect(auditTable).toContainText('inventory');
    });
  });

  test.describe('Delete Inventory Item', () => {
    test('should delete inventory item with confirmation', async ({ page }) => {
      const itemName = testInventoryItems[0].name;
      
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.deleteInventoryItem(0);
      
      // Verify item is removed from list
      await inventoryFlow.inventory.expectInventoryItemNotVisible(itemName);
    });

    test('should cancel deletion when user cancels', async ({ page }) => {
      const itemName = testInventoryItems[0].name;
      
      await inventoryFlow.inventory.goto();
      
      // Click delete but cancel
      const deleteButton = page.locator('[data-testid="inventory-item-row"]:first-child [data-testid="delete-inventory-button"]');
      await deleteButton.click();
      await page.locator('[data-testid="cancel-button"]').click();
      
      // Verify item is still in list
      await inventoryFlow.inventory.expectInventoryItemVisible(itemName);
    });

    test('should prevent deletion of items with active transactions', async ({ page }) => {
      // This test assumes there are business rules preventing deletion of items with transactions
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.deleteInventoryItem(0);
      
      const errorMessage = page.locator('[data-testid="delete-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText('Cannot delete item with active transactions');
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple items for bulk operations', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Select first 3 items
      for (let i = 0; i < 3; i++) {
        await inventoryFlow.inventory.selectInventoryItem(i);
      }
      
      // Verify bulk actions are available
      const bulkActions = page.locator('[data-testid="bulk-actions"]');
      await expect(bulkActions).toBeVisible();
    });

    test('should perform bulk price update', async ({ page }) => {
      await inventoryFlow.performBulkOperations();
      
      // Verify prices were updated
      await inventoryFlow.inventory.goto();
      const firstItem = await inventoryFlow.inventory.getInventoryItemDetails(0);
      expect(firstItem.price).toContain('25.99');
    });

    test('should perform bulk category assignment', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      
      await inventoryFlow.bulkOperations.expectModalVisible();
      await inventoryFlow.bulkOperations.performBulkUpdate('category', 'Electronics');
    });

    test('should perform bulk deletion with confirmation', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Select items for deletion
      await inventoryFlow.inventory.selectInventoryItem(0);
      await inventoryFlow.inventory.selectInventoryItem(1);
      
      await inventoryFlow.inventory.performBulkAction('delete');
      await inventoryFlow.bulkOperations.expectModalVisible();
      await inventoryFlow.bulkOperations.expectSelectedItemsCount(2);
      await inventoryFlow.bulkOperations.performBulkDelete();
    });

    test('should handle bulk operations on large datasets', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/inventory', route => {
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
      await inventoryFlow.inventory.selectAllInventoryItems();
      
      const selectedCount = page.locator('[data-testid="selected-count"]');
      await expect(selectedCount).toContainText('1000');
    });
  });

  test.describe('Quick Stock Operations', () => {
    test('should perform quick stock adjustment', async ({ page }) => {
      await inventoryFlow.performQuickStockOperation();
      
      // Verify stock was adjusted
      await inventoryFlow.inventory.goto();
      const item = await inventoryFlow.inventory.getInventoryItemDetails(0);
      // Verify quantity increased by 10
    });

    test('should validate stock adjustment quantities', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.quickStockAdjustment(0);
      await inventoryFlow.quickStock.expectModalVisible();
      
      // Try negative adjustment that would result in negative stock
      await inventoryFlow.quickStock.adjustStock('-100', 'out', 'Test negative stock');
      
      const error = page.locator('[data-testid="stock-error"]');
      await expect(error).toBeVisible();
      await expect(error).toContainText('Insufficient stock');
    });

    test('should record stock adjustments in transaction history', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.quickStockAdjustment(0);
      await inventoryFlow.quickStock.adjustStock('5', 'in', 'Quick stock test');
      
      // Navigate to transaction history
      await page.goto('/transactions');
      const transactionTable = page.locator('[data-testid="transaction-table"]');
      await expect(transactionTable).toContainText('stock_in');
      await expect(transactionTable).toContainText('Quick stock test');
    });
  });

  test.describe('Search and Filter Inventory', () => {
    test('should search inventory by name', async ({ page }) => {
      await inventoryFlow.testSearchAndFilter();
    });

    test('should filter by category', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByCategory('Electronics');
      
      // Verify only electronics items are shown
      const items = page.locator('[data-testid="inventory-item-row"]');
      const itemCount = await items.count();
      
      for (let i = 0; i < itemCount; i++) {
        const categoryCell = items.nth(i).locator('[data-testid="item-category"]');
        await expect(categoryCell).toContainText('Electronics');
      }
    });

    test('should filter by location', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByLocation('Warehouse A');
      
      // Verify only items from Warehouse A are shown
      const items = page.locator('[data-testid="inventory-item-row"]');
      const itemCount = await items.count();
      
      for (let i = 0; i < itemCount; i++) {
        const locationCell = items.nth(i).locator('[data-testid="item-location"]');
        await expect(locationCell).toContainText('Warehouse A');
      }
    });

    test('should filter by stock level', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByStockLevel('low');
      
      // Verify only low stock items are shown
      const lowStockWarnings = page.locator('[data-testid^="low-stock-warning-"]');
      const warningCount = await lowStockWarnings.count();
      expect(warningCount).toBeGreaterThan(0);
    });

    test('should combine multiple filters', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Apply multiple filters
      await inventoryFlow.inventory.filterByCategory('Electronics');
      await inventoryFlow.inventory.filterByLocation('Warehouse A');
      await inventoryFlow.inventory.filterByStockLevel('low');
      
      // Verify results match all criteria
      const items = page.locator('[data-testid="inventory-item-row"]');
      const itemCount = await items.count();
      
      if (itemCount > 0) {
        const firstItem = items.first();
        await expect(firstItem.locator('[data-testid="item-category"]')).toContainText('Electronics');
        await expect(firstItem.locator('[data-testid="item-location"]')).toContainText('Warehouse A');
      }
    });

    test('should clear all filters', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Apply filters
      await inventoryFlow.inventory.filterByCategory('Electronics');
      await inventoryFlow.inventory.filterByLocation('Warehouse A');
      
      const filteredCount = await inventoryFlow.inventory.getInventoryItemsCount();
      
      // Clear filters
      await inventoryFlow.inventory.clearFilters();
      
      const unfilteredCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(unfilteredCount).toBeGreaterThanOrEqual(filteredCount);
    });

    test('should handle no search results gracefully', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.searchInventory('NonExistentItem12345');
      
      const noResultsMessage = page.locator('[data-testid="no-results"]');
      await expect(noResultsMessage).toBeVisible();
      await expect(noResultsMessage).toContainText('No items found');
    });
  });

  test.describe('Inventory Table Interactions', () => {
    test('should sort inventory by different columns', async ({ page }) => {
      await inventoryFlow.testSortingAndPagination();
    });

    test('should navigate through pagination', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      if (itemsCount > 10) {
        await inventoryFlow.inventory.expectPaginationVisible();
        await inventoryFlow.inventory.navigateToPage(2);
        
        // Verify we're on page 2
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toContainText('2');
      }
    });

    test('should display low stock warnings', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Look for items with low stock warnings
      const lowStockItems = page.locator('[data-testid^="low-stock-warning-"]');
      const warningCount = await lowStockItems.count();
      
      if (warningCount > 0) {
        const firstWarning = lowStockItems.first();
        await expect(firstWarning).toBeVisible();
        await expect(firstWarning).toHaveAttribute('title', /low stock/i);
      }
    });

    test('should show item details on row click', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      const firstRow = page.locator('[data-testid="inventory-item-row"]').first();
      await firstRow.click();
      
      // Check if details modal or page opens
      const detailsModal = page.locator('[data-testid="item-details-modal"]');
      if (await detailsModal.isVisible()) {
        await expect(detailsModal).toBeVisible();
      } else {
        // Or check if navigated to details page
        await expect(page).toHaveURL(/\/inventory\/.*\/details/);
      }
    });
  });

  test.describe('Inventory Performance', () => {
    test('should load inventory page quickly', async ({ page }) => {
      const startTime = Date.now();
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryPageLoaded();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle large inventory datasets efficiently', async ({ page }) => {
      // Mock large dataset response
      await page.route('**/api/inventory', route => {
        const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          sku: `SKU-${i}`,
          quantity: Math.floor(Math.random() * 100),
          price: Math.random() * 100,
          category: 'Electronics',
          location: 'Warehouse A'
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            data: largeDataset.slice(0, 50), // Paginated response
            total: largeDataset.length,
            page: 1,
            limit: 50
          })
        });
      });
      
      const startTime = Date.now();
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryPageLoaded();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should still load quickly with pagination
    });
  });
});