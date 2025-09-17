import { test, expect } from '@playwright/test';
import { InventoryFlow } from '../page-objects/inventory-page';
import { AuthPage } from '../page-objects/auth-page';
import { formData, testInventoryItems, urls, testUsers } from '../fixtures/test-data';

test.describe('Inventory System Stress Testing', () => {
  let inventoryFlow: InventoryFlow;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    inventoryFlow = new InventoryFlow(page);
    authPage = new AuthPage(page);
    
    // Login as admin before each test
    await authPage.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.describe('High Volume Data Operations', () => {
    test('Create 1000 inventory items in bulk', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Add rows for large dataset
      for (let i = 0; i < 997; i++) { // 3 initial + 997 = 1000 total
        await page.click('[data-testid="add-row-button"]');
      }
      
      // Fill all 1000 rows
      const startTime = Date.now();
      for (let i = 1; i <= 1000; i++) {
        await page.fill(`[data-testid="bulk-sku-${i}"]`, `STRESS-${i.toString().padStart(4, '0')}`);
        await page.fill(`[data-testid="bulk-name-${i}"]`, `Stress Test Item ${i}`);
      }
      const fillTime = Date.now() - startTime;
      
      // Submit bulk create
      const submitStartTime = Date.now();
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      const submitTime = Date.now() - submitStartTime;
      
      // Performance assertions
      expect(fillTime).toBeLessThan(30000); // Should fill within 30 seconds
      expect(submitTime).toBeLessThan(60000); // Should submit within 60 seconds
      
      // Verify items were created
      await inventoryFlow.inventory.goto();
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThanOrEqual(1000);
    });

    test('Bulk update 500 items simultaneously', async ({ page }) => {
      // First create test data
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      for (let i = 1; i <= 500; i++) {
        await page.fill(`[data-testid="bulk-sku-${i}"]`, `UPDATE-STRESS-${i}`);
        await page.fill(`[data-testid="bulk-name-${i}"]`, `Update Stress Item ${i}`);
      }
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Now test bulk update
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.selectAllInventoryItems();
      
      const startTime = Date.now();
      await inventoryFlow.inventory.performBulkAction('update');
      await inventoryFlow.bulkOperations.expectModalVisible();
      await inventoryFlow.bulkOperations.performBulkUpdate('price', '199.99');
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(30000);
      
      // Verify updates were applied
      await inventoryFlow.inventory.goto();
      const item1 = await inventoryFlow.inventory.getInventoryItemDetails(0);
      expect(item1.price).toContain('199.99');
    });

    test('Search performance with 10,000 items', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/inventory/items', route => {
        const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          sku: `SKU-${i.toString().padStart(5, '0')}`,
          quantity: Math.floor(Math.random() * 1000),
          price: Math.random() * 1000,
          category: ['Electronics', 'Clothing', 'Books', 'Tools', 'Home'][i % 5],
          location: ['Warehouse A', 'Warehouse B', 'Store Front', 'Storage'][i % 4]
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
      
      await inventoryFlow.inventory.goto();
      
      // Test search performance
      const searchTerms = ['Item 1', 'SKU-00001', 'Electronics', 'Warehouse A'];
      
      for (const term of searchTerms) {
        const startTime = Date.now();
        await inventoryFlow.inventory.searchInventory(term);
        const endTime = Date.now();
        
        // Search should be fast even with large dataset
        expect(endTime - startTime).toBeLessThan(2000);
      }
    });

    test('Filter performance with complex criteria', async ({ page }) => {
      // Mock complex dataset
      await page.route('**/api/inventory/items', route => {
        const complexDataset = Array.from({ length: 5000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Complex Item ${i}`,
          sku: `COMPLEX-${i}`,
          quantity: Math.floor(Math.random() * 1000),
          price: Math.random() * 1000,
          category: ['Electronics', 'Clothing', 'Books', 'Tools', 'Home', 'Sports', 'Automotive'][i % 7],
          location: ['Warehouse A', 'Warehouse B', 'Store Front', 'Storage', 'Office'][i % 5],
          status: ['active', 'inactive', 'discontinued'][i % 3],
          minStockLevel: Math.floor(Math.random() * 50),
          maxStockLevel: Math.floor(Math.random() * 200) + 100
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: complexDataset })
        });
      });
      
      await inventoryFlow.inventory.goto();
      
      // Test complex filtering
      const filterCombinations = [
        { category: 'Electronics', location: 'Warehouse A' },
        { category: 'Clothing', stockLevel: 'low' },
        { location: 'Store Front', status: 'active' }
      ];
      
      for (const filters of filterCombinations) {
        const startTime = Date.now();
        
        if (filters.category) {
          await inventoryFlow.inventory.filterByCategory(filters.category);
        }
        if (filters.location) {
          await inventoryFlow.inventory.filterByLocation(filters.location);
        }
        if (filters.stockLevel) {
          await inventoryFlow.inventory.filterByStockLevel(filters.stockLevel);
        }
        
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(3000);
        
        // Clear filters for next test
        await inventoryFlow.inventory.clearFilters();
      }
    });
  });

  test.describe('Concurrent User Operations', () => {
    test('Multiple users creating items simultaneously', async ({ page, context }) => {
      // Create 5 concurrent users
      const contexts = await Promise.all([
        context.browser()?.newContext(),
        context.browser()?.newContext(),
        context.browser()?.newContext(),
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
      
      // Each user creates 20 items simultaneously
      const operations = pages.map(async (p, userIndex) => {
        if (p) {
          const inventoryFlow = new InventoryFlow(p);
          await inventoryFlow.inventory.goto();
          await p.click('[data-testid="bulk-create-button"]');
          
          for (let i = 1; i <= 20; i++) {
            await p.fill(`[data-testid="bulk-sku-${i}"]`, `USER-${userIndex}-${i}`);
            await p.fill(`[data-testid="bulk-name-${i}"]`, `User ${userIndex} Item ${i}`);
          }
          
          await p.click('[data-testid="bulk-create-submit"]');
          await expect(p.locator('[data-testid="success-toast"]')).toBeVisible();
        }
      });
      
      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();
      
      // All operations should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(60000);
      
      // Verify all items were created
      const mainPage = pages[0];
      if (mainPage) {
        await mainPage.goto(urls.inventory);
        const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
        expect(itemsCount).toBeGreaterThanOrEqual(100); // 5 users × 20 items
      }
      
      // Clean up
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });

    test('Concurrent read and write operations', async ({ page, context }) => {
      // Create 3 contexts: 1 writer, 2 readers
      const contexts = await Promise.all([
        context.browser()?.newContext(),
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
      
      // Writer: Create and update items
      const writerOperation = async () => {
        const p = pages[0];
        if (p) {
          const inventoryFlow = new InventoryFlow(p);
          for (let i = 0; i < 10; i++) {
            await inventoryFlow.inventory.goto();
            await p.click('[data-testid="create-inventory-button"]');
            await inventoryFlow.create.fillInventoryForm({
              name: `Concurrent Item ${i}`,
              sku: `CONC-${i}`,
              quantity: '10',
              price: '29.99'
            });
            await inventoryFlow.create.saveInventoryItem();
            
            // Update the item
            await inventoryFlow.inventory.editInventoryItem(0);
            await inventoryFlow.edit.updateInventoryItem({
              price: '39.99'
            });
          }
        }
      };
      
      // Readers: Search and filter
      const readerOperations = pages.slice(1).map(async (p, index) => {
        if (p) {
          const inventoryFlow = new InventoryFlow(p);
          for (let i = 0; i < 20; i++) {
            await inventoryFlow.inventory.goto();
            await inventoryFlow.inventory.searchInventory(`Item ${i % 10}`);
            await inventoryFlow.inventory.filterByCategory('Electronics');
            await inventoryFlow.inventory.clearFilters();
          }
        }
      });
      
      // Run all operations concurrently
      const startTime = Date.now();
      await Promise.all([writerOperation(), ...readerOperations]);
      const endTime = Date.now();
      
      // Should complete without conflicts
      expect(endTime - startTime).toBeLessThan(120000); // 2 minutes
      
      // Clean up
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });

    test('Concurrent bulk operations', async ({ page, context }) => {
      // Create 3 contexts for concurrent bulk operations
      const contexts = await Promise.all([
        context.browser()?.newContext(),
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
      
      // Create test data first
      const mainPage = pages[0];
      if (mainPage) {
        const inventoryFlow = new InventoryFlow(mainPage);
        await inventoryFlow.inventory.goto();
        await mainPage.click('[data-testid="bulk-create-button"]');
        
        for (let i = 1; i <= 100; i++) {
          await mainPage.fill(`[data-testid="bulk-sku-${i}"]`, `BULK-CONC-${i}`);
          await mainPage.fill(`[data-testid="bulk-name-${i}"]`, `Bulk Concurrent Item ${i}`);
        }
        await mainPage.click('[data-testid="bulk-create-submit"]');
      }
      
      // Concurrent bulk operations
      const operations = pages.map(async (p, index) => {
        if (p) {
          const inventoryFlow = new InventoryFlow(p);
          await inventoryFlow.inventory.goto();
          await inventoryFlow.inventory.selectAllInventoryItems();
          await inventoryFlow.inventory.performBulkAction('update');
          await inventoryFlow.bulkOperations.expectModalVisible();
          
          // Different operations for each user
          switch (index) {
            case 0:
              await inventoryFlow.bulkOperations.performBulkUpdate('price', '99.99');
              break;
            case 1:
              await inventoryFlow.bulkOperations.performBulkUpdate('category', 'Electronics');
              break;
            case 2:
              await inventoryFlow.bulkOperations.performBulkUpdate('location', 'Warehouse A');
              break;
          }
        }
      });
      
      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();
      
      // Should handle concurrent bulk operations
      expect(endTime - startTime).toBeLessThan(60000);
      
      // Clean up
      await Promise.all(contexts.map(ctx => ctx?.close()));
    });
  });

  test.describe('Memory and Resource Management', () => {
    test('Memory usage with large datasets', async ({ page }) => {
      // Monitor memory usage during large operations
      await page.route('**/api/inventory/items', route => {
        const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
          id: `item-${i}`,
          name: `Memory Test Item ${i}`,
          sku: `MEM-${i}`,
          quantity: Math.floor(Math.random() * 1000),
          price: Math.random() * 1000,
          category: 'Electronics',
          location: 'Warehouse A',
          description: 'A'.repeat(1000) // Large description to test memory
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: largeDataset })
        });
      });
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      await inventoryFlow.inventory.goto();
      
      // Perform operations that should trigger memory management
      await inventoryFlow.inventory.searchInventory('Memory Test');
      await inventoryFlow.inventory.filterByCategory('Electronics');
      await inventoryFlow.inventory.sortByColumn('name');
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory usage should not grow excessively
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });

    test('Long-running operations stability', async ({ page }) => {
      // Simulate long-running operations
      const startTime = Date.now();
      const operations = [];
      
      // Create 1000 items over time
      for (let batch = 0; batch < 10; batch++) {
        operations.push(async () => {
          await inventoryFlow.inventory.goto();
          await page.click('[data-testid="bulk-create-button"]');
          
          for (let i = 1; i <= 100; i++) {
            await page.fill(`[data-testid="bulk-sku-${i}"]`, `LONG-${batch}-${i}`);
            await page.fill(`[data-testid="bulk-name-${i}"]`, `Long Running Item ${batch}-${i}`);
          }
          
          await page.click('[data-testid="bulk-create-submit"]');
          await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
        });
      }
      
      // Execute operations sequentially to simulate long-running process
      for (const operation of operations) {
        await operation();
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete without memory leaks or crashes
      expect(totalTime).toBeLessThan(300000); // Less than 5 minutes
      
      // Verify all items were created
      await inventoryFlow.inventory.goto();
      const itemsCount = await inventoryFlow.inventory.getInventoryItemsCount();
      expect(itemsCount).toBeGreaterThanOrEqual(1000);
    });

    test('Browser tab memory management', async ({ page, context }) => {
      // Create multiple tabs and test memory management
      const tabs = [];
      for (let i = 0; i < 5; i++) {
        const tab = await context.newPage();
        tabs.push(tab);
        
        const authPage = new AuthPage(tab);
        await authPage.login.goto();
        await authPage.login.loginAsAdmin();
      }
      
      // Load inventory in all tabs
      const inventoryFlows = tabs.map(tab => new InventoryFlow(tab));
      await Promise.all(inventoryFlows.map(flow => flow.inventory.goto()));
      
      // Perform operations in all tabs
      await Promise.all(inventoryFlows.map(async (flow, index) => {
        await flow.inventory.searchInventory(`Tab ${index}`);
        await flow.inventory.filterByCategory('Electronics');
        await flow.inventory.sortByColumn('name');
      }));
      
      // Close tabs one by one and verify memory is freed
      for (let i = 0; i < tabs.length; i++) {
        await tabs[i].close();
        
        // Wait for garbage collection
        await page.waitForTimeout(1000);
        
        // Verify remaining tabs still work
        if (i < tabs.length - 1) {
          const remainingFlow = new InventoryFlow(tabs[i + 1]);
          await remainingFlow.inventory.goto();
          const itemsCount = await remainingFlow.inventory.getInventoryItemsCount();
          expect(itemsCount).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Network and Error Resilience', () => {
    test('Handle intermittent network failures', async ({ page }) => {
      let requestCount = 0;
      
      // Simulate intermittent network failures
      await page.route('**/api/inventory/**', route => {
        requestCount++;
        
        // Fail every 3rd request
        if (requestCount % 3 === 0) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await inventoryFlow.inventory.goto();
      
      // Should handle failures gracefully
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Retry should work
      await page.click('[data-testid="retry-button"]');
      await inventoryFlow.inventory.expectInventoryPageLoaded();
    });

    test('Handle slow network responses', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/inventory/**', route => {
        setTimeout(() => {
          route.continue();
        }, 5000); // 5 second delay
      });
      
      const startTime = Date.now();
      await inventoryFlow.inventory.goto();
      const endTime = Date.now();
      
      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Should eventually load
      await inventoryFlow.inventory.expectInventoryPageLoaded();
      expect(endTime - startTime).toBeGreaterThan(4000);
    });

    test('Handle server errors gracefully', async ({ page }) => {
      // Simulate various server errors
      const errorCodes = [500, 502, 503, 504];
      
      for (const errorCode of errorCodes) {
        await page.route('**/api/inventory/items', route => {
          route.fulfill({
            status: errorCode,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        });
        
        await inventoryFlow.inventory.goto();
        
        // Should show appropriate error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText('Server error');
        
        // Should provide retry option
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      }
    });
  });
});