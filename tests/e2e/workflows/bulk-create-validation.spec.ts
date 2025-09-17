import { test, expect } from '@playwright/test';
import { InventoryFlow } from '../page-objects/inventory-page';
import { AuthPage } from '../page-objects/auth-page';
import { formData, testInventoryItems, urls, testUsers } from '../fixtures/test-data';

test.describe('Bulk Create Validation and Error Handling', () => {
  let inventoryFlow: InventoryFlow;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    inventoryFlow = new InventoryFlow(page);
    authPage = new AuthPage(page);
    
    // Login as admin before each test
    await authPage.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.describe('Translation Key Validation', () => {
    test('Verify Spanish translation keys are working', async ({ page }) => {
      // Set language to Spanish
      await page.goto('/');
      await page.click('[data-testid="language-selector"]');
      await page.selectOption('[data-testid="language-selector"]', 'es');
      
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Try to submit with empty required fields to trigger validation
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Verify Spanish error messages are displayed
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('El SKU es obligatorio');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('El nombre es obligatorio');
    });

    test('Verify English translation keys are working', async ({ page }) => {
      // Set language to English
      await page.goto('/');
      await page.click('[data-testid="language-selector"]');
      await page.selectOption('[data-testid="language-selector"]', 'en');
      
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Try to submit with empty required fields to trigger validation
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Verify English error messages are displayed
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name is required');
    });

    test('Verify translation keys work with mixed language content', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form with mixed language content
      await page.fill('[data-testid="bulk-sku-1"]', 'MIXED-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Producto con nombre en español');
      
      await page.fill('[data-testid="bulk-sku-2"]', 'MIXED-002');
      await page.fill('[data-testid="bulk-name-2"]', 'Product with English name');
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify both items were created successfully
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible('Producto con nombre en español');
      await inventoryFlow.inventory.expectInventoryItemVisible('Product with English name');
    });
  });

  test.describe('Form Validation Scenarios', () => {
    test('Validate required fields in bulk create', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Test case 1: Empty SKU, valid name
      await page.fill('[data-testid="bulk-name-1"]', 'Test Item 1');
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).not.toContainText('Name is required');
      
      // Test case 2: Valid SKU, empty name
      await page.fill('[data-testid="bulk-sku-1"]', 'TEST-001');
      await page.fill('[data-testid="bulk-name-1"]', '');
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).not.toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name is required');
      
      // Test case 3: Both fields empty
      await page.fill('[data-testid="bulk-sku-1"]', '');
      await page.fill('[data-testid="bulk-name-1"]', '');
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name is required');
    });

    test('Validate multiple rows with mixed validation states', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Row 1: Valid data
      await page.fill('[data-testid="bulk-sku-1"]', 'VALID-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Valid Item 1');
      
      // Row 2: Missing SKU
      await page.fill('[data-testid="bulk-name-2"]', 'Invalid Item 2');
      
      // Row 3: Missing name
      await page.fill('[data-testid="bulk-sku-3"]', 'INVALID-003');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show validation errors for rows 2 and 3
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name is required');
      
      // Should not create any items due to validation errors
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemNotVisible('Valid Item 1');
    });

    test('Validate SKU format and uniqueness', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Test case 1: Invalid SKU format
      await page.fill('[data-testid="bulk-sku-1"]', 'invalid sku format!');
      await page.fill('[data-testid="bulk-name-1"]', 'Invalid SKU Item');
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Invalid SKU format');
      
      // Test case 2: Duplicate SKU within the same form
      await page.fill('[data-testid="bulk-sku-1"]', 'DUPLICATE-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Item 1');
      await page.fill('[data-testid="bulk-sku-2"]', 'DUPLICATE-001'); // Same SKU
      await page.fill('[data-testid="bulk-name-2"]', 'Item 2');
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Duplicate SKU found');
      
      // Test case 3: SKU that already exists in database
      await page.fill('[data-testid="bulk-sku-1"]', 'EXISTING-SKU');
      await page.fill('[data-testid="bulk-name-1"]', 'New Item');
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU already exists');
    });

    test('Validate name length and special characters', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Test case 1: Name too long
      const longName = 'A'.repeat(256); // Exceeds maximum length
      await page.fill('[data-testid="bulk-sku-1"]', 'LONG-001');
      await page.fill('[data-testid="bulk-name-1"]', longName);
      await page.click('[data-testid="bulk-create-submit"]');
      
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name too long');
      
      // Test case 2: Name with special characters (should be allowed)
      await page.fill('[data-testid="bulk-sku-1"]', 'SPECIAL-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Item with Special Chars: @#$%^&*()');
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should succeed
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify item was created
      await inventoryFlow.inventory.goto();
      await inventoryFlow.inventory.expectInventoryItemVisible('Item with Special Chars: @#$%^&*()');
    });
  });

  test.describe('API Integration Validation', () => {
    test('Verify POST method works for bulk create', async ({ page }) => {
      // Monitor API calls
      const apiCalls = [];
      page.on('request', request => {
        if (request.url().includes('/api/inventory/items') && request.method() === 'POST') {
          apiCalls.push(request);
        }
      });
      
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form with valid data
      await page.fill('[data-testid="bulk-sku-1"]', 'API-TEST-001');
      await page.fill('[data-testid="bulk-name-1"]', 'API Test Item');
      await page.fill('[data-testid="bulk-sku-2"]', 'API-TEST-002');
      await page.fill('[data-testid="bulk-name-2"]', 'API Test Item 2');
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify POST request was made
      expect(apiCalls.length).toBeGreaterThan(0);
      
      // Verify request payload
      const request = apiCalls[0];
      const postData = request.postData();
      expect(postData).toContain('API-TEST-001');
      expect(postData).toContain('API Test Item');
    });

    test('Handle API errors gracefully', async ({ page }) => {
      // Mock API error response
      await page.route('**/api/inventory/items', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form with valid data
      await page.fill('[data-testid="bulk-sku-1"]', 'ERROR-TEST-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Error Test Item');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Internal server error');
      
      // Should provide retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('Handle network timeout', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/inventory/items', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }, 10000); // 10 second delay
      });
      
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form with valid data
      await page.fill('[data-testid="bulk-sku-1"]', 'TIMEOUT-TEST-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Timeout Test Item');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Should eventually succeed
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('User Experience Validation', () => {
    test('Verify form state persistence during validation', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form with valid data
      await page.fill('[data-testid="bulk-sku-1"]', 'PERSIST-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Persist Test Item');
      await page.fill('[data-testid="bulk-sku-2"]', 'PERSIST-002');
      await page.fill('[data-testid="bulk-name-2"]', 'Persist Test Item 2');
      
      // Try to submit with validation error (empty third row)
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Verify form data is preserved
      await expect(page.locator('[data-testid="bulk-sku-1"]')).toHaveValue('PERSIST-001');
      await expect(page.locator('[data-testid="bulk-name-1"]')).toHaveValue('Persist Test Item');
      await expect(page.locator('[data-testid="bulk-sku-2"]')).toHaveValue('PERSIST-002');
      await expect(page.locator('[data-testid="bulk-name-2"]')).toHaveValue('Persist Test Item 2');
    });

    test('Verify dynamic row addition and removal', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Add rows
      await page.click('[data-testid="add-row-button"]');
      await page.click('[data-testid="add-row-button"]');
      
      // Verify 5 rows exist (3 initial + 2 added)
      const rows = page.locator('[data-testid^="bulk-row-"]');
      await expect(rows).toHaveCount(5);
      
      // Remove a row
      await page.click('[data-testid="remove-row-4"]');
      
      // Verify 4 rows exist
      await expect(rows).toHaveCount(4);
      
      // Fill all rows and submit
      for (let i = 1; i <= 4; i++) {
        await page.fill(`[data-testid="bulk-sku-${i}"]`, `DYNAMIC-${i}`);
        await page.fill(`[data-testid="bulk-name-${i}"]`, `Dynamic Item ${i}`);
      }
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });

    test('Verify form reset functionality', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form
      await page.fill('[data-testid="bulk-sku-1"]', 'RESET-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Reset Test Item');
      
      // Reset form
      await page.click('[data-testid="reset-form-button"]');
      
      // Verify form is cleared
      await expect(page.locator('[data-testid="bulk-sku-1"]')).toHaveValue('');
      await expect(page.locator('[data-testid="bulk-name-1"]')).toHaveValue('');
    });

    test('Verify modal close and reopen behavior', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form partially
      await page.fill('[data-testid="bulk-sku-1"]', 'MODAL-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Modal Test Item');
      
      // Close modal
      await page.click('[data-testid="close-modal"]');
      
      // Reopen modal
      await page.click('[data-testid="bulk-create-button"]');
      
      // Verify form is reset (not persisted)
      await expect(page.locator('[data-testid="bulk-sku-1"]')).toHaveValue('');
      await expect(page.locator('[data-testid="bulk-name-1"]')).toHaveValue('');
    });
  });

  test.describe('Data Integrity Validation', () => {
    test('Verify created items have correct data', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form with specific data
      const testData = [
        { sku: 'INTEGRITY-001', name: 'Integrity Test Item 1', category: 'Electronics' },
        { sku: 'INTEGRITY-002', name: 'Integrity Test Item 2', category: 'Clothing' },
        { sku: 'INTEGRITY-003', name: 'Integrity Test Item 3', category: 'Books' }
      ];
      
      for (let i = 0; i < testData.length; i++) {
        await page.fill(`[data-testid="bulk-sku-${i + 1}"]`, testData[i].sku);
        await page.fill(`[data-testid="bulk-name-${i + 1}"]`, testData[i].name);
        await page.selectOption(`[data-testid="bulk-category-${i + 1}"]`, testData[i].category);
      }
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify items were created with correct data
      await inventoryFlow.inventory.goto();
      for (const item of testData) {
        await inventoryFlow.inventory.expectInventoryItemVisible(item.name);
        
        // Verify item details
        const itemDetails = await inventoryFlow.inventory.getInventoryItemDetails(0);
        expect(itemDetails.sku).toContain(item.sku);
        expect(itemDetails.name).toContain(item.name);
        expect(itemDetails.category).toContain(item.category);
      }
    });

    test('Verify audit trail for bulk create operations', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Fill form
      await page.fill('[data-testid="bulk-sku-1"]', 'AUDIT-001');
      await page.fill('[data-testid="bulk-name-1"]', 'Audit Test Item');
      
      await page.click('[data-testid="bulk-create-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Check audit trail
      await page.goto(urls.audit);
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('INSERT');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('inventory');
      await expect(page.locator('[data-testid="audit-table"]')).toContainText('AUDIT-001');
    });

    test('Verify database constraints are enforced', async ({ page }) => {
      await inventoryFlow.inventory.goto();
      await page.click('[data-testid="bulk-create-button"]');
      
      // Test case 1: Try to create item with existing SKU
      await page.fill('[data-testid="bulk-sku-1"]', 'EXISTING-SKU');
      await page.fill('[data-testid="bulk-name-1"]', 'New Item with Existing SKU');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show error
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU already exists');
      
      // Test case 2: Try to create item with null required fields
      await page.fill('[data-testid="bulk-sku-1"]', '');
      await page.fill('[data-testid="bulk-name-1"]', '');
      
      await page.click('[data-testid="bulk-create-submit"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('SKU is required');
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Name is required');
    });
  });
});