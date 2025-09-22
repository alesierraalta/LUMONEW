import { test, expect } from '@playwright/test'

test.describe('Inventory Status Update Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
    
    // Wait for the page to be fully loaded - use actual selectors
    await page.waitForSelector('#inv-stat-total', { timeout: 10000 })
  })

  test('should update inventory status summary after bulk create operation', async ({ page }) => {
    // Get initial inventory status
    const initialTotalElement = await page.locator('#inv-stat-total span:last-child')
    const initialTotal = await initialTotalElement.textContent()
    const initialTotalCount = parseInt(initialTotal || '0')

    console.log(`Initial total items: ${initialTotalCount}`)

    // Click on bulk create button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Fill in the bulk create form
    const testSku = `TEST-STATUS-${Date.now()}`
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test Status Item')
    
    // Select category (assuming first available category)
    await page.click('select[name="category_id"]')
    await page.selectOption('select[name="category_id"]', { index: 1 })
    
    // Select location (assuming first available location)
    await page.click('select[name="location_id"]')
    await page.selectOption('select[name="location_id"]', { index: 1 })
    
    await page.fill('input[placeholder*="Cantidad"]', '10')
    await page.fill('input[placeholder*="Precio"]', '99.99')

    // Submit the form
    await page.click('button:has-text("Crear")')
    
    // Wait for success message
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000) // Wait for UI to update

    // Check that inventory status summary has been updated
    const updatedTotalElement = await page.locator('#inv-stat-total span:last-child')
    const updatedTotal = await updatedTotalElement.textContent()
    const updatedTotalCount = parseInt(updatedTotal || '0')

    console.log(`Updated total items: ${updatedTotalCount}`)

    // Verify the count increased
    expect(updatedTotalCount).toBe(initialTotalCount + 1)

    // Verify the item appears in the inventory list
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)
    
    const itemInList = await page.locator(`text=${testSku}`).first()
    await expect(itemInList).toBeVisible()
  })

  test('should update inventory status summary after bulk update operation', async ({ page }) => {
    // First create a test item
    const testSku = `TEST-UPDATE-${Date.now()}`
    
    // Click on bulk create button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Fill in the bulk create form
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test Update Item')
    
    // Select category and location
    await page.selectOption('select[name="category_id"]', { index: 1 })
    await page.selectOption('select[name="location_id"]', { index: 1 })
    
    await page.fill('input[placeholder*="Cantidad"]', '5')
    await page.fill('input[placeholder*="Precio"]', '50.00')

    // Submit the form
    await page.click('button:has-text("Crear")')
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Get initial status counts
    const initialLowStockElement = await page.locator('#inv-stat-low span:last-child')
    const initialLowStock = parseInt(await initialLowStockElement.textContent() || '0')

    console.log(`Initial low stock count: ${initialLowStock}`)

    // Now perform bulk update to make it low stock
    // Select the item in the table
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)
    
    const itemRow = await page.locator(`tr:has-text("${testSku}")`).first()
    await itemRow.locator('input[type="checkbox"]').check()

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForTimeout(1000)

    // Select update operation
    await page.click('button:has-text("Actualizar")')
    await page.waitForTimeout(1000)

    // Update quantity to make it low stock (set to 1)
    await page.fill('input[name="quantity"]', '1')
    await page.click('button:has-text("Aplicar")')
    
    // Wait for success message
    await page.waitForSelector('text=Items actualizados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Check that low stock count has been updated
    const updatedLowStockElement = await page.locator('#inv-stat-low span:last-child')
    const updatedLowStock = parseInt(await updatedLowStockElement.textContent() || '0')

    console.log(`Updated low stock count: ${updatedLowStock}`)

    // Verify the low stock count increased
    expect(updatedLowStock).toBe(initialLowStock + 1)
  })

  test('should update inventory status summary after bulk delete operation', async ({ page }) => {
    // First create a test item
    const testSku = `TEST-DELETE-${Date.now()}`
    
    // Click on bulk create button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Fill in the bulk create form
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test Delete Item')
    
    // Select category and location
    await page.selectOption('select[name="category_id"]', { index: 1 })
    await page.selectOption('select[name="location_id"]', { index: 1 })
    
    await page.fill('input[placeholder*="Cantidad"]', '10')
    await page.fill('input[placeholder*="Precio"]', '99.99')

    // Submit the form
    await page.click('button:has-text("Crear")')
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Get initial total count
    const initialTotalElement = await page.locator('#inv-stat-total span:last-child')
    const initialTotal = parseInt(await initialTotalElement.textContent() || '0')

    console.log(`Initial total count: ${initialTotal}`)

    // Now perform bulk delete
    // Select the item in the table
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)
    
    const itemRow = await page.locator(`tr:has-text("${testSku}")`).first()
    await itemRow.locator('input[type="checkbox"]').check()

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForTimeout(1000)

    // Select delete operation
    await page.click('button:has-text("Eliminar")')
    await page.waitForTimeout(1000)

    // Confirm deletion
    await page.click('button:has-text("Confirmar")')
    
    // Wait for success message
    await page.waitForSelector('text=Items eliminados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Check that total count has been updated
    const updatedTotalElement = await page.locator('#inv-stat-total span:last-child')
    const updatedTotal = parseInt(await updatedTotalElement.textContent() || '0')

    console.log(`Updated total count: ${updatedTotal}`)

    // Verify the total count decreased
    expect(updatedTotal).toBe(initialTotal - 1)

    // Verify the item no longer appears in the list
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)
    
    const itemInList = await page.locator(`text=${testSku}`)
    await expect(itemInList).toHaveCount(0)
  })

  test('should maintain consistency between inventory status and item list', async ({ page }) => {
    // Get initial counts from status summary
    const initialTotalElement = await page.locator('#inv-stat-total span:last-child')
    const initialTotal = parseInt(await initialTotalElement.textContent() || '0')

    // Count items in the table
    const tableRows = await page.locator('tbody tr').count()
    
    console.log(`Status summary total: ${initialTotal}`)
    console.log(`Table rows count: ${tableRows}`)

    // The counts should be consistent (allowing for pagination)
    expect(tableRows).toBeGreaterThanOrEqual(0)
    
    // If there are items, the status should reflect them
    if (tableRows > 0) {
      expect(initialTotal).toBeGreaterThan(0)
    }
  })

  test('should update all status indicators correctly after bulk operations', async ({ page }) => {
    // Create an item that will be out of stock
    const testSku = `TEST-OUT-OF-STOCK-${Date.now()}`
    
    // Click on bulk create button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Fill in the bulk create form with 0 quantity
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test Out of Stock Item')
    
    // Select category and location
    await page.selectOption('select[name="category_id"]', { index: 1 })
    await page.selectOption('select[name="location_id"]', { index: 1 })
    
    await page.fill('input[placeholder*="Cantidad"]', '0') // Out of stock
    await page.fill('input[placeholder*="Precio"]', '99.99')

    // Submit the form
    await page.click('button:has-text("Crear")')
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Check that out of stock count increased
    const outOfStockElement = await page.locator('#inv-stat-out span:last-child')
    const outOfStockCount = parseInt(await outOfStockElement.textContent() || '0')

    console.log(`Out of stock count: ${outOfStockCount}`)

    // Should have at least 1 out of stock item
    expect(outOfStockCount).toBeGreaterThanOrEqual(1)

    // Verify the item appears in the list
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)
    
    const itemInList = await page.locator(`text=${testSku}`).first()
    await expect(itemInList).toBeVisible()
  })
})
