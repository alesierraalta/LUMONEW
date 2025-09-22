import { test, expect } from '@playwright/test'

test.describe('Simple Bulk Operations Test', () => {
  test('should test bulk create with real selectors', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial inventory count by looking for the count text
    const countText = await page.textContent('text=/\\d+ productos/')
    const initialCount = parseInt(countText?.match(/\d+/)?.[0] || '0')
    
    console.log(`Initial inventory count: ${initialCount}`)

    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000) // Wait for modal to open

    // Fill in the item data
    await page.fill('input[placeholder*="SKU"]', 'TEST-SIMPLE-001')
    await page.fill('input[placeholder*="Nombre"]', 'Test Simple Item')
    
    // Select category
    await page.click('select, [role="combobox"]')
    await page.selectOption('select, [role="combobox"]', { label: 'Electronics' })
    
    // Select location
    await page.click('select, [role="combobox"]:nth-of-type(2)')
    await page.selectOption('select, [role="combobox"]:nth-of-type(2)', { label: 'Main Warehouse' })
    
    // Set quantity
    await page.fill('input[type="number"], input[placeholder*="Cantidad"]', '1')

    // Click create button
    await page.click('button:has-text("Crear 1 Items")')
    
    // Wait for success toast
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForTimeout(3000)

    // Get updated inventory count
    const updatedCountText = await page.textContent('text=/\\d+ productos/')
    const updatedCount = parseInt(updatedCountText?.match(/\d+/)?.[0] || '0')
    
    console.log(`Updated inventory count: ${updatedCount}`)

    // Verify count increased
    expect(updatedCount).toBe(initialCount + 1)

    // Search for the new item
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', 'TEST-SIMPLE-001')
    await page.waitForTimeout(2000)

    // Verify the new item appears in the table
    const newItemRow = page.locator('tr:has-text("TEST-SIMPLE-001")')
    await expect(newItemRow).toBeVisible()
  })

  test('should test cache invalidation by checking network requests', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Monitor network requests
    const requests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/inventory/items')) {
        requests.push(`[${new Date().toISOString()}] ${request.method()} ${request.url()}`)
        console.log(`API Request: ${request.method()} ${request.url()}`)
      }
    })

    // Perform bulk create
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    await page.fill('input[placeholder*="SKU"]', 'TEST-CACHE-001')
    await page.fill('input[placeholder*="Nombre"]', 'Test Cache Item')
    await page.selectOption('select, [role="combobox"]', { label: 'Electronics' })
    await page.selectOption('select, [role="combobox"]:nth-of-type(2)', { label: 'Main Warehouse' })
    await page.fill('input[type="number"], input[placeholder*="Cantidad"]', '1')

    await page.click('button:has-text("Crear 1 Items")')
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // Log network activity
    console.log('Network requests:', requests)

    // Verify the item appears
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', 'TEST-CACHE-001')
    await page.waitForTimeout(2000)

    const itemRow = page.locator('tr:has-text("TEST-CACHE-001")')
    await expect(itemRow).toBeVisible()
  })

  test('should test multiple bulk operations', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial count
    const countText = await page.textContent('text=/\\d+ productos/')
    const initialCount = parseInt(countText?.match(/\d+/)?.[0] || '0')

    // Perform multiple bulk creates
    const items = [
      { sku: 'TEST-MULTI-001', name: 'Test Multi Item 1' },
      { sku: 'TEST-MULTI-002', name: 'Test Multi Item 2' },
      { sku: 'TEST-MULTI-003', name: 'Test Multi Item 3' }
    ]

    for (const item of items) {
      await page.click('button:has-text("Crear Múltiples")')
      await page.waitForTimeout(2000)

      await page.fill('input[placeholder*="SKU"]', item.sku)
      await page.fill('input[placeholder*="Nombre"]', item.name)
      await page.selectOption('select, [role="combobox"]', { label: 'Electronics' })
      await page.selectOption('select, [role="combobox"]:nth-of-type(2)', { label: 'Main Warehouse' })
      await page.fill('input[type="number"], input[placeholder*="Cantidad"]', '1')

      await page.click('button:has-text("Crear 1 Items")')
      await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
      await page.waitForTimeout(2000)

      // Verify item appears
      await page.fill('input[placeholder*="Buscar"], input[type="search"]', item.sku)
      await page.waitForTimeout(1000)

      const itemRow = page.locator(`tr:has-text("${item.sku}")`)
      await expect(itemRow).toBeVisible()

      console.log(`Created and verified: ${item.sku}`)
    }

    // Get final count
    const finalCountText = await page.textContent('text=/\\d+ productos/')
    const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0')

    // Verify all items were created
    expect(finalCount).toBe(initialCount + items.length)
  })
})
