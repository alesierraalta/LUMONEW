import { test, expect } from '@playwright/test'

test.describe('Inventory Management E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
    
    // Navigate to inventory section
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
  })

  test('should display inventory table with items', async ({ page }) => {
    // Verify inventory table is visible
    await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible()
    
    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("SKU")')).toBeVisible()
    await expect(page.locator('th:has-text("Category")')).toBeVisible()
    await expect(page.locator('th:has-text("Location")')).toBeVisible()
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible()
    await expect(page.locator('th:has-text("Price")')).toBeVisible()
    
    // Verify at least one inventory item is displayed
    await expect(page.locator('tbody tr')).toHaveCount.toBeGreaterThan(0)
  })

  test('should filter inventory items by search', async ({ page }) => {
    // Get initial row count
    const initialRows = await page.locator('tbody tr').count()
    
    // Search for a specific item
    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('test')
    await page.waitForTimeout(500) // Wait for debounced search
    
    // Verify filtered results
    const filteredRows = await page.locator('tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(initialRows)
    
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)
    
    // Verify all items are shown again
    const finalRows = await page.locator('tbody tr').count()
    expect(finalRows).toBe(initialRows)
  })

  test('should filter inventory by category', async ({ page }) => {
    // Open category filter dropdown
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    await categoryFilter.click()
    
    // Select a category
    await page.click('[data-testid="category-option"]:first-child')
    await page.waitForTimeout(500)
    
    // Verify filtered results
    await expect(page.locator('tbody tr')).toHaveCount.toBeGreaterThan(0)
    
    // Reset filter
    await categoryFilter.click()
    await page.click('text=All Categories')
  })

  test('should sort inventory items by different columns', async ({ page }) => {
    // Sort by name
    await page.click('th:has-text("Name")')
    await page.waitForTimeout(300)
    
    // Verify sorting (first item should be different)
    const firstItemAfterSort = await page.locator('tbody tr:first-child td:first-child').textContent()
    
    // Sort by name again (reverse order)
    await page.click('th:has-text("Name")')
    await page.waitForTimeout(300)
    
    const firstItemAfterReverseSort = await page.locator('tbody tr:first-child td:first-child').textContent()
    expect(firstItemAfterReverseSort).not.toBe(firstItemAfterSort)
  })

  test('should open and close quick stock modal', async ({ page }) => {
    // Click on first inventory item's stock adjustment button
    await page.click('[data-testid="quick-stock-button"]:first-child')
    
    // Verify modal is open
    await expect(page.locator('[data-testid="quick-stock-modal"]')).toBeVisible()
    await expect(page.locator('text=Quick Stock Adjustment')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    
    // Verify modal is closed
    await expect(page.locator('[data-testid="quick-stock-modal"]')).not.toBeVisible()
  })

  test('should perform quick stock adjustment', async ({ page }) => {
    // Get initial stock value
    const initialStock = await page.locator('tbody tr:first-child [data-testid="stock-quantity"]').textContent()
    
    // Open quick stock modal
    await page.click('[data-testid="quick-stock-button"]:first-child')
    await expect(page.locator('[data-testid="quick-stock-modal"]')).toBeVisible()
    
    // Adjust stock quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('5')
    
    // Add reason
    const reasonInput = page.locator('[data-testid="reason-input"]')
    await reasonInput.fill('E2E test stock adjustment')
    
    // Submit adjustment
    await page.click('[data-testid="submit-adjustment-button"]')
    
    // Wait for success message
    await expect(page.locator('text=Stock adjusted successfully')).toBeVisible({ timeout: 5000 })
    
    // Verify modal closes
    await expect(page.locator('[data-testid="quick-stock-modal"]')).not.toBeVisible()
    
    // Verify stock was updated (wait for table refresh)
    await page.waitForTimeout(1000)
    const updatedStock = await page.locator('tbody tr:first-child [data-testid="stock-quantity"]').textContent()
    expect(updatedStock).not.toBe(initialStock)
  })

  test('should navigate to item edit page', async ({ page }) => {
    // Click on first inventory item's edit button
    await page.click('[data-testid="edit-item-button"]:first-child')
    
    // Verify navigation to edit page
    await expect(page).toHaveURL(/.*\/inventory\/.*\/edit/)
    
    // Verify edit form is displayed
    await expect(page.locator('[data-testid="item-edit-form"]')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="sku"]')).toBeVisible()
  })

  test('should show low stock warning', async ({ page }) => {
    // Look for low stock indicators
    const lowStockItems = page.locator('[data-testid="low-stock-indicator"]')
    
    if (await lowStockItems.count() > 0) {
      // Verify low stock styling is applied
      await expect(lowStockItems.first()).toHaveClass(/low-stock|warning|alert/)
      
      // Verify tooltip or warning message
      await lowStockItems.first().hover()
      await expect(page.locator('text=Low stock')).toBeVisible({ timeout: 2000 })
    }
  })

  test('should handle pagination', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      const nextButton = page.locator('[data-testid="pagination-next"]')
      
      if (await nextButton.isEnabled()) {
        // Go to next page
        await nextButton.click()
        await page.waitForTimeout(500)
        
        // Verify URL changed
        await expect(page).toHaveURL(/.*page=2/)
        
        // Go back to first page
        const prevButton = page.locator('[data-testid="pagination-prev"]')
        await prevButton.click()
        await page.waitForTimeout(500)
        
        await expect(page).toHaveURL(/.*page=1/)
      }
    }
  })

  test('should export inventory data', async ({ page }) => {
    // Click export button
    const exportButton = page.locator('[data-testid="export-button"]')
    
    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      // Wait for download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/inventory.*\.(csv|xlsx)/)
    }
  })

  test('should show item details modal', async ({ page }) => {
    // Click on first inventory item
    await page.click('tbody tr:first-child td:first-child')
    
    // Verify item details modal opens
    await expect(page.locator('[data-testid="item-details-modal"]')).toBeVisible()
    
    // Verify item information is displayed
    await expect(page.locator('[data-testid="item-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="item-sku"]')).toBeVisible()
    await expect(page.locator('[data-testid="item-category"]')).toBeVisible()
    await expect(page.locator('[data-testid="item-location"]')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="item-details-modal"]')).not.toBeVisible()
  })

  test('should handle bulk operations', async ({ page }) => {
    // Select multiple items
    await page.click('tbody tr:first-child input[type="checkbox"]')
    await page.click('tbody tr:nth-child(2) input[type="checkbox"]')
    
    // Verify bulk actions are enabled
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
    
    // Test bulk status change
    const bulkStatusButton = page.locator('[data-testid="bulk-status-button"]')
    if (await bulkStatusButton.isVisible()) {
      await bulkStatusButton.click()
      
      // Select new status
      await page.click('[data-testid="status-option-active"]')
      
      // Confirm action
      await page.click('[data-testid="confirm-bulk-action"]')
      
      // Wait for success message
      await expect(page.locator('text=Bulk update completed')).toBeVisible({ timeout: 5000 })
    }
    
    // Deselect items
    await page.click('tbody tr:first-child input[type="checkbox"]')
    await page.click('tbody tr:nth-child(2) input[type="checkbox"]')
    
    // Verify bulk actions are hidden
    await expect(page.locator('[data-testid="bulk-actions"]')).not.toBeVisible()
  })

  test('should handle inventory alerts', async ({ page }) => {
    // Check for alert notifications
    const alertBadge = page.locator('[data-testid="alert-badge"]')
    
    if (await alertBadge.isVisible()) {
      // Click on alerts
      await alertBadge.click()
      
      // Verify alert panel opens
      await expect(page.locator('[data-testid="alerts-panel"]')).toBeVisible()
      
      // Verify alert items are displayed
      await expect(page.locator('[data-testid="alert-item"]')).toHaveCount.toBeGreaterThan(0)
      
      // Close alerts panel
      await page.click('[data-testid="close-alerts-panel"]')
      await expect(page.locator('[data-testid="alerts-panel"]')).not.toBeVisible()
    }
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate network error by intercepting requests
    await page.route('**/api/inventory**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Refresh page to trigger error
    await page.reload()
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Failed to load inventory')).toBeVisible()
    
    // Verify retry button is available
    const retryButton = page.locator('[data-testid="retry-button"]')
    if (await retryButton.isVisible()) {
      // Remove route intercept
      await page.unroute('**/api/inventory**')
      
      // Click retry
      await retryButton.click()
      
      // Verify data loads successfully
      await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should maintain state across navigation', async ({ page }) => {
    // Apply a filter
    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Navigate away and back
    await page.click('text=Dashboard')
    await page.waitForURL('**/dashboard')
    
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    
    // Verify filter is preserved
    await expect(searchInput).toHaveValue('test')
  })

  test('should show loading states', async ({ page }) => {
    // Intercept API request to add delay
    await page.route('**/api/inventory**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      route.continue()
    })
    
    // Refresh page
    await page.reload()
    
    // Verify loading indicator is shown
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for data to load
    await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible({ timeout: 10000 })
    
    // Verify loading indicator is hidden
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })
})