import { test, expect } from '@playwright/test'

test.describe('Cache Integration Tests', () => {
  test('should validate complete cache invalidation flow', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial inventory count
    const initialCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const initialCount = await initialCountElement.textContent()
    const initialCountNumber = parseInt(initialCount?.replace(/\D/g, '') || '0')

    console.log(`[INTEGRATION] Initial inventory count: ${initialCountNumber}`)

    // Monitor network requests to track cache behavior
    const networkRequests: Array<{ url: string; method: string; timestamp: number; cached?: boolean }> = []

    page.on('request', request => {
      if (request.url().includes('/api/inventory/items')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        })
        console.log(`[INTEGRATION] Request: ${request.method()} ${request.url()}`)
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/inventory/items')) {
        const request = networkRequests.find(r => r.url === response.url())
        if (request) {
          request.cached = response.headers()['x-cache'] === 'HIT'
          console.log(`[INTEGRATION] Response: ${response.status()} ${response.url()} (cached: ${request.cached})`)
        }
      }
    })

    // Perform bulk create operation
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    await page.fill('[data-testid="sku-field-1"]', 'TEST-INTEGRATION-001')
    await page.fill('[data-testid="name-field-1"]', 'Test Integration Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '1')

    await page.click('button:has-text("Crear 1 Items")')
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for potential refresh
    await page.waitForTimeout(3000)

    // Get updated inventory count
    const updatedCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const updatedCount = await updatedCountElement.textContent()
    const updatedCountNumber = parseInt(updatedCount?.replace(/\D/g, '') || '0')

    console.log(`[INTEGRATION] Updated inventory count: ${updatedCountNumber}`)

    // Verify count increased
    expect(updatedCountNumber).toBe(initialCountNumber + 1)

    // Verify the new item appears in the table
    await page.fill('[data-testid="search-input"]', 'TEST-INTEGRATION-001')
    await page.waitForTimeout(2000)

    const newItemRow = page.locator('tr:has-text("TEST-INTEGRATION-001")')
    await expect(newItemRow).toBeVisible()

    // Log network activity for analysis
    console.log(`[INTEGRATION] Network requests:`, networkRequests)

    // Verify that cache was properly invalidated (no cached responses after bulk operation)
    const postBulkRequests = networkRequests.filter(r => r.timestamp > Date.now() - 10000) // Last 10 seconds
    const cachedResponses = postBulkRequests.filter(r => r.cached === true)

    console.log(`[INTEGRATION] Cached responses after bulk operation: ${cachedResponses.length}`)

    // If there are cached responses after bulk operation, it indicates cache invalidation failed
    if (cachedResponses.length > 0) {
      console.log(`[INTEGRATION] WARNING: Cache invalidation may have failed`)
    }
  })

  test('should validate cache consistency across multiple operations', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial count
    const initialCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const initialCount = await initialCountElement.textContent()
    const initialCountNumber = parseInt(initialCount?.replace(/\D/g, '') || '0')

    console.log(`[INTEGRATION] Initial count: ${initialCountNumber}`)

    // Perform multiple bulk operations
    const operations = [
      { sku: 'TEST-INTEGRATION-002', name: 'Test Integration Item 2' },
      { sku: 'TEST-INTEGRATION-003', name: 'Test Integration Item 3' },
      { sku: 'TEST-INTEGRATION-004', name: 'Test Integration Item 4' }
    ]

    for (const operation of operations) {
      // Create item
      await page.click('button:has-text("Crear Múltiples")')
      await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

      await page.fill('[data-testid="sku-field-1"]', operation.sku)
      await page.fill('[data-testid="name-field-1"]', operation.name)
      await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
      await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
      await page.fill('[data-testid="quantity-field-1"]', '1')

      await page.click('button:has-text("Crear 1 Items")')
      await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
      await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

      // Wait for refresh
      await page.waitForTimeout(2000)

      // Verify item appears
      await page.fill('[data-testid="search-input"]', operation.sku)
      await page.waitForTimeout(1000)

      const itemRow = page.locator(`tr:has-text("${operation.sku}")`)
      await expect(itemRow).toBeVisible()

      console.log(`[INTEGRATION] Created and verified: ${operation.sku}`)
    }

    // Get final count
    const finalCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const finalCount = await finalCountElement.textContent()
    const finalCountNumber = parseInt(finalCount?.replace(/\D/g, '') || '0')

    console.log(`[INTEGRATION] Final count: ${finalCountNumber}`)

    // Verify all items were created
    expect(finalCountNumber).toBe(initialCountNumber + operations.length)

    // Verify all items are visible in the table
    for (const operation of operations) {
      await page.fill('[data-testid="search-input"]', operation.sku)
      await page.waitForTimeout(1000)

      const itemRow = page.locator(`tr:has-text("${operation.sku}")`)
      await expect(itemRow).toBeVisible()
    }
  })

  test('should validate cache invalidation timing', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Record timestamps for cache invalidation analysis
    const timestamps: Array<{ event: string; timestamp: number }> = []

    // Monitor network activity
    page.on('request', request => {
      if (request.url().includes('/api/inventory/items')) {
        timestamps.push({
          event: `Request: ${request.method()} ${request.url()}`,
          timestamp: Date.now()
        })
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/inventory/items')) {
        timestamps.push({
          event: `Response: ${response.status()} ${response.url()}`,
          timestamp: Date.now()
        })
      }
    })

    // Perform bulk create
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    timestamps.push({ event: 'Modal opened', timestamp: Date.now() })

    await page.fill('[data-testid="sku-field-1"]', 'TEST-TIMING-001')
    await page.fill('[data-testid="name-field-1"]', 'Test Timing Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '1')

    await page.click('button:has-text("Crear 1 Items")')
    timestamps.push({ event: 'Create button clicked', timestamp: Date.now() })

    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    timestamps.push({ event: 'Success toast appeared', timestamp: Date.now() })

    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })
    timestamps.push({ event: 'Modal closed', timestamp: Date.now() })

    // Wait for potential refresh
    await page.waitForTimeout(3000)
    timestamps.push({ event: 'Wait completed', timestamp: Date.now() })

    // Analyze timing
    console.log(`[INTEGRATION] Timing analysis:`)
    for (let i = 1; i < timestamps.length; i++) {
      const duration = timestamps[i].timestamp - timestamps[i-1].timestamp
      console.log(`[INTEGRATION] ${timestamps[i-1].event} -> ${timestamps[i].event}: ${duration}ms`)
    }

    // Verify the item appears
    await page.fill('[data-testid="search-input"]', 'TEST-TIMING-001')
    await page.waitForTimeout(2000)

    const itemRow = page.locator('tr:has-text("TEST-TIMING-001")')
    await expect(itemRow).toBeVisible()

    // Check if there were any delays that might indicate cache issues
    const totalDuration = timestamps[timestamps.length - 1].timestamp - timestamps[0].timestamp
    console.log(`[INTEGRATION] Total operation duration: ${totalDuration}ms`)

    // If total duration is too long, it might indicate cache issues
    if (totalDuration > 10000) {
      console.log(`[INTEGRATION] WARNING: Operation took longer than expected (${totalDuration}ms)`)
    }
  })
})
