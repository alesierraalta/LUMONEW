import { test, expect } from '@playwright/test'

test.describe('Dashboard Inventory Synchronization Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for dashboard to load - use actual selectors
    await page.waitForSelector('text=/\\d+ productos/', { timeout: 10000 })
  })

  test('should sync inventory data between dashboard and inventory page', async ({ page }) => {
    // Get initial inventory count from dashboard
    const dashboardInventoryElement = await page.locator('text=/\\d+ productos/').first()
    const dashboardInventoryText = await dashboardInventoryElement.textContent()
    const dashboardInventoryCount = parseInt(dashboardInventoryText?.match(/\d+/)?.[0] || '0')

    console.log(`Dashboard inventory count: ${dashboardInventoryCount}`)

    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="inventory-count"]', { timeout: 10000 })

    // Get inventory count from inventory page
    const inventoryPageTotalElement = await page.locator('#inv-stat-total span:last-child')
    const inventoryPageTotal = parseInt(await inventoryPageTotalElement.textContent() || '0')

    console.log(`Inventory page total: ${inventoryPageTotal}`)

    // The counts should be consistent
    expect(inventoryPageTotal).toBe(dashboardInventoryCount)

    // Create a new item via bulk create
    const testSku = `TEST-DASHBOARD-SYNC-${Date.now()}`
    
    // Click on bulk create button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Fill in the bulk create form
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test Dashboard Sync Item')
    
    // Select category and location
    await page.selectOption('select[name="category_id"]', { index: 1 })
    await page.selectOption('select[name="location_id"]', { index: 1 })
    
    await page.fill('input[placeholder*="Cantidad"]', '10')
    await page.fill('input[placeholder*="Precio"]', '99.99')

    // Submit the form
    await page.click('button:has-text("Crear")')
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Get updated inventory count from inventory page
    const updatedInventoryPageTotalElement = await page.locator('#inv-stat-total span:last-child')
    const updatedInventoryPageTotal = parseInt(await updatedInventoryPageTotalElement.textContent() || '0')

    console.log(`Updated inventory page total: ${updatedInventoryPageTotal}`)

    // Verify the count increased
    expect(updatedInventoryPageTotal).toBe(inventoryPageTotal + 1)

    // Navigate back to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Wait for dashboard to refresh

    // Get updated inventory count from dashboard
    const updatedDashboardInventoryElement = await page.locator('text=/\\d+ productos/').first()
    const updatedDashboardInventoryText = await updatedDashboardInventoryElement.textContent()
    const updatedDashboardInventoryCount = parseInt(updatedDashboardInventoryText?.match(/\d+/)?.[0] || '0')

    console.log(`Updated dashboard inventory count: ${updatedDashboardInventoryCount}`)

    // The dashboard should also reflect the updated count
    expect(updatedDashboardInventoryCount).toBe(updatedInventoryPageTotal)
  })

  test('should update dashboard metrics after bulk operations', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="inventory-count"]', { timeout: 10000 })

    // Create multiple items to test bulk operations
    const testSkus = [
      `TEST-BULK-1-${Date.now()}`,
      `TEST-BULK-2-${Date.now()}`,
      `TEST-BULK-3-${Date.now()}`
    ]

    for (const testSku of testSkus) {
      // Click on bulk create button
      await page.click('button:has-text("Crear Múltiples")')
      await page.waitForTimeout(2000)

      // Fill in the bulk create form
      await page.fill('input[placeholder*="SKU"]', testSku)
      await page.fill('input[placeholder*="Nombre"]', `Test Bulk Item ${testSku}`)
      
      // Select category and location
      await page.selectOption('select[name="category_id"]', { index: 1 })
      await page.selectOption('select[name="location_id"]', { index: 1 })
      
      await page.fill('input[placeholder*="Cantidad"]', '5')
      await page.fill('input[placeholder*="Precio"]', '50.00')

      // Submit the form
      await page.click('button:has-text("Crear")')
      await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
      await page.waitForTimeout(2000)
    }

    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check that dashboard shows the updated inventory count
    const dashboardInventoryElement = await page.locator('text=/\\d+ productos/').first()
    const dashboardInventoryText = await dashboardInventoryElement.textContent()
    const dashboardInventoryCount = parseInt(dashboardInventoryText?.match(/\d+/)?.[0] || '0')

    console.log(`Dashboard inventory count after bulk operations: ${dashboardInventoryCount}`)

    // Should have at least the 3 items we created
    expect(dashboardInventoryCount).toBeGreaterThanOrEqual(3)
  })

  test('should maintain real-time sync between dashboard and inventory page', async ({ page }) => {
    // Open dashboard in one tab and inventory in another
    const dashboardPage = page
    const inventoryPage = await page.context().newPage()

    // Load dashboard
    await dashboardPage.goto('/dashboard')
    await dashboardPage.waitForLoadState('networkidle')
    await dashboardPage.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 })

    // Load inventory page
    await inventoryPage.goto('/inventory')
    await inventoryPage.waitForLoadState('networkidle')
    await inventoryPage.waitForSelector('[data-testid="inventory-count"]', { timeout: 10000 })

    // Get initial counts from both pages
    const dashboardInventoryElement = await dashboardPage.locator('text=/\\d+ productos/').first()
    const dashboardInventoryText = await dashboardInventoryElement.textContent()
    const dashboardInventoryCount = parseInt(dashboardInventoryText?.match(/\d+/)?.[0] || '0')

    const inventoryPageTotalElement = await inventoryPage.locator('#inv-stat-total span:last-child')
    const inventoryPageTotal = parseInt(await inventoryPageTotalElement.textContent() || '0')

    console.log(`Initial dashboard count: ${dashboardInventoryCount}`)
    console.log(`Initial inventory page count: ${inventoryPageTotal}`)

    // Create an item on inventory page
    const testSku = `TEST-REALTIME-SYNC-${Date.now()}`
    
    await inventoryPage.click('button:has-text("Crear Múltiples")')
    await inventoryPage.waitForTimeout(2000)

    await inventoryPage.fill('input[placeholder*="SKU"]', testSku)
    await inventoryPage.fill('input[placeholder*="Nombre"]', 'Test Realtime Sync Item')
    
    await inventoryPage.selectOption('select[name="category_id"]', { index: 1 })
    await inventoryPage.selectOption('select[name="location_id"]', { index: 1 })
    
    await inventoryPage.fill('input[placeholder*="Cantidad"]', '10')
    await inventoryPage.fill('input[placeholder*="Precio"]', '99.99')

    await inventoryPage.click('button:has-text("Crear")')
    await inventoryPage.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await inventoryPage.waitForTimeout(3000)

    // Refresh dashboard to see if it updates
    await dashboardPage.reload()
    await dashboardPage.waitForLoadState('networkidle')
    await dashboardPage.waitForTimeout(3000)

    // Get updated count from dashboard
    const updatedDashboardInventoryElement = await dashboardPage.locator('text=/\\d+ productos/').first()
    const updatedDashboardInventoryText = await updatedDashboardInventoryElement.textContent()
    const updatedDashboardInventoryCount = parseInt(updatedDashboardInventoryText?.match(/\d+/)?.[0] || '0')

    console.log(`Updated dashboard count: ${updatedDashboardInventoryCount}`)

    // Dashboard should reflect the new item
    expect(updatedDashboardInventoryCount).toBe(dashboardInventoryCount + 1)

    // Close the inventory page
    await inventoryPage.close()
  })
})
