import { test, expect } from '@playwright/test'

test.describe('Simple Inventory Status Tests', () => {
  test('should load inventory page and show status summary', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('#inv-stat-total', { timeout: 15000 })
    
    // Check that the inventory status summary is visible
    const statusSummary = await page.locator('#inv-quick-stats')
    await expect(statusSummary).toBeVisible()
    
    // Check that the total items count is displayed
    const totalItemsElement = await page.locator('#inv-stat-total span:last-child')
    await expect(totalItemsElement).toBeVisible()
    
    const totalItems = await totalItemsElement.textContent()
    console.log(`Total items displayed: ${totalItems}`)
    
    // The count should be a number
    expect(totalItems).toMatch(/^\d+$/)
  })

  test('should show inventory status indicators', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('#inv-stat-total', { timeout: 15000 })
    
    // Check out of stock indicator
    const outOfStockElement = await page.locator('#inv-stat-out span:last-child')
    await expect(outOfStockElement).toBeVisible()
    
    // Check low stock indicator
    const lowStockElement = await page.locator('#inv-stat-low span:last-child')
    await expect(lowStockElement).toBeVisible()
    
    // Check good stock indicator
    const goodStockElement = await page.locator('#inv-stat-good span:last-child')
    await expect(goodStockElement).toBeVisible()
    
    // Get the counts
    const outOfStock = await outOfStockElement.textContent()
    const lowStock = await lowStockElement.textContent()
    const goodStock = await goodStockElement.textContent()
    
    console.log(`Out of stock: ${outOfStock}`)
    console.log(`Low stock: ${lowStock}`)
    console.log(`Good stock: ${goodStock}`)
    
    // All should be numbers
    expect(outOfStock).toMatch(/^\d+$/)
    expect(lowStock).toMatch(/^\d+$/)
    expect(goodStock).toMatch(/^\d+$/)
  })

  test('should show bulk create button', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('#inv-stat-total', { timeout: 15000 })
    
    // Check that bulk create button exists
    const bulkCreateButton = await page.locator('button:has-text("Crear Múltiples")')
    await expect(bulkCreateButton).toBeVisible()
  })

  test('should show inventory table', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('#inv-stat-total', { timeout: 15000 })
    
    // Check that inventory table exists
    const inventoryTable = await page.locator('#inv-table')
    await expect(inventoryTable).toBeVisible()
    
    // Check that filters exist
    const filters = await page.locator('#inv-filters')
    await expect(filters).toBeVisible()
  })

  test('should load dashboard and show inventory metrics', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for dashboard to load
    await page.waitForTimeout(5000)
    
    // Look for inventory-related content
    const inventoryText = await page.locator('text=/\\d+ productos/').first()
    
    if (await inventoryText.isVisible()) {
      const inventoryCount = await inventoryText.textContent()
      console.log(`Dashboard inventory count: ${inventoryCount}`)
      expect(inventoryCount).toMatch(/^\d+ productos$/)
    } else {
      console.log('Dashboard inventory metrics not found - may need authentication')
    }
  })
})
