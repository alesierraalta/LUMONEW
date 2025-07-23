import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsManager, loginAsEmployee } from '../utils/test-helpers';
import { testData } from '../fixtures/test-data';
import { TransactionWorkflow, InventoryPageWithTransactions } from '../page-objects/transaction-page';

test.describe('Transaction Workflow Tests', () => {
  let transactionWorkflow: TransactionWorkflow;
  let inventoryPage: InventoryPageWithTransactions;

  test.beforeEach(async ({ page }) => {
    transactionWorkflow = new TransactionWorkflow(page);
    inventoryPage = new InventoryPageWithTransactions(page);
    
    // Login as admin for most tests
    await loginAsAdmin(page);
  });

  test.describe('Transaction Builder - Sales Transactions', () => {
    test('should create a simple sale transaction', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Verify modal opens with correct type
      await inventoryPage.transactionBuilder.expectTransactionType('sale');
      await inventoryPage.transactionBuilder.expectSaveButtonDisabled();

      // Add a product
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 2);

      // Verify line item was added
      await inventoryPage.transactionBuilder.expectLineItemExists(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.expectLineItemQuantity(testData.inventory.items[0].name, 2);

      // Verify calculations
      const expectedSubtotal = testData.inventory.items[0].price * 2;
      const expectedTax = expectedSubtotal * 0.16; // Default 16% tax
      const expectedTotal = expectedSubtotal + expectedTax;
      
      await inventoryPage.transactionBuilder.expectCalculatedTotals(expectedSubtotal, expectedTax, expectedTotal);
      await inventoryPage.transactionBuilder.expectSaveButtonEnabled();

      // Add notes and save
      await inventoryPage.transactionBuilder.setNotes('Test sale transaction');
      await inventoryPage.transactionBuilder.saveTransaction();
      
      // Verify modal closes
      await inventoryPage.transactionBuilder.expectModalClosed();
    });

    test('should create a multi-item sale transaction', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Add multiple products
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 1);
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[1].name, 3);
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[2].name, 2);

      // Verify all line items exist
      await expect(await inventoryPage.transactionBuilder.getLineItemsCount()).toBe(3);

      // Update unit price for one item
      const firstLineItem = inventoryPage.transactionBuilder.getLineItemByProductName(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.updateLineItemUnitPrice(firstLineItem, 150.00);

      // Set custom tax rate
      await inventoryPage.transactionBuilder.setTaxRate(0.18); // 18% tax

      // Calculate expected totals
      const item1Total = 150.00 * 1; // Custom price
      const item2Total = testData.inventory.items[1].price * 3;
      const item3Total = testData.inventory.items[2].price * 2;
      const expectedSubtotal = item1Total + item2Total + item3Total;
      const expectedTax = expectedSubtotal * 0.18;
      const expectedTotal = expectedSubtotal + expectedTax;

      await inventoryPage.transactionBuilder.expectCalculatedTotals(expectedSubtotal, expectedTax, expectedTotal);

      // Save transaction
      await inventoryPage.transactionBuilder.setNotes('Multi-item sale with custom pricing');
      await inventoryPage.transactionBuilder.saveTransaction();
      await inventoryPage.transactionBuilder.expectModalClosed();
    });

    test('should handle barcode scanning for sales', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Scan barcode (using SKU as barcode)
      await inventoryPage.transactionBuilder.scanBarcode(testData.inventory.items[0].sku);

      // Verify product was added
      await inventoryPage.transactionBuilder.expectLineItemExists(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.expectLineItemQuantity(testData.inventory.items[0].name, 1);

      // Scan same barcode again to increase quantity
      await inventoryPage.transactionBuilder.scanBarcode(testData.inventory.items[0].sku);
      await inventoryPage.transactionBuilder.expectLineItemQuantity(testData.inventory.items[0].name, 2);

      // Scan invalid barcode
      await inventoryPage.transactionBuilder.scanBarcode('INVALID-BARCODE');
      await inventoryPage.transactionBuilder.expectErrorMessage('Product not found for barcode: INVALID-BARCODE');

      // Save transaction
      await inventoryPage.transactionBuilder.saveTransaction();
      await inventoryPage.transactionBuilder.expectModalClosed();
    });

    test('should allow removing line items', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Add multiple products
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 1);
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[1].name, 1);

      await expect(await inventoryPage.transactionBuilder.getLineItemsCount()).toBe(2);

      // Remove first item
      const firstLineItem = inventoryPage.transactionBuilder.getLineItemByProductName(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.removeLineItem(firstLineItem);

      await expect(await inventoryPage.transactionBuilder.getLineItemsCount()).toBe(1);

      // Verify only second item remains
      await inventoryPage.transactionBuilder.expectLineItemExists(testData.inventory.items[1].name);

      // Save transaction
      await inventoryPage.transactionBuilder.saveTransaction();
      await inventoryPage.transactionBuilder.expectModalClosed();
    });

    test('should validate minimum quantities', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Add product
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 1);

      // Try to set quantity to 0 (should remove item)
      const lineItem = inventoryPage.transactionBuilder.getLineItemByProductName(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.updateLineItemQuantity(lineItem, 0);

      // Verify item was removed
      await expect(await inventoryPage.transactionBuilder.getLineItemsCount()).toBe(0);
      await inventoryPage.transactionBuilder.expectSaveButtonDisabled();
    });

    test('should handle transaction cancellation', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Add products and make changes
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 2);
      await inventoryPage.transactionBuilder.setNotes('This transaction will be cancelled');

      // Cancel transaction
      await inventoryPage.transactionBuilder.cancelTransaction();
      await inventoryPage.transactionBuilder.expectModalClosed();

      // Reopen and verify form is reset
      await inventoryPage.openTransactionBuilder('sale');
      await expect(await inventoryPage.transactionBuilder.getLineItemsCount()).toBe(0);
      await expect(await inventoryPage.transactionBuilder.notesInput.inputValue()).toBe('');
    });
  });

  test.describe('Transaction Builder - Stock Addition Transactions', () => {
    test('should create a stock addition transaction', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('stock_addition');

      // Verify modal opens with correct type
      await inventoryPage.transactionBuilder.expectTransactionType('stock_addition');

      // Add products for stock addition
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 50);
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[1].name, 25);

      // Verify line items
      await inventoryPage.transactionBuilder.expectLineItemExists(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.expectLineItemQuantity(testData.inventory.items[0].name, 50);

      // Set custom cost prices
      const firstLineItem = inventoryPage.transactionBuilder.getLineItemByProductName(testData.inventory.items[0].name);
      await inventoryPage.transactionBuilder.updateLineItemUnitPrice(firstLineItem, 80.00); // Cost price

      // Add supplier notes
      await inventoryPage.transactionBuilder.setNotes('Stock received from Supplier ABC - Invoice #12345');

      // Save transaction
      await inventoryPage.transactionBuilder.saveTransaction();
      await inventoryPage.transactionBuilder.expectModalClosed();
    });

    test('should handle large quantity stock additions', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('stock_addition');

      // Add large quantities
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 1000);

      // Verify quantity
      await inventoryPage.transactionBuilder.expectLineItemQuantity(testData.inventory.items[0].name, 1000);

      // Calculate expected totals for large quantity
      const expectedSubtotal = testData.inventory.items[0].cost * 1000;
      const expectedTax = expectedSubtotal * 0.16;
      const expectedTotal = expectedSubtotal + expectedTax;

      await inventoryPage.transactionBuilder.expectCalculatedTotals(expectedSubtotal, expectedTax, expectedTotal);

      // Save transaction
      await inventoryPage.transactionBuilder.saveTransaction();
      await inventoryPage.transactionBuilder.expectModalClosed();
    });
  });

  test.describe('Transaction History', () => {
    test('should display transaction history', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Verify modal opens
      await inventoryPage.transactionHistory.waitForModal();

      // Check summary cards are visible
      await expect(inventoryPage.transactionHistory.summaryCards).toHaveCount(4);

      // Verify transaction list
      const transactionCount = await inventoryPage.transactionHistory.getTransactionCount();
      expect(transactionCount).toBeGreaterThan(0);
    });

    test('should search transactions', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Search by transaction ID
      await inventoryPage.transactionHistory.searchTransactions('txn-');
      
      // Verify search results
      const searchResults = await inventoryPage.transactionHistory.getTransactionCount();
      expect(searchResults).toBeGreaterThan(0);

      // Search by product name
      await inventoryPage.transactionHistory.searchTransactions('Wireless Headphones');
      
      // Clear search
      await inventoryPage.transactionHistory.searchTransactions('');
    });

    test('should filter transactions by type', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Filter by sales only
      await inventoryPage.transactionHistory.filterByType('sale');
      
      // Verify all visible transactions are sales
      const transactionCards = inventoryPage.transactionHistory.transactionCards;
      const count = await transactionCards.count();
      
      for (let i = 0; i < count; i++) {
        const card = transactionCards.nth(i);
        await expect(card).toContainText('Sale');
      }

      // Filter by stock additions
      await inventoryPage.transactionHistory.filterByType('stock_addition');
      
      // Reset filter
      await inventoryPage.transactionHistory.filterByType('all');
    });

    test('should filter transactions by status', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Filter by completed transactions
      await inventoryPage.transactionHistory.filterByStatus('completed');
      
      // Verify filtering worked
      const transactionCards = inventoryPage.transactionHistory.transactionCards;
      const count = await transactionCards.count();
      
      for (let i = 0; i < count; i++) {
        const card = transactionCards.nth(i);
        await expect(card).toContainText('Completed');
      }
    });

    test('should use advanced filters', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Show advanced filters
      await inventoryPage.transactionHistory.showAdvancedFilters();
      await inventoryPage.transactionHistory.expectAdvancedFiltersVisible();

      // Filter by date range
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await inventoryPage.transactionHistory.filterByDateRange(yesterday, today);

      // Filter by amount range
      await inventoryPage.transactionHistory.filterByAmountRange(100, 1000);

      // Change sorting
      await inventoryPage.transactionHistory.sortBy('total', 'desc');

      // Reset filters
      await inventoryPage.transactionHistory.resetFilters();

      // Hide advanced filters
      await inventoryPage.transactionHistory.hideAdvancedFilters();
      await inventoryPage.transactionHistory.expectAdvancedFiltersHidden();
    });

    test('should export transaction history', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Export transactions
      await inventoryPage.transactionHistory.exportTransactions();
      
      // Note: The download is handled in the page object method
      // In a real test, you might want to verify the file contents
    });

    test('should handle pagination', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Set items per page to a small number
      await inventoryPage.transactionHistory.setItemsPerPage(5);

      // Check if pagination controls are visible
      const transactionCount = await inventoryPage.transactionHistory.getTransactionCount();
      
      if (transactionCount === 5) {
        // Navigate to next page if available
        const nextButton = inventoryPage.transactionHistory.paginationControls.locator('button:has-text("Next")');
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          
          // Navigate back to first page
          await inventoryPage.transactionHistory.navigateToPage(1);
        }
      }
    });

    test('should view transaction details', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionHistory();

      // Get first transaction ID
      const firstTransaction = inventoryPage.transactionHistory.transactionCards.first();
      const transactionId = await firstTransaction.locator('[data-testid="transaction-id"]').textContent();
      
      if (transactionId) {
        // View transaction details
        await inventoryPage.transactionHistory.viewTransactionDetails(transactionId);
        
        // Verify details modal opens
        await inventoryPage.transactionDetails.waitForModal();
        
        // Verify transaction details are displayed
        await inventoryPage.transactionDetails.expectTransactionDetails({
          id: transactionId
        });
        
        // Close details modal
        await inventoryPage.transactionDetails.closeModal();
        await inventoryPage.transactionDetails.expectModalClosed();
      }
    });
  });

  test.describe('Transaction Workflow Integration', () => {
    test('should create sale and verify in history', async ({ page }) => {
      // Create a sale transaction
      await transactionWorkflow.createSaleTransaction([
        { name: testData.inventory.items[0].name, quantity: 2, unitPrice: 199.99 },
        { name: testData.inventory.items[1].name, quantity: 1 }
      ], {
        taxRate: 0.15,
        notes: 'Integration test sale'
      });

      // Verify transaction appears in history
      await transactionWorkflow.viewTransactionHistory();
      
      // Search for the transaction by notes
      await inventoryPage.transactionHistory.searchTransactions('Integration test sale');
      
      // Verify transaction exists
      const transactionCount = await inventoryPage.transactionHistory.getTransactionCount();
      expect(transactionCount).toBeGreaterThan(0);
    });

    test('should create stock addition and verify in history', async ({ page }) => {
      // Create a stock addition transaction
      await transactionWorkflow.createStockAdditionTransaction([
        { name: testData.inventory.items[0].name, quantity: 100, unitPrice: 120.00 }
      ], {
        notes: 'Integration test stock addition'
      });

      // Verify transaction appears in history
      await transactionWorkflow.viewTransactionHistory();
      
      // Filter by stock additions
      await inventoryPage.transactionHistory.filterByType('stock_addition');
      
      // Search for the transaction
      await inventoryPage.transactionHistory.searchTransactions('Integration test stock addition');
      
      // Verify transaction exists
      const transactionCount = await inventoryPage.transactionHistory.getTransactionCount();
      expect(transactionCount).toBeGreaterThan(0);
    });

    test('should handle transaction workflow with different user roles', async ({ page }) => {
      // Test as manager
      await loginAsManager(page);
      
      await transactionWorkflow.createSaleTransaction([
        { name: testData.inventory.items[0].name, quantity: 1 }
      ], {
        notes: 'Manager sale transaction'
      });

      // Test as employee
      await loginAsEmployee(page);
      
      await transactionWorkflow.createSaleTransaction([
        { name: testData.inventory.items[1].name, quantity: 1 }
      ], {
        notes: 'Employee sale transaction'
      });

      // Verify both transactions in history as admin
      await loginAsAdmin(page);
      await transactionWorkflow.viewTransactionHistory();
      
      // Filter by different users
      await inventoryPage.transactionHistory.filterByUser('manager');
      await inventoryPage.transactionHistory.filterByUser('employee');
      await inventoryPage.transactionHistory.filterByUser('all');
    });
  });

  test.describe('Transaction Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/inventory**', route => route.abort());
      
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Verify loading state or error message
      await inventoryPage.transactionBuilder.expectLoadingState();
      
      // Restore network
      await page.unroute('**/api/inventory**');
    });

    test('should validate required fields', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Try to save without any items
      await inventoryPage.transactionBuilder.expectSaveButtonDisabled();

      // Add item and verify save becomes enabled
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 1);
      await inventoryPage.transactionBuilder.expectSaveButtonEnabled();
    });

    test('should handle invalid product searches', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Search for non-existent product
      await inventoryPage.transactionBuilder.searchProducts('NONEXISTENT-PRODUCT-12345');
      
      // Verify no products found message
      await expect(inventoryPage.transactionBuilder.productList).toContainText('No products found');
    });
  });

  test.describe('Transaction Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await inventoryPage.goto();
      
      // Navigate to transaction builder using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Open transaction builder
      
      await inventoryPage.transactionBuilder.waitForModal();
      
      // Navigate through form using keyboard
      await page.keyboard.press('Tab'); // Transaction type
      await page.keyboard.press('Tab'); // Barcode input
      await page.keyboard.press('Tab'); // Add product button
      
      // Close modal with Escape
      await page.keyboard.press('Escape');
      await inventoryPage.transactionBuilder.expectModalClosed();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Check for ARIA labels on key elements
      await expect(inventoryPage.transactionBuilder.modal).toHaveAttribute('role', 'dialog');
      await expect(inventoryPage.transactionBuilder.searchInput).toHaveAttribute('aria-label');
      await expect(inventoryPage.transactionBuilder.saveButton).toHaveAttribute('aria-label');
    });

    test('should support screen readers', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      // Add product and verify screen reader announcements
      await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[0].name, 1);
      
      // Check for live regions or announcements
      const liveRegion = page.locator('[aria-live]');
      if (await liveRegion.count() > 0) {
        await expect(liveRegion.first()).toBeVisible();
      }
    });
  });

  test.describe('Transaction Performance', () => {
    test('should load transaction builder quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle large transaction history efficiently', async ({ page }) => {
      await inventoryPage.goto();
      
      const startTime = Date.now();
      await inventoryPage.openTransactionHistory();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      // Test pagination performance
      await inventoryPage.transactionHistory.setItemsPerPage(50);
      
      const paginationTime = Date.now();
      await inventoryPage.transactionHistory.navigateToPage(2);
      
      const paginationLoadTime = Date.now() - paginationTime;
      expect(paginationLoadTime).toBeLessThan(2000); // Pagination should be fast
    });

    test('should handle rapid product additions efficiently', async ({ page }) => {
      await inventoryPage.goto();
      await inventoryPage.openTransactionBuilder('sale');

      const startTime = Date.now();
      
      // Add multiple products rapidly
      for (let i = 0; i < Math.min(5, testData.inventory.items.length); i++) {
        await inventoryPage.transactionBuilder.addProductByName(testData.inventory.items[i].name, 1);
      }
      
      const additionTime = Date.now() - startTime;
      expect(additionTime).toBeLessThan(10000); // Should handle rapid additions
      
      // Verify all items were added
      await expect(await inventoryPage.transactionBuilder.getLineItemsCount()).toBe(Math.min(5, testData.inventory.items.length));
    });
  });
});