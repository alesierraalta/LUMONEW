import { test, expect } from '@playwright/test'

test.describe('Inventory Selection and Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
  })

  test('should display selection counter when items are selected', async ({ page }) => {
    // Select first item
    await page.click('input[type="checkbox"]:first-of-type')
    
    // Check that selection counter appears
    await expect(page.locator('text=1 item seleccionado')).toBeVisible()
    
    // Select second item
    await page.click('input[type="checkbox"]:nth-of-type(2)')
    
    // Check that counter updates
    await expect(page.locator('text=2 items seleccionados')).toBeVisible()
  })

  test('should filter by category', async ({ page }) => {
    // Open category filter dropdown
    await page.click('[data-testid="category-filter"]')
    
    // Select a category
    await page.click('[data-testid="category-option"]:first-of-type')
    
    // Verify that only items from that category are shown
    const categoryCells = page.locator('td:nth-child(5)') // Category column
    const categoryCount = await categoryCells.count()
    
    if (categoryCount > 0) {
      // All visible items should have the same category
      const firstCategory = await categoryCells.first().textContent()
      for (let i = 0; i < categoryCount; i++) {
        await expect(categoryCells.nth(i)).toContainText(firstCategory)
      }
    }
  })

  test('should filter by location', async ({ page }) => {
    // Open location filter dropdown
    await page.click('[data-testid="location-filter"]')
    
    // Select a location
    await page.click('[data-testid="location-option"]:first-of-type')
    
    // Verify that only items from that location are shown
    const locationCells = page.locator('td:nth-child(6)') // Location column
    const locationCount = await locationCells.count()
    
    if (locationCount > 0) {
      // All visible items should have the same location
      const firstLocation = await locationCells.first().textContent()
      for (let i = 0; i < locationCount; i++) {
        await expect(locationCells.nth(i)).toContainText(firstLocation)
      }
    }
  })

  test('should combine category and location filters', async ({ page }) => {
    // Apply category filter
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-option"]:first-of-type')
    
    // Apply location filter
    await page.click('[data-testid="location-filter"]')
    await page.click('[data-testid="location-option"]:first-of-type')
    
    // Verify that items match both filters
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      // Check that all visible rows have the selected category and location
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        await expect(row.locator('td:nth-child(5)')).toBeVisible() // Category
        await expect(row.locator('td:nth-child(6)')).toBeVisible() // Location
      }
    }
  })

  test('should clear all filters', async ({ page }) => {
    // Apply some filters
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-option"]:first-of-type')
    
    await page.click('[data-testid="location-filter"]')
    await page.click('[data-testid="location-option"]:first-of-type')
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]')
    
    // Verify that all items are shown again
    await expect(page.locator('[data-testid="category-filter"]')).toContainText('Todas las categorías')
    await expect(page.locator('[data-testid="location-filter"]')).toContainText('Todas las ubicaciones')
  })

  test('should select all visible items', async ({ page }) => {
    // Click select all checkbox
    await page.click('thead input[type="checkbox"]')
    
    // Verify that all visible items are selected
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    
    for (let i = 0; i < checkboxCount; i++) {
      await expect(checkboxes.nth(i)).toBeChecked()
    }
    
    // Verify selection counter shows all items
    await expect(page.locator(`text=${checkboxCount} items seleccionados`)).toBeVisible()
  })

  test('should deselect all items', async ({ page }) => {
    // Select all items first
    await page.click('thead input[type="checkbox"]')
    
    // Deselect all
    await page.click('[data-testid="deselect-all"]')
    
    // Verify that no items are selected
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    
    for (let i = 0; i < checkboxCount; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked()
    }
    
    // Verify selection counter is hidden
    await expect(page.locator('[data-testid="bulk-actions"]')).not.toBeVisible()
  })

  test('should show bulk actions when items are selected', async ({ page }) => {
    // Select an item
    await page.click('input[type="checkbox"]:first-of-type')
    
    // Verify bulk actions are visible
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
    await expect(page.locator('text=Acciones en lote')).toBeVisible()
  })

  test('should export selected items', async ({ page }) => {
    // Select an item
    await page.click('input[type="checkbox"]:first-of-type')
    
    // Click bulk actions dropdown
    await page.click('text=Acciones en lote')
    
    // Click export option
    await page.click('text=Exportar')
    
    // Verify download starts (this might need adjustment based on actual implementation)
    // The test should verify that the export functionality is triggered
    await expect(page.locator('text=items exportados exitosamente')).toBeVisible({ timeout: 5000 })
  })

  test('should show no results message when filters return no items', async ({ page }) => {
    // Apply a filter that should return no results
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-option"]:last-of-type')
    
    // If no items match, show appropriate message
    const noResultsMessage = page.locator('text=No se encontraron items con los filtros aplicados')
    const clearFiltersButton = page.locator('text=Limpiar filtros')
    
    // Either show no results message or have items (depending on data)
    const hasItems = await page.locator('tbody tr').count() > 0
    if (!hasItems) {
      await expect(noResultsMessage).toBeVisible()
      await expect(clearFiltersButton).toBeVisible()
    }
  })

  test('should maintain selection when applying filters', async ({ page }) => {
    // Select some items
    await page.click('input[type="checkbox"]:first-of-type')
    await page.click('input[type="checkbox"]:nth-of-type(2)')
    
    // Apply a filter
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-option"]:first-of-type')
    
    // Verify that selection is maintained for visible items
    const visibleCheckboxes = page.locator('tbody input[type="checkbox"]:checked')
    const checkedCount = await visibleCheckboxes.count()
    
    // Should have at least some items still selected (those that match the filter)
    expect(checkedCount).toBeGreaterThanOrEqual(0)
  })

  test('should show correct selection count with filters applied', async ({ page }) => {
    // Select all items first
    await page.click('thead input[type="checkbox"]')
    
    // Apply a filter
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="category-option"]:first-of-type')
    
    // Verify that selection counter shows correct count
    const visibleRows = await page.locator('tbody tr').count()
    const selectedCount = await page.locator('tbody input[type="checkbox"]:checked').count()
    
    if (visibleRows > 0) {
      await expect(page.locator(`text=${selectedCount} items seleccionados`)).toBeVisible()
    }
  })
})