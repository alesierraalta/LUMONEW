import { test, expect, Page } from '@playwright/test'

// Test data
const testInventoryItem = {
  name: 'Test Product',
  sku: 'TEST-001',
  category: 'Electronics',
  location: 'Warehouse A',
  price: 99.99,
  quantity: 50,
  minStock: 10
}

const bulkTestItems = [
  {
    name: 'Bulk Product 1',
    sku: 'BULK-001',
    category: 'Electronics',
    location: 'Warehouse A',
    price: 29.99,
    quantity: 25,
    minStock: 5
  },
  {
    name: 'Bulk Product 2',
    sku: 'BULK-002',
    category: 'Electronics',
    location: 'Warehouse B',
    price: 39.99,
    quantity: 30,
    minStock: 8
  }
]

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login')
  await page.fill('[data-testid="email-input"]', 'admin@example.com')
  await page.fill('[data-testid="password-input"]', 'admin123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/dashboard')
}

async function navigateToInventory(page: Page) {
  await page.click('[data-testid="inventory-nav-link"]')
  await page.waitForURL('/inventory')
  await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible()
}

async function createInventoryItem(page: Page, item: typeof testInventoryItem) {
  await page.click('[data-testid="add-item-button"]')
  await page.waitForSelector('[data-testid="item-form"]')
  
  await page.fill('[data-testid="item-name-input"]', item.name)
  await page.fill('[data-testid="item-sku-input"]', item.sku)
  await page.selectOption('[data-testid="category-select"]', { label: item.category })
  await page.selectOption('[data-testid="location-select"]', { label: item.location })
  await page.fill('[data-testid="price-input"]', item.price.toString())
  await page.fill('[data-testid="quantity-input"]', item.quantity.toString())
  await page.fill('[data-testid="min-stock-input"]', item.minStock.toString())
  
  await page.click('[data-testid="save-item-button"]')
  await page.waitForSelector('[data-testid="success-message"]')
}

async function searchInventoryItem(page: Page, searchTerm: string) {
  await page.fill('[data-testid="search-input"]', searchTerm)
  await page.press('[data-testid="search-input"]', 'Enter')
  await page.waitForTimeout(500) // Wait for search results
}

async function selectInventoryItem(page: Page, itemName: string) {
  const row = page.locator(`[data-testid="inventory-row"]:has-text("${itemName}")`)
  await row.locator('[data-testid="item-checkbox"]').check()
}

// Test suite for inventory functionality
test.describe('Inventory System Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToInventory(page)
  })

  // Basic CRUD Operations
  test.describe('Basic CRUD Operations', () => {
    test('should create a new inventory item', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Verify item appears in table
      await searchInventoryItem(page, testInventoryItem.sku)
      await expect(page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)).toBeVisible()
    })

    test('should read/display inventory items', async ({ page }) => {
      // Verify table is loaded
      await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="inventory-row"]')).toHaveCount.greaterThan(0)
    })

    test('should update an inventory item', async ({ page }) => {
      // First create an item
      await createInventoryItem(page, testInventoryItem)
      
      // Find and edit the item
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="edit-button"]').click()
      
      // Update the item
      const newName = 'Updated Test Product'
      await page.fill('[data-testid="item-name-input"]', newName)
      await page.click('[data-testid="save-item-button"]')
      
      // Verify update
      await searchInventoryItem(page, testInventoryItem.sku)
      await expect(page.locator(`[data-testid="inventory-row"]:has-text("${newName}")`)).toBeVisible()
    })

    test('should delete an inventory item', async ({ page }) => {
      // First create an item
      await createInventoryItem(page, testInventoryItem)
      
      // Find and delete the item
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="delete-button"]').click()
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]')
      
      // Verify deletion
      await searchInventoryItem(page, testInventoryItem.sku)
      await expect(page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)).not.toBeVisible()
    })
  })

  // Search and Filtering
  test.describe('Search and Filtering', () => {
    test('should search inventory by name', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      await searchInventoryItem(page, testInventoryItem.name)
      await expect(page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)).toBeVisible()
    })

    test('should search inventory by SKU', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      await searchInventoryItem(page, testInventoryItem.sku)
      await expect(page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)).toBeVisible()
    })

    test('should filter by category', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      await page.selectOption('[data-testid="category-filter"]', { label: testInventoryItem.category })
      await page.waitForTimeout(500)
      
      // Verify only items from selected category are shown
      const rows = page.locator('[data-testid="inventory-row"]')
      const count = await rows.count()
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText(testInventoryItem.category)
      }
    })

    test('should filter by location', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      await page.selectOption('[data-testid="location-filter"]', { label: testInventoryItem.location })
      await page.waitForTimeout(500)
      
      // Verify only items from selected location are shown
      const rows = page.locator('[data-testid="inventory-row"]')
      const count = await rows.count()
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText(testInventoryItem.location)
      }
    })

    test('should filter by stock status', async ({ page }) => {
      // Create item with low stock
      const lowStockItem = { ...testInventoryItem, quantity: 5, minStock: 10 }
      await createInventoryItem(page, lowStockItem)
      
      await page.click('[data-testid="low-stock-filter"]')
      await page.waitForTimeout(500)
      
      // Verify low stock items are shown
      await expect(page.locator(`[data-testid="inventory-row"]:has-text("${lowStockItem.name}")`)).toBeVisible()
    })
  })

  // Sorting
  test.describe('Sorting', () => {
    test('should sort by name', async ({ page }) => {
      await page.click('[data-testid="sort-name-button"]')
      await page.waitForTimeout(500)
      
      // Verify sorting (check first few items are in alphabetical order)
      const rows = page.locator('[data-testid="inventory-row"]')
      const firstItem = await rows.first().locator('[data-testid="item-name"]').textContent()
      const secondItem = await rows.nth(1).locator('[data-testid="item-name"]').textContent()
      
      expect(firstItem!.localeCompare(secondItem!)).toBeLessThanOrEqual(0)
    })

    test('should sort by SKU', async ({ page }) => {
      await page.click('[data-testid="sort-sku-button"]')
      await page.waitForTimeout(500)
      
      // Verify sorting
      const rows = page.locator('[data-testid="inventory-row"]')
      const firstItem = await rows.first().locator('[data-testid="item-sku"]').textContent()
      const secondItem = await rows.nth(1).locator('[data-testid="item-sku"]').textContent()
      
      expect(firstItem!.localeCompare(secondItem!)).toBeLessThanOrEqual(0)
    })

    test('should sort by price', async ({ page }) => {
      await page.click('[data-testid="sort-price-button"]')
      await page.waitForTimeout(500)
      
      // Verify sorting
      const rows = page.locator('[data-testid="inventory-row"]')
      const firstPrice = await rows.first().locator('[data-testid="item-price"]').textContent()
      const secondPrice = await rows.nth(1).locator('[data-testid="item-price"]').textContent()
      
      const firstPriceNum = parseFloat(firstPrice!.replace(/[^0-9.-]+/g, ''))
      const secondPriceNum = parseFloat(secondPrice!.replace(/[^0-9.-]+/g, ''))
      
      expect(firstPriceNum).toBeLessThanOrEqual(secondPriceNum)
    })

    test('should sort by quantity', async ({ page }) => {
      await page.click('[data-testid="sort-quantity-button"]')
      await page.waitForTimeout(500)
      
      // Verify sorting
      const rows = page.locator('[data-testid="inventory-row"]')
      const firstQuantity = await rows.first().locator('[data-testid="item-quantity"]').textContent()
      const secondQuantity = await rows.nth(1).locator('[data-testid="item-quantity"]').textContent()
      
      const firstQtyNum = parseInt(firstQuantity!)
      const secondQtyNum = parseInt(secondQuantity!)
      
      expect(firstQtyNum).toBeLessThanOrEqual(secondQtyNum)
    })
  })

  // Quick Stock Operations
  test.describe('Quick Stock Operations', () => {
    test('should add stock to an item', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Find the item and click add stock
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="add-stock-button"]').click()
      
      // Fill quick stock modal
      await page.waitForSelector('[data-testid="quick-stock-modal"]')
      await page.fill('[data-testid="stock-quantity-input"]', '10')
      await page.selectOption('[data-testid="stock-reason-select"]', { label: 'Received' })
      await page.click('[data-testid="confirm-stock-button"]')
      
      // Verify stock was added
      await page.waitForSelector('[data-testid="success-message"]')
      const newQuantity = testInventoryItem.quantity + 10
      await expect(row.locator('[data-testid="item-quantity"]')).toContainText(newQuantity.toString())
    })

    test('should subtract stock from an item', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Find the item and click subtract stock
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="subtract-stock-button"]').click()
      
      // Fill quick stock modal
      await page.waitForSelector('[data-testid="quick-stock-modal"]')
      await page.fill('[data-testid="stock-quantity-input"]', '5')
      await page.selectOption('[data-testid="stock-reason-select"]', { label: 'Sold' })
      await page.click('[data-testid="confirm-stock-button"]')
      
      // Verify stock was subtracted
      await page.waitForSelector('[data-testid="success-message"]')
      const newQuantity = testInventoryItem.quantity - 5
      await expect(row.locator('[data-testid="item-quantity"]')).toContainText(newQuantity.toString())
    })

    test('should prevent negative stock', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Try to subtract more stock than available
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="subtract-stock-button"]').click()
      
      // Fill quick stock modal with excessive quantity
      await page.waitForSelector('[data-testid="quick-stock-modal"]')
      await page.fill('[data-testid="stock-quantity-input"]', (testInventoryItem.quantity + 10).toString())
      await page.selectOption('[data-testid="stock-reason-select"]', { label: 'Sold' })
      await page.click('[data-testid="confirm-stock-button"]')
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('insufficient stock')
    })
  })

  // Bulk Operations
  test.describe('Bulk Operations', () => {
    test('should select multiple items', async ({ page }) => {
      // Create multiple items
      for (const item of bulkTestItems) {
        await createInventoryItem(page, item)
      }
      
      // Select multiple items
      for (const item of bulkTestItems) {
        await selectInventoryItem(page, item.name)
      }
      
      // Verify bulk operations button appears
      await expect(page.locator('[data-testid="bulk-operations-button"]')).toBeVisible()
    })

    test('should perform bulk price update', async ({ page }) => {
      // Create and select multiple items
      for (const item of bulkTestItems) {
        await createInventoryItem(page, item)
        await selectInventoryItem(page, item.name)
      }
      
      // Open bulk operations
      await page.click('[data-testid="bulk-operations-button"]')
      await page.waitForSelector('[data-testid="bulk-operations-modal"]')
      
      // Select price update operation
      await page.click('[data-testid="update-operation-button"]')
      await page.selectOption('[data-testid="operation-type-select"]', { label: 'Price Update' })
      await page.selectOption('[data-testid="price-adjustment-type"]', { label: 'Percentage' })
      await page.fill('[data-testid="price-adjustment-value"]', '10')
      await page.fill('[data-testid="operation-reason"]', 'Annual price increase')
      await page.click('[data-testid="execute-bulk-operation"]')
      
      // Verify success
      await page.waitForSelector('[data-testid="bulk-operation-success"]')
    })

    test('should perform bulk category change', async ({ page }) => {
      // Create and select multiple items
      for (const item of bulkTestItems) {
        await createInventoryItem(page, item)
        await selectInventoryItem(page, item.name)
      }
      
      // Open bulk operations
      await page.click('[data-testid="bulk-operations-button"]')
      await page.waitForSelector('[data-testid="bulk-operations-modal"]')
      
      // Select category change operation
      await page.click('[data-testid="update-operation-button"]')
      await page.selectOption('[data-testid="operation-type-select"]', { label: 'Category Change' })
      await page.selectOption('[data-testid="new-category-select"]', { label: 'Accessories' })
      await page.fill('[data-testid="operation-reason"]', 'Category reorganization')
      await page.click('[data-testid="execute-bulk-operation"]')
      
      // Verify success
      await page.waitForSelector('[data-testid="bulk-operation-success"]')
    })

    test('should perform bulk deletion', async ({ page }) => {
      // Create and select multiple items
      for (const item of bulkTestItems) {
        await createInventoryItem(page, item)
        await selectInventoryItem(page, item.name)
      }
      
      // Open bulk operations
      await page.click('[data-testid="bulk-operations-button"]')
      await page.waitForSelector('[data-testid="bulk-operations-modal"]')
      
      // Select delete operation
      await page.click('[data-testid="delete-operation-button"]')
      await page.fill('[data-testid="delete-reason"]', 'Obsolete products')
      await page.check('[data-testid="confirm-delete-checkbox"]')
      await page.click('[data-testid="execute-bulk-operation"]')
      
      // Verify success
      await page.waitForSelector('[data-testid="bulk-operation-success"]')
    })
  })

  // CSV Import
  test.describe('CSV Import', () => {
    test('should import inventory from CSV', async ({ page }) => {
      // Create test CSV file
      const csvContent = `name,sku,category,location,price,quantity,min_stock
Test CSV Product 1,CSV-001,Electronics,Warehouse A,29.99,25,5
Test CSV Product 2,CSV-002,Electronics,Warehouse B,39.99,30,8`
      
      // Navigate to import
      await page.click('[data-testid="import-csv-button"]')
      await page.waitForSelector('[data-testid="csv-import-modal"]')
      
      // Upload CSV file
      const fileInput = page.locator('[data-testid="csv-file-input"]')
      await fileInput.setInputFiles({
        name: 'test-inventory.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      })
      
      // Proceed through import steps
      await page.click('[data-testid="next-step-button"]') // Mapping step
      await page.click('[data-testid="next-step-button"]') // Preview step
      await page.click('[data-testid="start-import-button"]') // Import step
      
      // Wait for import completion
      await page.waitForSelector('[data-testid="import-complete"]')
      
      // Verify imported items
      await page.click('[data-testid="close-import-modal"]')
      await searchInventoryItem(page, 'CSV-001')
      await expect(page.locator('[data-testid="inventory-row"]:has-text("Test CSV Product 1")')).toBeVisible()
    })

    test('should handle CSV import errors', async ({ page }) => {
      // Create invalid CSV file
      const invalidCsvContent = `name,sku,category,location,price,quantity,min_stock
Invalid Product,,Electronics,Warehouse A,invalid_price,25,5`
      
      // Navigate to import
      await page.click('[data-testid="import-csv-button"]')
      await page.waitForSelector('[data-testid="csv-import-modal"]')
      
      // Upload invalid CSV file
      const fileInput = page.locator('[data-testid="csv-file-input"]')
      await fileInput.setInputFiles({
        name: 'invalid-inventory.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(invalidCsvContent)
      })
      
      // Proceed through import steps
      await page.click('[data-testid="next-step-button"]') // Mapping step
      await page.click('[data-testid="next-step-button"]') // Preview step
      await page.click('[data-testid="start-import-button"]') // Import step
      
      // Wait for import completion with errors
      await page.waitForSelector('[data-testid="import-errors"]')
      await expect(page.locator('[data-testid="error-count"]')).toContainText('1')
    })
  })

  // Transaction Builder
  test.describe('Transaction Builder', () => {
    test('should create a sale transaction', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Open transaction builder
      await page.click('[data-testid="transaction-builder-button"]')
      await page.waitForSelector('[data-testid="transaction-builder-modal"]')
      
      // Select sale mode
      await page.selectOption('[data-testid="transaction-type-select"]', { label: 'Sale Transaction' })
      
      // Add product to transaction
      await page.click('[data-testid="add-product-button"]')
      await page.fill('[data-testid="product-search-input"]', testInventoryItem.name)
      await page.click(`[data-testid="product-option"]:has-text("${testInventoryItem.name}")`)
      
      // Set quantity
      await page.fill('[data-testid="transaction-quantity-input"]', '2')
      
      // Set tax rate
      await page.fill('[data-testid="tax-rate-input"]', '16')
      
      // Save transaction
      await page.click('[data-testid="save-transaction-button"]')
      
      // Verify transaction was created
      await page.waitForSelector('[data-testid="transaction-success"]')
    })

    test('should create a stock addition transaction', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Open transaction builder
      await page.click('[data-testid="transaction-builder-button"]')
      await page.waitForSelector('[data-testid="transaction-builder-modal"]')
      
      // Select stock addition mode
      await page.selectOption('[data-testid="transaction-type-select"]', { label: 'Stock Addition' })
      
      // Add product to transaction
      await page.click('[data-testid="add-product-button"]')
      await page.fill('[data-testid="product-search-input"]', testInventoryItem.name)
      await page.click(`[data-testid="product-option"]:has-text("${testInventoryItem.name}")`)
      
      // Set quantity
      await page.fill('[data-testid="transaction-quantity-input"]', '10')
      
      // Save transaction
      await page.click('[data-testid="save-transaction-button"]')
      
      // Verify transaction was created
      await page.waitForSelector('[data-testid="transaction-success"]')
    })

    test('should scan SKU to add product', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Open transaction builder
      await page.click('[data-testid="transaction-builder-button"]')
      await page.waitForSelector('[data-testid="transaction-builder-modal"]')
      
      // Scan SKU
      await page.fill('[data-testid="sku-scanner-input"]', testInventoryItem.sku)
      await page.press('[data-testid="sku-scanner-input"]', 'Enter')
      
      // Verify product was added
      await expect(page.locator(`[data-testid="transaction-item"]:has-text("${testInventoryItem.name}")`)).toBeVisible()
    })
  })

  // Image Management
  test.describe('Image Management', () => {
    test('should upload item image', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Find the item and click edit
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="edit-button"]').click()
      
      // Upload image
      const fileInput = page.locator('[data-testid="image-upload-input"]')
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })
      
      // Save changes
      await page.click('[data-testid="save-item-button"]')
      
      // Verify image was uploaded
      await page.waitForSelector('[data-testid="success-message"]')
    })

    test('should delete item image', async ({ page }) => {
      // First upload an image (from previous test)
      await createInventoryItem(page, testInventoryItem)
      await searchInventoryItem(page, testInventoryItem.sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${testInventoryItem.name}")`)
      await row.locator('[data-testid="edit-button"]').click()
      
      const fileInput = page.locator('[data-testid="image-upload-input"]')
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })
      await page.click('[data-testid="save-item-button"]')
      await page.waitForSelector('[data-testid="success-message"]')
      
      // Now delete the image
      await row.locator('[data-testid="edit-button"]').click()
      await page.click('[data-testid="delete-image-button"]')
      await page.click('[data-testid="save-item-button"]')
      
      // Verify image was deleted
      await page.waitForSelector('[data-testid="success-message"]')
    })
  })

  // Analytics and Reports
  test.describe('Analytics and Reports', () => {
    test('should display inventory overview', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Navigate to analytics
      await page.click('[data-testid="analytics-nav-link"]')
      await page.waitForURL('/analytics')
      
      // Verify overview metrics
      await expect(page.locator('[data-testid="total-items-metric"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-value-metric"]')).toBeVisible()
      await expect(page.locator('[data-testid="low-stock-metric"]')).toBeVisible()
    })

    test('should generate custom report', async ({ page }) => {
      await createInventoryItem(page, testInventoryItem)
      
      // Navigate to analytics
      await page.click('[data-testid="analytics-nav-link"]')
      await page.waitForURL('/analytics')
      
      // Generate custom report
      await page.click('[data-testid="generate-report-button"]')
      await page.selectOption('[data-testid="report-type-select"]', { label: 'Inventory Summary' })
      await page.fill('[data-testid="date-range-start"]', '2024-01-01')
      await page.fill('[data-testid="date-range-end"]', '2024-12-31')
      await page.click('[data-testid="generate-report-submit"]')
      
      // Verify report was generated
      await page.waitForSelector('[data-testid="report-generated"]')
    })
  })

  // Error Handling
  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/inventory/**', route => route.abort())
      
      await page.click('[data-testid="add-item-button"]')
      await page.waitForSelector('[data-testid="error-message"]')
      await expect(page.locator('[data-testid="error-message"]')).toContainText('network error')
    })

    test('should validate required fields', async ({ page }) => {
      await page.click('[data-testid="add-item-button"]')
      await page.click('[data-testid="save-item-button"]')
      
      // Verify validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="sku-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="category-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="location-error"]')).toBeVisible()
    })

    test('should handle duplicate SKU error', async ({ page }) => {
      // Create first item
      await createInventoryItem(page, testInventoryItem)
      
      // Try to create second item with same SKU
      await page.click('[data-testid="add-item-button"]')
      await page.fill('[data-testid="item-name-input"]', 'Different Name')
      await page.fill('[data-testid="item-sku-input"]', testInventoryItem.sku) // Same SKU
      await page.selectOption('[data-testid="category-select"]', { label: testInventoryItem.category })
      await page.selectOption('[data-testid="location-select"]', { label: testInventoryItem.location })
      await page.fill('[data-testid="price-input"]', '50.00')
      await page.fill('[data-testid="quantity-input"]', '10')
      await page.fill('[data-testid="min-stock-input"]', '2')
      await page.click('[data-testid="save-item-button"]')
      
      // Verify duplicate SKU error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('SKU already exists')
    })
  })

  // Performance Tests
  test.describe('Performance Tests', () => {
    test('should handle large inventory lists', async ({ page }) => {
      // Create multiple items to test pagination
      for (let i = 0; i < 25; i++) {
        const item = {
          ...testInventoryItem,
          name: `Performance Test Item ${i}`,
          sku: `PERF-${i.toString().padStart(3, '0')}`
        }
        await createInventoryItem(page, item)
      }
      
      // Test pagination
      await expect(page.locator('[data-testid="pagination-next"]')).toBeVisible()
      await page.click('[data-testid="pagination-next"]')
      await page.waitForTimeout(500)
      
      // Verify second page loaded
      await expect(page.locator('[data-testid="inventory-row"]')).toHaveCount.greaterThan(0)
    })

    test('should handle bulk operations efficiently', async ({ page }) => {
      // Create many items
      const items = []
      for (let i = 0; i < 10; i++) {
        const item = {
          ...testInventoryItem,
          name: `Bulk Test Item ${i}`,
          sku: `BULK-${i.toString().padStart(3, '0')}`
        }
        items.push(item)
        await createInventoryItem(page, item)
      }
      
      // Select all items
      await page.click('[data-testid="select-all-checkbox"]')
      
      // Perform bulk operation
      await page.click('[data-testid="bulk-operations-button"]')
      await page.waitForSelector('[data-testid="bulk-operations-modal"]')
      await page.click('[data-testid="update-operation-button"]')
      await page.selectOption('[data-testid="operation-type-select"]', { label: 'Status Change' })
      await page.selectOption('[data-testid="new-status-select"]', { label: 'Inactive' })
      await page.fill('[data-testid="operation-reason"]', 'Bulk status update test')
      await page.click('[data-testid="execute-bulk-operation"]')
      
      // Verify operation completed within reasonable time
      await page.waitForSelector('[data-testid="bulk-operation-success"]', { timeout: 10000 })
    })
  })
})

// Cleanup after all tests
test.afterAll(async ({ page }) => {
  // Clean up test data
  await loginAsAdmin(page)
  await navigateToInventory(page)
  
  // Delete test items
  const testSkus = ['TEST-001', 'BULK-001', 'BULK-002', 'CSV-001', 'CSV-002']
  for (const sku of testSkus) {
    try {
      await searchInventoryItem(page, sku)
      const row = page.locator(`[data-testid="inventory-row"]:has-text("${sku}")`)
      if (await row.isVisible()) {
        await row.locator('[data-testid="delete-button"]').click()
        await page.click('[data-testid="confirm-delete-button"]')
        await page.waitForTimeout(500)
      }
    } catch (error) {
      console.log(`Could not delete test item ${sku}:`, error)
    }
  }
})