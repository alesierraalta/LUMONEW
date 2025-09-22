import { test, expect } from '@playwright/test'

test.describe('Cache Synchronization Debug', () => {
  test('should debug cache invalidation timing', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`[${msg.type()}] ${msg.text()}`)
      }
    })

    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial inventory count
    const initialCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const initialCount = await initialCountElement.textContent()
    const initialCountNumber = parseInt(initialCount?.replace(/\D/g, '') || '0')

    console.log(`[DEBUG] Initial inventory count: ${initialCountNumber}`)

    // Monitor network requests
    const requests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/inventory/items')) {
        requests.push(`[${new Date().toISOString()}] ${request.method()} ${request.url()}`)
        console.log(`[DEBUG] API Request: ${request.method()} ${request.url()}`)
      }
    })

    // Monitor network responses
    const responses: string[] = []
    page.on('response', response => {
      if (response.url().includes('/api/inventory/items')) {
        responses.push(`[${new Date().toISOString()}] ${response.status()} ${response.url()}`)
        console.log(`[DEBUG] API Response: ${response.status()} ${response.url()}`)
      }
    })

    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    console.log(`[DEBUG] Bulk create modal opened`)

    // Fill in the item
    await page.fill('[data-testid="sku-field-1"]', 'TEST-DEBUG-001')
    await page.fill('[data-testid="name-field-1"]', 'Test Debug Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '1')

    console.log(`[DEBUG] Form filled, clicking create button`)

    // Click create button
    await page.click('button:has-text("Crear 1 Items")')

    console.log(`[DEBUG] Create button clicked, waiting for response`)

    // Wait for success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    console.log(`[DEBUG] Success toast appeared`)

    // Wait for modal to close
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })
    console.log(`[DEBUG] Modal closed`)

    // Wait for potential refresh
    await page.waitForTimeout(3000)
    console.log(`[DEBUG] Waited 3 seconds for refresh`)

    // Get updated inventory count
    const updatedCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const updatedCount = await updatedCountElement.textContent()
    const updatedCountNumber = parseInt(updatedCount?.replace(/\D/g, '') || '0')

    console.log(`[DEBUG] Updated inventory count: ${updatedCountNumber}`)
    console.log(`[DEBUG] Count difference: ${updatedCountNumber - initialCountNumber}`)

    // Log all network activity
    console.log(`[DEBUG] Network Requests:`, requests)
    console.log(`[DEBUG] Network Responses:`, responses)

    // Search for the new item
    await page.fill('[data-testid="search-input"]', 'TEST-DEBUG-001')
    await page.waitForTimeout(2000)

    // Check if item appears in table
    const itemRow = page.locator('tr:has-text("TEST-DEBUG-001")')
    const isVisible = await itemRow.isVisible()

    console.log(`[DEBUG] Item visible in table: ${isVisible}`)

    if (!isVisible) {
      // Debug: Check what's actually in the table
      const tableRows = await page.locator('tbody tr').count()
      console.log(`[DEBUG] Total table rows: ${tableRows}`)

      // Get all SKUs in the table
      const skus = await page.locator('tbody tr td:first-child').allTextContents()
      console.log(`[DEBUG] All SKUs in table:`, skus)

      // Check if there are any items with "TEST" in the name
      const testItems = await page.locator('tbody tr:has-text("TEST")').count()
      console.log(`[DEBUG] Items with "TEST" in name: ${testItems}`)
    }

    // Verify the item was created (this will fail if there's a problem)
    expect(isVisible).toBe(true)
  })

  test('should debug API cache behavior', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Monitor all API calls
    const apiCalls: Array<{ url: string; method: string; timestamp: number; response?: any }> = []

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        })
      }
    })

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const call = apiCalls.find(c => c.url === response.url() && c.timestamp <= Date.now())
        if (call) {
          try {
            call.response = await response.json()
          } catch (e) {
            call.response = await response.text()
          }
        }
      }
    })

    // Make a bulk create operation
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    await page.fill('[data-testid="sku-field-1"]', 'TEST-CACHE-DEBUG-001')
    await page.fill('[data-testid="name-field-1"]', 'Test Cache Debug Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '1')

    await page.click('button:has-text("Crear 1 Items")')
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for potential refresh
    await page.waitForTimeout(3000)

    // Log all API calls
    console.log(`[DEBUG] API Calls made:`, apiCalls.map(call => ({
      url: call.url,
      method: call.method,
      timestamp: new Date(call.timestamp).toISOString(),
      hasResponse: !!call.response
    })))

    // Check if there were multiple calls to the same endpoint
    const inventoryCalls = apiCalls.filter(call => call.url.includes('/api/inventory/items'))
    console.log(`[DEBUG] Inventory API calls: ${inventoryCalls.length}`)

    if (inventoryCalls.length > 1) {
      console.log(`[DEBUG] Multiple inventory calls detected - possible cache issue`)
    }

    // Verify the operation
    await page.fill('[data-testid="search-input"]', 'TEST-CACHE-DEBUG-001')
    await page.waitForTimeout(2000)

    const itemRow = page.locator('tr:has-text("TEST-CACHE-DEBUG-001")')
    const isVisible = await itemRow.isVisible()

    console.log(`[DEBUG] Item visible after cache debug: ${isVisible}`)

    expect(isVisible).toBe(true)
  })

  test('should debug frontend state management', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Inject debugging code to monitor React state
    await page.addInitScript(() => {
      // Override console.log to capture React state changes
      const originalLog = console.log
      console.log = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
          originalLog('[REACT DEBUG]', ...args)
        }
        originalLog(...args)
      }
    })

    // Get initial state
    const initialCount = await page.locator('[data-testid="inventory-count"]').first().textContent()
    console.log(`[DEBUG] Initial count: ${initialCount}`)

    // Make bulk create operation
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    await page.fill('[data-testid="sku-field-1"]', 'TEST-STATE-DEBUG-001')
    await page.fill('[data-testid="name-field-1"]', 'Test State Debug Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '1')

    await page.click('button:has-text("Crear 1 Items")')
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Monitor state changes
    await page.waitForTimeout(2000)

    // Check if count updated
    const updatedCount = await page.locator('[data-testid="inventory-count"]').first().textContent()
    console.log(`[DEBUG] Updated count: ${updatedCount}`)

    // Check if item appears
    await page.fill('[data-testid="search-input"]', 'TEST-STATE-DEBUG-001')
    await page.waitForTimeout(2000)

    const itemRow = page.locator('tr:has-text("TEST-STATE-DEBUG-001")')
    const isVisible = await itemRow.isVisible()

    console.log(`[DEBUG] Item visible: ${isVisible}`)

    // If not visible, check what's in the table
    if (!isVisible) {
      const allRows = await page.locator('tbody tr').count()
      console.log(`[DEBUG] Total rows in table: ${allRows}`)

      // Get all visible text in the table
      const tableText = await page.locator('tbody').textContent()
      console.log(`[DEBUG] Table content:`, tableText)
    }

    expect(isVisible).toBe(true)
  })
})
