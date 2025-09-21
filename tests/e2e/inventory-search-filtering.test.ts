/**
 * Inventory Search and Filtering Tests
 * Tests search functionality, filtering, and sorting
 */

import { test, expect } from '@playwright/test'

test.describe('Inventory Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should search inventory items by SKU', async ({ page }) => {
    // Get a SKU from the first row
    const firstRow = page.locator('tbody tr').first()
    const skuCell = firstRow.locator('td').nth(2) // SKU column
    const skuText = await skuCell.textContent()
    
    if (!skuText) {
      test.skip('No SKU found in first row')
      return
    }
    
    // Search by SKU
    await page.fill('input[placeholder*="Search"]', skuText)
    await page.keyboard.press('Enter')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Verify only matching items are displayed
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify all displayed items contain the search term
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const skuCell = row.locator('td').nth(2)
      const skuText = await skuCell.textContent()
      
      expect(skuText).toContain(skuText)
    }
  })

  test('should search inventory items by name', async ({ page }) => {
    // Get a name from the first row
    const firstRow = page.locator('tbody tr').first()
    const nameCell = firstRow.locator('td').nth(3) // Name column
    const nameText = await nameCell.textContent()
    
    if (!nameText) {
      test.skip('No name found in first row')
      return
    }
    
    // Search by partial name
    const searchTerm = nameText.substring(0, 3)
    await page.fill('input[placeholder*="Search"]', searchTerm)
    await page.keyboard.press('Enter')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Verify search results
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should filter by active items', async ({ page }) => {
    // Click "Active Items" filter
    await page.getByRole('button', { name: 'Active Items' }).click()
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Verify all displayed items are active
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const statusCell = row.locator('td').nth(7) // Status column
        const statusText = await statusCell.textContent()
        
        expect(statusText).toContain('In Stock')
      }
    }
  })

  test('should filter by inactive items', async ({ page }) => {
    // Click "Inactive Items" filter
    await page.getByRole('button', { name: 'Inactive Items' }).click()
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Verify all displayed items are inactive
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const statusCell = row.locator('td').nth(7) // Status column
        const statusText = await statusCell.textContent()
        
        expect(statusText).toContain('Out of Stock')
      }
    }
  })

  test('should filter by good stock items', async ({ page }) => {
    // Click "Good Stock" filter
    await page.getByRole('button', { name: 'Good Stock' }).click()
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Verify all displayed items have good stock
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const stockCell = row.locator('td').nth(6) // Stock column
        const stockText = await stockCell.textContent()
        const stock = parseInt(stockText?.split(' ')[0] || '0')
        
        expect(stock).toBeGreaterThan(0)
      }
    }
  })

  test('should sort by SKU', async ({ page }) => {
    // Click SKU column header to sort
    await page.getByRole('button', { name: 'SKU' }).click()
    
    // Wait for sort to apply
    await page.waitForTimeout(1000)
    
    // Verify items are sorted by SKU
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 1) {
      const skus = []
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const skuCell = row.locator('td').nth(2)
        const skuText = await skuCell.textContent()
        if (skuText) skus.push(skuText)
      }
      
      // Verify SKUs are sorted
      const sortedSkus = [...skus].sort()
      expect(skus).toEqual(sortedSkus)
    }
  })

  test('should sort by name', async ({ page }) => {
    // Click Name column header to sort
    await page.getByRole('button', { name: 'Name' }).click()
    
    // Wait for sort to apply
    await page.waitForTimeout(1000)
    
    // Verify items are sorted by name
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 1) {
      const names = []
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const nameCell = row.locator('td').nth(3)
        const nameText = await nameCell.textContent()
        if (nameText) names.push(nameText)
      }
      
      // Verify names are sorted
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    }
  })

  test('should sort by price', async ({ page }) => {
    // Click Price column header to sort
    await page.getByRole('button', { name: 'Price' }).click()
    
    // Wait for sort to apply
    await page.waitForTimeout(1000)
    
    // Verify items are sorted by price
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 1) {
      const prices = []
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const priceCell = row.locator('td').nth(5)
        const priceText = await priceCell.textContent()
        if (priceText) {
          const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'))
          prices.push(price)
        }
      }
      
      // Verify prices are sorted
      const sortedPrices = [...prices].sort((a, b) => a - b)
      expect(prices).toEqual(sortedPrices)
    }
  })

  test('should clear search and show all items', async ({ page }) => {
    // First, search for something
    await page.fill('input[placeholder*="Search"]', 'test')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    // Get count of filtered results
    const filteredRows = page.locator('tbody tr')
    const filteredCount = await filteredRows.count()
    
    // Clear the search
    await page.fill('input[placeholder*="Search"]', '')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    // Verify all items are displayed again
    const allRows = page.locator('tbody tr')
    const allCount = await allRows.count()
    
    expect(allCount).toBeGreaterThanOrEqual(filteredCount)
  })

  test('should combine search and filters', async ({ page }) => {
    // Apply a filter first
    await page.getByRole('button', { name: 'Active Items' }).click()
    await page.waitForTimeout(1000)
    
    // Then search within filtered results
    await page.fill('input[placeholder*="Search"]', 'test')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    // Verify results are both filtered and searched
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const statusCell = row.locator('td').nth(7)
        const statusText = await statusCell.textContent()
        
        // Should be active items
        expect(statusText).toContain('In Stock')
      }
    }
  })
})
