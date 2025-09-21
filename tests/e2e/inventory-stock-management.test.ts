/**
 * Inventory Stock Management Tests
 * Tests stock operations: add stock, subtract stock, stock alerts
 */

import { test, expect } from '@playwright/test'

test.describe('Inventory Stock Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should add stock to an inventory item', async ({ page }) => {
    // Find the first item with stock operations
    const firstRow = page.locator('tbody tr').first()
    
    // Get initial stock value
    const stockCell = firstRow.locator('td').nth(6) // Stock column
    const initialStockText = await stockCell.textContent()
    const initialStock = parseInt(initialStockText?.split(' ')[0] || '0')
    
    // Click "Add stock" button
    await firstRow.getByRole('button', { name: 'Add stock' }).click()
    
    // Fill in the quantity to add
    await page.fill('input[name="quantity"]', '5')
    await page.fill('textarea[name="notes"]', 'Test stock addition')
    
    // Submit the stock addition
    await page.getByRole('button', { name: 'Agregar Stock' }).click()
    
    // Verify success message
    await expect(page.getByText('Stock agregado exitosamente')).toBeVisible()
    
    // Verify stock increased
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const updatedStockCell = page.locator('tbody tr').first().locator('td').nth(6)
    const updatedStockText = await updatedStockCell.textContent()
    const updatedStock = parseInt(updatedStockText?.split(' ')[0] || '0')
    
    expect(updatedStock).toBe(initialStock + 5)
  })

  test('should subtract stock from an inventory item', async ({ page }) => {
    // Find an item with stock > 0
    const rows = page.locator('tbody tr')
    let targetRow = null
    
    for (let i = 0; i < await rows.count(); i++) {
      const row = rows.nth(i)
      const stockCell = row.locator('td').nth(6)
      const stockText = await stockCell.textContent()
      const stock = parseInt(stockText?.split(' ')[0] || '0')
      
      if (stock > 0) {
        targetRow = row
        break
      }
    }
    
    if (!targetRow) {
      test.skip('No items with stock > 0 found')
      return
    }
    
    // Get initial stock value
    const stockCell = targetRow.locator('td').nth(6)
    const initialStockText = await stockCell.textContent()
    const initialStock = parseInt(initialStockText?.split(' ')[0] || '0')
    
    // Click "Subtract stock" button
    await targetRow.getByRole('button', { name: 'Subtract stock' }).click()
    
    // Fill in the quantity to subtract
    await page.fill('input[name="quantity"]', '2')
    await page.fill('textarea[name="notes"]', 'Test stock subtraction')
    
    // Submit the stock subtraction
    await page.getByRole('button', { name: 'Restar Stock' }).click()
    
    // Verify success message
    await expect(page.getByText('Stock restado exitosamente')).toBeVisible()
    
    // Verify stock decreased
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const updatedStockCell = targetRow.locator('td').nth(6)
    const updatedStockText = await updatedStockCell.textContent()
    const updatedStock = parseInt(updatedStockText?.split(' ')[0] || '0')
    
    expect(updatedStock).toBe(Math.max(0, initialStock - 2))
  })

  test('should display stock status correctly', async ({ page }) => {
    // Check stock status indicators
    const rows = page.locator('tbody tr')
    
    for (let i = 0; i < await rows.count(); i++) {
      const row = rows.nth(i)
      const statusCell = row.locator('td').nth(7) // Status column
      const stockCell = row.locator('td').nth(6) // Stock column
      
      const statusText = await statusCell.textContent()
      const stockText = await stockCell.textContent()
      const stock = parseInt(stockText?.split(' ')[0] || '0')
      
      // Verify status matches stock level
      if (stock === 0) {
        expect(statusText).toContain('Out of Stock')
      } else if (stock > 0) {
        expect(statusText).toContain('In Stock')
      }
    }
  })

  test('should show low stock alerts', async ({ page }) => {
    // Check if there are any low stock items
    const lowStockButton = page.getByRole('button', { name: 'Low Stock' })
    await lowStockButton.click()
    
    // Verify low stock items are displayed
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      // Check that displayed items have low stock
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const stockCell = row.locator('td').nth(6)
        const stockText = await stockCell.textContent()
        const stock = parseInt(stockText?.split(' ')[0] || '0')
        
        // Low stock items should have stock > 0 but below minimum
        expect(stock).toBeGreaterThan(0)
      }
    }
  })

  test('should show out of stock items', async ({ page }) => {
    // Click "Out of Stock" filter
    await page.getByRole('button', { name: 'Out of Stock' }).click()
    
    // Verify out of stock items are displayed
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    if (rowCount > 0) {
      // Check that all displayed items are out of stock
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const stockCell = row.locator('td').nth(6)
        const statusCell = row.locator('td').nth(7)
        
        const stockText = await stockCell.textContent()
        const statusText = await statusCell.textContent()
        const stock = parseInt(stockText?.split(' ')[0] || '0')
        
        expect(stock).toBe(0)
        expect(statusText).toContain('Out of Stock')
      }
    }
  })

  test('should prevent negative stock', async ({ page }) => {
    // Find an item with stock = 0
    const rows = page.locator('tbody tr')
    let targetRow = null
    
    for (let i = 0; i < await rows.count(); i++) {
      const row = rows.nth(i)
      const stockCell = row.locator('td').nth(6)
      const stockText = await stockCell.textContent()
      const stock = parseInt(stockText?.split(' ')[0] || '0')
      
      if (stock === 0) {
        targetRow = row
        break
      }
    }
    
    if (!targetRow) {
      test.skip('No items with stock = 0 found')
      return
    }
    
    // Try to subtract stock from item with 0 stock
    await targetRow.getByRole('button', { name: 'Subtract stock' }).click()
    
    // Fill in quantity to subtract
    await page.fill('input[name="quantity"]', '5')
    
    // Submit the stock subtraction
    await page.getByRole('button', { name: 'Restar Stock' }).click()
    
    // Verify error message or that stock remains 0
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const stockCell = targetRow.locator('td').nth(6)
    const stockText = await stockCell.textContent()
    const stock = parseInt(stockText?.split(' ')[0] || '0')
    
    expect(stock).toBe(0)
  })
})
