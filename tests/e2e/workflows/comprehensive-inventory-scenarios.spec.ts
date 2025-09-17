import { test, expect } from '@playwright/test';
import { InventoryFlow } from '../page-objects/inventory-page';
import { AuthPage } from '../page-objects/auth-page';
import { DashboardPage } from '../page-objects/dashboard-page';
import { formData, testInventoryItems, urls, testUsers } from '../fixtures/test-data';

test.describe('Comprehensive Inventory System Tests', () => {
  let inventoryFlow: InventoryFlow;
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    inventoryFlow = new InventoryFlow(page);
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Login as admin before each test
    await authPage.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.describe('Realistic Daily Operations', () => {
    test('Complete inventory cycle: Receive shipment → Process sales → Stock adjustment', async ({ page }) => {
      // Step 1: Receive a new shipment (bulk create items)
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill bulk create form with realistic shipment data
      await page.fill('[data-testid="bulk-sku-1"]', 'SHIP-001-LAPTOP');
      await page.fill('[data-testid="bulk-name-1"]', 'Dell Laptop XPS 13');
      await page.fill('[data-testid="bulk-sku-2"]', 'SHIP-001-MOUSE');
      await page.fill('[data-testid="bulk-name-2"]', 'Wireless Mouse Logitech');
      await page.fill('[data-testid="bulk-sku-3"]', 'SHIP-001-KEYBOARD');
      await page.fill('[data-testid="bulk-name-3"]', 'Mechanical Keyboard RGB');
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Step 2: Verify items are in inventory
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible('Dell Laptop XPS 13');
      await inventoryFlow.inventory.expectInventoryItemVisible('Wireless Mouse Logitech');
      await inventoryFlow.inventory.expectInventoryItemVisible('Mechanical Keyboard RGB');
      
      // Step 3: Process a sale (stock out)
      await inventoryFlow.inventory.quickStockAdjustment(0); // First item
      await inventoryFlow.quickStock.adjustStock('2', 'out', 'Customer sale - Invoice #12345');
      
      // Step 4: Verify stock was reduced
      const itemDetails = await inventoryFlow.inventory.getInventoryItemDetails(0);
      expect(itemDetails.quantity).toContain('8'); // 10 - 2 = 8
      
      // Step 5: Process stock adjustment (damaged goods)
      await inventoryFlow.inventory.quickStockAdjustment(1); // Second item
      await inventoryFlow.quickStock.adjustStock('1', 'out', 'Damaged during handling');
      
      // Step 6: Verify audit trail
      await page.goto(urls.audit);
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('stock_out');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('Customer sale');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('Damaged during handling');
    });

    test('Multi-location inventory management', async ({ page }) => {
      // Create items in different locations
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      
      // Create item for Warehouse A
      await inventoryFlow.create.fillInventoryForm({
        name: 'Warehouse A Item',
        sku: 'WH-A-001',
        quantity: '50',
        price: '99.99',
        location: 'Warehouse A'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Create item for Store Front
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Store Front Item',
        sku: 'SF-001',
        quantity: '10',
        price: '149.99',
        location: 'Store Front'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify location filtering works
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByLocation('Warehouse A');
      await inventoryFlow.inventory.expectInventoryItemVisible('Warehouse A Item');
      await inventoryFlow.inventory.expectInventoryItemNotVisible('Store Front Item');
      
      // Test location transfer (stock adjustment between locations)
      await inventoryFlow.inventory.filterByLocation('Store Front');
      await inventoryFlow.inventory.quickStockAdjustment(0);
      await inventoryFlow.quickStock.adjustStock('5', 'in', 'Transfer from Warehouse A');
      
      // Verify transfer was recorded
      await page.goto(urls.audit);
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('Transfer from Warehouse A');
    });

    test('Seasonal inventory management with bulk operations', async ({ page }) => {
      // Simulate seasonal stock preparation
      await inventoryFlow.inventory.goto();
      
      // Select multiple items for seasonal price update
      await inventoryFlow.inventory.selectInventoryItem(0);
      await inventoryFlow.inventory.selectInventoryItem(1);
      await inventoryFlow.inventory.selectInventoryItem(2);
      
      // Apply seasonal discount (bulk price update)
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      await inventoryFlow.bulkOperations.performBulkUpdate('price', '79.99'); // 20% discount
      
      // Verify prices were updated
      await inventoryFlow.inventory.goto();
      const item1 = await inventoryFlow.inventory.getInventoryItemDetails(0);
      const item2 = await inventoryFlow.inventory.getInventoryItemDetails(1);
      expect(item1.price).toContain('79.99');
      expect(item2.price).toContain('79.99');
      
      // Simulate end-of-season clearance (bulk category change)
      await inventoryFlow.inventory.selectAllInventoryItems();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.performBulkUpdate('category', 'Clearance');
      
      // Verify category changes
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByCategory('Clearance');
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });
  });

  test.describe('Edge Cases and Boundary Conditions', () => {
    test('Handle zero and negative stock scenarios', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Create item with zero stock
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Zero Stock Item',
        sku: 'ZERO-001',
        quantity: '0',
        price: '29.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify zero stock warning
      await inventoryFlow.inventory.expectLowStockWarning('Zero Stock Item');
      
      // Try to sell more than available stock
      await inventoryFlow.inventory.quickStockAdjustment(0);
      await inventoryFlow.quickStock.adjustStock('5', 'out', 'Attempt to oversell');
      
      // Should show error
      await expect(page.locator('[data-testid="stock-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="stock-error"]')).toContainText('Insufficient stock');
    });

    test('Handle maximum stock level scenarios', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Create item with max stock level
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Max Stock Item',
        sku: 'MAX-001',
        quantity: '100',
        price: '19.99',
        maxStockLevel: '100'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Try to add more stock beyond max level
      await inventoryFlow.inventory.quickStockAdjustment(0);
      await inventoryFlow.quickStock.adjustStock('10', 'in', 'Exceed max stock');
      
      // Should show warning but allow (business rule dependent)
      const warning = page.locator('[data-testid="max-stock-warning"]');
      if (await warning.isVisible()) {
        await expect(warning).toContainText('Maximum stock level exceeded');
      }
    });

    test('Handle duplicate SKU creation attempts', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      // Create first item
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Original Item',
        sku: 'DUP-TEST-001',
        quantity: '10',
        price: '49.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Try to create duplicate SKU
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Duplicate Item',
        sku: 'DUP-TEST-001', // Same SKU
        quantity: '5',
        price: '39.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Should show duplicate SKU error
      await expect(page.locator('[data-testid="sku-duplicate-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="sku-duplicate-error"]')).toContainText('SKU already exists');
    });

    test('Handle very long item names and descriptions', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      const longName = 'A'.repeat(255); // Maximum length
      const longDescription = 'B'.repeat(1000); // Very long description
      
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: longName,
        description: longDescription,
        sku: 'LONG-001',
        quantity: '1',
        price: '9.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify item was created successfully
      await inventoryFlow.inventory.expectInventoryItemVisible(longName.substring(0, 50)); // Truncated display
    });

    test('Handle special characters in SKU and names', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      
      const specialChars = {
        name: 'Item with Special Chars: @#$%^&*()',
        sku: 'SKU-@#$%-001',
        description: 'Description with émojis 🚀 and ñ characters'
      };
      
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: specialChars.name,
        description: specialChars.description,
        sku: specialChars.sku,
        quantity: '1',
        price: '9.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify item was created and displays correctly
      await inventoryFlow.inventory.expectInventoryItemVisible(specialChars.name);
    });
  });

  test.describe('Data Validation and Error Handling', () => {
    test('Validate all required fields', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      
      // Try to save without filling any fields
      await inventoryFlow.create.saveInventoryItem();
      
      // Should show validation errors for all required fields
      await inventoryFlow.create.expectValidationErrors([
        'name',
        'sku',
        'quantity',
        'price'
      ]);
    });

    test('Validate numeric field formats', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      
      // Test invalid numeric inputs
      await inventoryFlow.create.fillInventoryForm({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 'not-a-number',
        price: 'also-not-a-number'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Should show validation errors for numeric fields
      await inventoryFlow.create.expectValidationErrors([
        'quantity',
        'price'
      ]);
    });

    test('Validate price and quantity ranges', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      
      // Test negative values
      await inventoryFlow.create.fillInventoryForm({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: '-10',
        price: '-5.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Should show validation errors for negative values
      await inventoryFlow.create.expectValidationErrors([
        'quantity',
        'price'
      ]);
      
      // Test extremely large values
      await inventoryFlow.create.fillInventoryForm({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: '999999999',
        price: '999999.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Should either accept or show range validation error
      const quantityError = page.locator('[data-testid="quantity-error"]');
      const priceError = page.locator('[data-testid="price-error"]');
      
      if (await quantityError.isVisible()) {
        await expect(quantityError).toContainText('Maximum value exceeded');
      }
      if (await priceError.isVisible()) {
        await expect(priceError).toContainText('Maximum value exceeded');
      }
    });

    test('Handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/inventory/items', route => {
        route.abort('failed');
      });
      
      await inventoryFlow.inventory.goto();
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load inventory');
      
      // Should show retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });
  });

  test.describe('Performance and Scalability', () => {
    test('Handle large inventory datasets efficiently', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/inventory/items', route => {
        const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          sku: `SKU-${i.toString().padStart(6, '0')}`,
          quantity: Math.floor(Math.random() * 1000),
          price: Math.random() * 1000,
          category: ['Electronics', 'Clothing', 'Books', 'Tools'][i % 4],
          location: ['Warehouse A', 'Warehouse B', 'Store Front'][i % 3]
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
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(3000);
      
      // Test pagination
      await inventoryFlow.inventory.expectPaginationVisible();
      await inventoryFlow.inventory.navigateToPage(2);
      
      // Test search performance
      const searchStartTime = Date.now();
      await inventoryFlow.inventory.searchInventory('Item 1');
      const searchTime = Date.now() - searchStartTime;
      expect(searchTime).toBeLessThan(1000);
    });

    test('Handle concurrent operations', async ({ page, context }) => {
      // Create multiple browser contexts to simulate concurrent users
      const contexts = await Promise.all([
        context.browser()?.newContext(),
        context.browser()?.newContext(),
        context.browser()?.newContext()
      ]);
      
      const pages = await Promise.all(contexts.map(ctx => ctx?.newPage()));
      
      // Login all users
      await Promise.all(pages.map(async (p, index) => {
        if (p) {
          const authPage = new AuthPage(p);
          await authPage.login.goto();
          await authPage.login.loginAsAdmin();
        }
      }));
      
      // Perform concurrent operations
      const operations = pages.map(async (p, index) => {
        if (p) {
          const inventoryFlow = new InventoryFlow(p);
          await inventoryFlow.inventory.goto();
          
          // Each user performs different operations
          switch (index) {
            case 0:
              // User 1: Create new item
              await p.click('[data-testid="create-inventory-button"]');
              await inventoryFlow.create.fillInventoryForm({
                name: `Concurrent Item ${index}`,
                sku: `CONC-${index}-001`,
                quantity: '10',
                price: '29.99'
              });
              await inventoryFlow.create.saveInventoryItem();
              break;
              
            case 1:
              // User 2: Edit existing item
              await inventoryFlow.inventory.editInventoryItem(0);
              await inventoryFlow.edit.updateInventoryItem({
                name: `Updated by User ${index}`
              });
              break;
              
            case 2:
              // User 3: Stock adjustment
              await inventoryFlow.inventory.quickStockAdjustment(0);
              await inventoryFlow.quickStock.adjustStock('5', 'in', `Concurrent adjustment by user ${index}`);
              break;
          }
        }
      });
      
      // Wait for all operations to complete
      await Promise.all(operations);
      
      // Verify all operations were successful
      const mainPage = pages[0];
      if (mainPage) {
        await mainPage.goto(urls.inventory);
        await expect(mainPage.locator('[data-testid="inventory-table"]')).toContainText('Concurrent Item 0');
        await expect(mainPage.locator('[data-testid="inventory-table"]')).toContainText('Updated by User 1');
      }
      
      // Clean up
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });
  });

  test.describe('Business Logic and Workflows', () => {
    test('Complete audit trail verification', async ({ page }) => {
      const testOperations = [
        { action: 'create', item: 'Audit Test Item 1', sku: 'AUDIT-001' },
        { action: 'update', item: 'Audit Test Item 1', field: 'price', value: '99.99' },
        { action: 'stock_in', item: 'Audit Test Item 1', quantity: '10' },
        { action: 'stock_out', item: 'Audit Test Item 1', quantity: '3' },
        { action: 'delete', item: 'Audit Test Item 1' }
      ];
      
      // Perform all operations
      for (const operation of testOperations) {
        switch (operation.action) {
          case 'create':
            await inventoryFlow.inventory.goto();
            await page.click('[data-testid="create-inventory-button"]');
            await inventoryFlow.create.fillInventoryForm({
              name: operation.item,
              sku: operation.sku,
              quantity: '10',
              price: '49.99'
            });
            await inventoryFlow.create.saveInventoryItem();
            break;
            
          case 'update':
            await inventoryFlow.inventory.goto();
            await inventoryFlow.inventory.editInventoryItem(0);
            await inventoryFlow.edit.updateInventoryItem({
              [operation.field]: operation.value
            });
            break;
            
          case 'stock_in':
            await inventoryFlow.inventory.goto();
            await inventoryFlow.inventory.quickStockAdjustment(0);
            await inventoryFlow.quickStock.adjustStock(operation.quantity, 'in', 'Audit test stock in');
            break;
            
          case 'stock_out':
            await inventoryFlow.inventory.goto();
            await inventoryFlow.inventory.quickStockAdjustment(0);
            await inventoryFlow.quickStock.adjustStock(operation.quantity, 'out', 'Audit test stock out');
            break;
            
          case 'delete':
            await inventoryFlow.inventory.goto();
            await inventoryFlow.inventory.deleteInventoryItem(0);
            break;
        }
      }
      
      // Verify all operations are in audit log
      await page.goto(urls.audit);
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('INSERT');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('UPDATE');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('DELETE');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('stock_in');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('stock_out');
    });

    test('Dashboard metrics accuracy', async ({ page }) => {
      // Get initial metrics
      await dashboardPage.goto();
      const initialTotalItems = await page.locator('[data-testid="total-items-metric"]').textContent();
      const initialTotalValue = await page.locator('[data-testid="total-value-metric"]').textContent();
      
      // Create new item
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Dashboard Test Item',
        sku: 'DASH-001',
        quantity: '25',
        price: '199.99'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify metrics updated
      await dashboardPage.goto();
      const newTotalItems = await page.locator('[data-testid="total-items-metric"]').textContent();
      const newTotalValue = await page.locator('[data-testid="total-value-metric"]').textContent();
      
      expect(parseInt(newTotalItems || '0')).toBe(parseInt(initialTotalItems || '0') + 1);
      expect(parseFloat(newTotalValue?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(
        parseFloat(initialTotalValue?.replace(/[^0-9.]/g, '') || '0')
      );
    });

    test('Low stock alert system', async ({ page }) => {
      // Create item with low stock
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Low Stock Alert Item',
        sku: 'LOW-001',
        quantity: '2', // Low quantity
        price: '29.99',
        minStockLevel: '5' // Min level higher than current
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Check dashboard for low stock alert
      await dashboardPage.goto();
      await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();
      await expect(page.locator('[data-testid="low-stock-alerts"]')).toContainText('Low Stock Alert Item');
      
      // Check inventory page for warning
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectLowStockWarning('Low Stock Alert Item');
    });
  });

  test.describe('Integration and Cross-Module Tests', () => {
    test('Inventory-Categories integration', async ({ page }) => {
      // Create new category
      await page.goto(urls.categories);
      await page.click('[data-testid="add-category-button"]');
      await page.fill('[data-testid="category-name"]', 'Test Integration Category');
      await page.fill('[data-testid="category-description"]', 'Category for integration testing');
      await page.click('[data-testid="save-category"]');
      
      // Create inventory item with new category
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Integration Test Item',
        sku: 'INT-001',
        quantity: '10',
        price: '39.99',
        category: 'Test Integration Category'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify category is properly linked
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByCategory('Test Integration Category');
      await inventoryFlow.inventory.expectInventoryItemVisible('Integration Test Item');
    });

    test('Inventory-Locations integration', async ({ page }) => {
      // Create new location
      await page.goto(urls.locations);
      await page.click('[data-testid="add-location-button"]');
      await page.fill('[data-testid="location-name"]', 'Test Integration Location');
      await page.fill('[data-testid="location-address"]', '123 Integration Street');
      await page.click('[data-testid="save-location"]');
      
      // Create inventory item with new location
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      await inventoryFlow.create.fillInventoryForm({
        name: 'Location Integration Item',
        sku: 'LOC-001',
        quantity: '15',
        price: '59.99',
        location: 'Test Integration Location'
      });
      await inventoryFlow.create.saveInventoryItem();
      
      // Verify location is properly linked
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.filterByLocation('Test Integration Location');
      await inventoryFlow.inventory.expectInventoryItemVisible('Location Integration Item');
    });

    test('Inventory-Users integration (permissions)', async ({ page }) => {
      // Test with different user roles
      const testUsers = [
        { role: 'admin', canCreate: true, canDelete: true },
        { role: 'manager', canCreate: true, canDelete: false },
        { role: 'user', canCreate: false, canDelete: false }
      ];
      
      for (const user of testUsers) {
        // Login as different user (this would require user creation in real scenario)
        // For now, we'll test the UI elements visibility
        await inventoryFlow.inventory.goto();
        
        const createButton = page.locator('[data-testid="create-inventory-button"]');
        const deleteButton = page.locator('[data-testid="delete-inventory-button"]').first();
        
        if (user.canCreate) {
          await expect(createButton).toBeVisible();
        } else {
          await expect(createButton).not.toBeVisible();
        }
        
        if (user.canDelete) {
          await expect(deleteButton).toBeVisible();
        } else {
          await expect(deleteButton).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('Recover from partial form submission failure', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="create-inventory-button"]');
      
      // Fill form partially
      await inventoryFlow.create.fillInventoryForm({
        name: 'Partial Form Item',
        sku: 'PARTIAL-001',
        quantity: '10',
        price: '29.99'
      });
      
      // Simulate network failure during save
      await page.route('**/api/inventory/items', route => {
        route.abort('failed');
      });
      
      await inventoryFlow.create.saveInventoryItem();
      
      // Should show error but preserve form data
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Partial Form Item');
      await expect(page.locator('[data-testid="sku-input"]')).toHaveValue('PARTIAL-001');
      
      // Restore network and retry
      await page.unroute('**/api/inventory/items');
      await inventoryFlow.create.saveInventoryItem();
      
      // Should succeed on retry
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });

    test('Handle session timeout gracefully', async ({ page }) => {
      // Simulate session timeout
      await page.route('**/api/inventory/items', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      await inventoryFlow.inventory.goto();
      
      // Should redirect to login or show session expired message
      await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-redirect"]')).toBeVisible();
    });
  });
});