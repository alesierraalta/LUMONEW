import { test, expect } from '@playwright/test'

test.describe('Transaction Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  })

  test('should create a sale transaction from inventory', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    // Click on transaction button for first item
    await page.click('[data-testid="transaction-button"]:first-child')
    
    // Verify transaction modal opens
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible()
    await expect(page.locator('text=New Transaction')).toBeVisible()
    
    // Select transaction type
    await page.click('[data-testid="transaction-type-select"]')
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Enter transaction details
    const quantityInput = page.locator('[data-testid="transaction-quantity"]')
    await quantityInput.clear()
    await quantityInput.fill('2')
    
    const notesInput = page.locator('[data-testid="transaction-notes"]')
    await notesInput.fill('E2E test sale transaction')
    
    // Submit transaction
    await page.click('[data-testid="submit-transaction-button"]')
    
    // Verify success message
    await expect(page.locator('text=Transaction completed successfully')).toBeVisible({ timeout: 5000 })
    
    // Verify modal closes
    await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible()
  })

  test('should create a stock addition transaction', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    // Open transaction builder
    await page.click('[data-testid="new-transaction-button"]')
    
    // Verify transaction builder modal opens
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    await expect(page.locator('text=Transaction Builder')).toBeVisible()
    
    // Select stock addition type
    await page.click('[data-testid="transaction-type-stock-addition"]')
    
    // Search for item by SKU
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('TEST-001')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    // Wait for item to be found and added
    await expect(page.locator('[data-testid="transaction-item"]')).toBeVisible({ timeout: 5000 })
    
    // Verify item details are displayed
    await expect(page.locator('[data-testid="item-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="item-sku"]')).toContainText('TEST-001')
    
    // Update quantity
    const quantityInput = page.locator('[data-testid="item-quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('10')
    
    // Add transaction notes
    const notesInput = page.locator('[data-testid="transaction-notes"]')
    await notesInput.fill('Stock replenishment - E2E test')
    
    // Complete transaction
    await page.click('[data-testid="complete-transaction-button"]')
    
    // Verify success
    await expect(page.locator('text=Transaction completed successfully')).toBeVisible({ timeout: 5000 })
    
    // Verify modal closes
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).not.toBeVisible()
  })

  test('should handle multiple items in transaction', async ({ page }) => {
    // Navigate to inventory and open transaction builder
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    // Select sale transaction
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Add first item
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('TEST-001')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(1)
    
    // Clear input and add second item
    await skuInput.clear()
    await skuInput.fill('TEST-002')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    // Verify both items are in transaction
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(2)
    
    // Update quantities
    const quantityInputs = page.locator('[data-testid="item-quantity-input"]')
    await quantityInputs.nth(0).clear()
    await quantityInputs.nth(0).fill('2')
    
    await quantityInputs.nth(1).clear()
    await quantityInputs.nth(1).fill('3')
    
    // Verify subtotal calculation
    await expect(page.locator('[data-testid="transaction-subtotal"]')).toBeVisible()
    
    // Add tax
    const taxRateInput = page.locator('[data-testid="tax-rate-input"]')
    await taxRateInput.fill('8.5')
    
    // Verify tax calculation
    await expect(page.locator('[data-testid="transaction-tax"]')).toBeVisible()
    await expect(page.locator('[data-testid="transaction-total"]')).toBeVisible()
    
    // Complete transaction
    await page.click('[data-testid="complete-transaction-button"]')
    
    // Verify success
    await expect(page.locator('text=Transaction completed successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should remove item from transaction', async ({ page }) => {
    // Setup transaction with multiple items
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Add two items
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('TEST-001')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    await skuInput.clear()
    await skuInput.fill('TEST-002')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(2)
    
    // Remove first item
    await page.click('[data-testid="remove-item-button"]:first-child')
    
    // Verify item was removed
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(1)
    
    // Verify remaining item is correct
    await expect(page.locator('[data-testid="item-sku"]')).toContainText('TEST-002')
  })

  test('should validate stock availability for sales', async ({ page }) => {
    // Navigate to inventory and create sale transaction
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Add item
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('TEST-001')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(1)
    
    // Try to set quantity higher than available stock
    const quantityInput = page.locator('[data-testid="item-quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('9999') // Intentionally high number
    
    // Try to complete transaction
    await page.click('[data-testid="complete-transaction-button"]')
    
    // Verify validation error
    await expect(page.locator('[data-testid="stock-validation-error"]')).toBeVisible()
    await expect(page.locator('text=Insufficient stock')).toBeVisible()
    
    // Verify transaction is not completed
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
  })

  test('should handle item not found error', async ({ page }) => {
    // Navigate to transaction builder
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Search for non-existent SKU
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('NONEXISTENT-SKU')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    // Verify error message
    await expect(page.locator('[data-testid="item-not-found-error"]')).toBeVisible()
    await expect(page.locator('text=Item not found')).toBeVisible()
    
    // Verify no item was added
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(0)
  })

  test('should calculate tax correctly', async ({ page }) => {
    // Setup transaction
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Add item with known price
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('TEST-001')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(1)
    
    // Set quantity to 1 for easy calculation
    const quantityInput = page.locator('[data-testid="item-quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('1')
    
    // Get subtotal value
    const subtotalText = await page.locator('[data-testid="transaction-subtotal"]').textContent()
    const subtotal = parseFloat(subtotalText?.replace(/[^\\d.]/g, '') || '0')
    
    // Set tax rate to 10%
    const taxRateInput = page.locator('[data-testid="tax-rate-input"]')
    await taxRateInput.fill('10')
    
    // Verify tax calculation
    const expectedTax = subtotal * 0.10
    const expectedTotal = subtotal + expectedTax
    
    await expect(page.locator('[data-testid="transaction-tax"]')).toContainText(expectedTax.toFixed(2))
    await expect(page.locator('[data-testid="transaction-total"]')).toContainText(expectedTotal.toFixed(2))
  })

  test('should save transaction draft', async ({ page }) => {
    // Setup transaction
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Add item and set quantity
    const skuInput = page.locator('[data-testid="sku-search-input"]')
    await skuInput.fill('TEST-001')
    await page.press('[data-testid="sku-search-input"]', 'Enter')
    
    const quantityInput = page.locator('[data-testid="item-quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('2')
    
    // Save as draft
    await page.click('[data-testid="save-draft-button"]')
    
    // Verify draft saved message
    await expect(page.locator('text=Draft saved successfully')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).not.toBeVisible()
    
    // Reopen transaction builder
    await page.click('[data-testid="new-transaction-button"]')
    
    // Verify draft can be loaded
    await expect(page.locator('[data-testid="load-draft-button"]')).toBeVisible()
    await page.click('[data-testid="load-draft-button"]')
    
    // Verify draft data is restored
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="item-quantity-input"]')).toHaveValue('2')
  })

  test('should show transaction history', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('http://localhost:3000/transactions')
    await page.waitForSelector('[data-testid="transactions-table"]', { timeout: 10000 })
    
    // Verify transactions table
    await expect(page.locator('[data-testid="transactions-table"]')).toBeVisible()
    
    // Verify table headers
    await expect(page.locator('th:has-text("Date")')).toBeVisible()
    await expect(page.locator('th:has-text("Type")')).toBeVisible()
    await expect(page.locator('th:has-text("Total")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    
    // Check if transactions exist
    const transactionRows = page.locator('[data-testid="transaction-row"]')
    if (await transactionRows.count() > 0) {
      // Click on first transaction to view details
      await transactionRows.first().click()
      
      // Verify transaction details modal
      await expect(page.locator('[data-testid="transaction-details-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="transaction-items"]')).toBeVisible()
      
      // Close details modal
      await page.click('[data-testid="modal-close-button"]')
      await expect(page.locator('[data-testid="transaction-details-modal"]')).not.toBeVisible()
    }
  })

  test('should filter transactions by type', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('http://localhost:3000/transactions')
    await page.waitForSelector('[data-testid="transactions-table"]', { timeout: 10000 })
    
    // Get initial row count
    const initialRows = await page.locator('[data-testid="transaction-row"]').count()
    
    if (initialRows > 0) {
      // Apply type filter
      await page.click('[data-testid="transaction-type-filter"]')
      await page.click('[data-testid="filter-sale"]')
      
      // Wait for filter to apply
      await page.waitForTimeout(500)
      
      // Verify filtered results
      const filteredRows = await page.locator('[data-testid="transaction-row"]').count()
      expect(filteredRows).toBeLessThanOrEqual(initialRows)
      
      // Verify all visible transactions are sales
      const transactionTypes = await page.locator('[data-testid="transaction-type"]').allTextContents()
      transactionTypes.forEach(type => {
        expect(type.toLowerCase()).toContain('sale')
      })
      
      // Clear filter
      await page.click('[data-testid="transaction-type-filter"]')
      await page.click('[data-testid="filter-all"]')
    }
  })

  test('should filter transactions by date range', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('http://localhost:3000/transactions')
    await page.waitForSelector('[data-testid="transactions-table"]', { timeout: 10000 })
    
    const initialRows = await page.locator('[data-testid="transaction-row"]').count()
    
    if (initialRows > 0) {
      // Set date range filter
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7) // Last 7 days
      
      const endDate = new Date()
      
      await page.fill('[data-testid="start-date-filter"]', startDate.toISOString().split('T')[0])
      await page.fill('[data-testid="end-date-filter"]', endDate.toISOString().split('T')[0])
      
      // Apply filter
      await page.click('[data-testid="apply-date-filter"]')
      await page.waitForTimeout(500)
      
      // Verify filtered results
      const filteredRows = await page.locator('[data-testid="transaction-row"]').count()
      expect(filteredRows).toBeLessThanOrEqual(initialRows)
    }
  })

  test('should handle transaction cancellation', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('http://localhost:3000/transactions')
    await page.waitForSelector('[data-testid="transactions-table"]', { timeout: 10000 })
    
    const transactionRows = page.locator('[data-testid="transaction-row"]')
    if (await transactionRows.count() > 0) {
      // Find a completed transaction that can be cancelled
      const completedTransaction = transactionRows.filter({
        has: page.locator('[data-testid="transaction-status"]:has-text("completed")')
      }).first()
      
      if (await completedTransaction.isVisible()) {
        // Click cancel button
        await completedTransaction.locator('[data-testid="cancel-transaction-button"]').click()
        
        // Confirm cancellation
        await expect(page.locator('[data-testid="cancel-confirmation-modal"]')).toBeVisible()
        await page.fill('[data-testid="cancel-reason-input"]', 'E2E test cancellation')
        await page.click('[data-testid="confirm-cancel-button"]')
        
        // Verify cancellation success
        await expect(page.locator('text=Transaction cancelled successfully')).toBeVisible()
        
        // Verify status updated
        await expect(completedTransaction.locator('[data-testid="transaction-status"]')).toContainText('cancelled')
      }
    }
  })

  test('should export transaction data', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('http://localhost:3000/transactions')
    await page.waitForSelector('[data-testid="transactions-table"]', { timeout: 10000 })
    
    // Click export button
    const exportButton = page.locator('[data-testid="export-transactions-button"]')
    
    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      // Wait for download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/transactions.*\\.(csv|xlsx)/)
    }
  })

  test('should show transaction analytics', async ({ page }) => {
    // Navigate to transactions page
    await page.goto('http://localhost:3000/transactions')
    await page.waitForSelector('[data-testid="transactions-table"]', { timeout: 10000 })
    
    // Click analytics tab
    await page.click('[data-testid="analytics-tab"]')
    
    // Verify analytics interface
    await expect(page.locator('[data-testid="transaction-analytics"]')).toBeVisible()
    
    // Verify analytics cards
    await expect(page.locator('[data-testid="total-transactions-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-revenue-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="average-transaction-card"]')).toBeVisible()
    
    // Verify charts
    await expect(page.locator('[data-testid="transactions-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
  })

  test('should handle barcode scanning simulation', async ({ page }) => {
    // Navigate to transaction builder
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
    
    await page.click('[data-testid="new-transaction-button"]')
    await expect(page.locator('[data-testid="transaction-builder-modal"]')).toBeVisible()
    
    await page.click('[data-testid="transaction-type-sale"]')
    
    // Enable barcode mode
    await page.click('[data-testid="barcode-mode-toggle"]')
    
    // Verify barcode input is active
    await expect(page.locator('[data-testid="barcode-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="barcode-input"]')).toBeFocused()
    
    // Simulate barcode scan (rapid input)
    await page.fill('[data-testid="barcode-input"]', 'TEST-001')
    await page.press('[data-testid="barcode-input"]', 'Enter')
    
    // Verify item was added
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(1)
    
    // Scan another item
    await page.fill('[data-testid="barcode-input"]', 'TEST-002')
    await page.press('[data-testid="barcode-input"]', 'Enter')
    
    // Verify second item was added
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(2)
  })
})