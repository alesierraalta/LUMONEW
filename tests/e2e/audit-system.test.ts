/**
 * Audit System Tests
 * Tests audit logging, user validation, and audit trail functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Audit System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should log inventory creation in audit trail', async ({ page }) => {
    // Create a new inventory item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Fill in the form
    await page.fill('input[name="sku"]', 'AUDIT-TEST-001')
    await page.fill('input[name="name"]', 'Audit Test Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '99.99')
    await page.fill('input[name="quantity"]', '5')
    await page.fill('input[name="min_stock"]', '1')
    await page.fill('input[name="max_stock"]', '20')
    
    // Submit the form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for creation to complete
    await page.waitForTimeout(2000)
    
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Verify audit log entry for creation
    await expect(page.getByText('AUDIT-TEST-001')).toBeVisible()
    await expect(page.getByText('INSERT')).toBeVisible()
    await expect(page.getByText('inventory')).toBeVisible()
  })

  test('should log inventory updates in audit trail', async ({ page }) => {
    // Find and edit an existing item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Edit' }).click()
    
    // Update the name
    await page.fill('input[name="name"]', 'Updated Audit Test Product')
    
    // Submit the update
    await page.getByRole('button', { name: 'Actualizar Producto' }).click()
    
    // Wait for update to complete
    await page.waitForTimeout(2000)
    
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Verify audit log entry for update
    await expect(page.getByText('UPDATE')).toBeVisible()
    await expect(page.getByText('inventory')).toBeVisible()
    await expect(page.getByText('Updated Audit Test Product')).toBeVisible()
  })

  test('should log inventory deletion in audit trail', async ({ page }) => {
    // Get initial count
    const initialRows = page.locator('tbody tr')
    const initialCount = await initialRows.count()
    
    if (initialCount === 0) {
      test.skip('No items to delete')
      return
    }
    
    // Delete the first item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Delete' }).click()
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Confirmar' }).click()
    
    // Wait for deletion to complete
    await page.waitForTimeout(2000)
    
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Verify audit log entry for deletion
    await expect(page.getByText('DELETE')).toBeVisible()
    await expect(page.getByText('inventory')).toBeVisible()
  })

  test('should log stock operations in audit trail', async ({ page }) => {
    // Find an item with stock operations
    const firstRow = page.locator('tbody tr').first()
    
    // Add stock
    await firstRow.getByRole('button', { name: 'Add stock' }).click()
    await page.fill('input[name="quantity"]', '3')
    await page.fill('textarea[name="notes"]', 'Audit test stock addition')
    await page.getByRole('button', { name: 'Agregar Stock' }).click()
    
    // Wait for operation to complete
    await page.waitForTimeout(2000)
    
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Verify audit log entry for stock operation
    await expect(page.getByText('UPDATE')).toBeVisible()
    await expect(page.getByText('inventory')).toBeVisible()
    await expect(page.getByText('Audit test stock addition')).toBeVisible()
  })

  test('should display audit trail with proper formatting', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Verify audit trail table structure
    await expect(page.getByText('Operation')).toBeVisible()
    await expect(page.getByText('Table')).toBeVisible()
    await expect(page.getByText('Record ID')).toBeVisible()
    await expect(page.getByText('User')).toBeVisible()
    await expect(page.getByText('Timestamp')).toBeVisible()
    
    // Verify audit entries are displayed
    const auditRows = page.locator('tbody tr')
    const rowCount = await auditRows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should filter audit trail by operation type', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Look for filter options
    const insertFilter = page.getByRole('button', { name: 'INSERT' })
    const updateFilter = page.getByRole('button', { name: 'UPDATE' })
    const deleteFilter = page.getByRole('button', { name: 'DELETE' })
    
    if (await insertFilter.isVisible()) {
      // Filter by INSERT operations
      await insertFilter.click()
      
      // Verify only INSERT operations are shown
      const auditRows = page.locator('tbody tr')
      const rowCount = await auditRows.count()
      
      if (rowCount > 0) {
        for (let i = 0; i < rowCount; i++) {
          const row = auditRows.nth(i)
          const operationCell = row.locator('td').nth(0) // Assuming operation is first column
          const operationText = await operationCell.textContent()
          expect(operationText).toContain('INSERT')
        }
      }
    }
  })

  test('should filter audit trail by table name', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Look for table filter
    const inventoryFilter = page.getByRole('button', { name: 'inventory' })
    
    if (await inventoryFilter.isVisible()) {
      // Filter by inventory table
      await inventoryFilter.click()
      
      // Verify only inventory operations are shown
      const auditRows = page.locator('tbody tr')
      const rowCount = await auditRows.count()
      
      if (rowCount > 0) {
        for (let i = 0; i < rowCount; i++) {
          const row = auditRows.nth(i)
          const tableCell = row.locator('td').nth(1) // Assuming table is second column
          const tableText = await tableCell.textContent()
          expect(tableText).toContain('inventory')
        }
      }
    }
  })

  test('should search audit trail by record ID', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Get a record ID from the first audit entry
    const firstRow = page.locator('tbody tr').first()
    const recordIdCell = firstRow.locator('td').nth(2) // Assuming record ID is third column
    const recordIdText = await recordIdCell.textContent()
    
    if (recordIdText) {
      // Search by record ID
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill(recordIdText)
        await page.keyboard.press('Enter')
        
        // Wait for search results
        await page.waitForTimeout(1000)
        
        // Verify search results
        const auditRows = page.locator('tbody tr')
        const rowCount = await auditRows.count()
        
        if (rowCount > 0) {
          for (let i = 0; i < rowCount; i++) {
            const row = auditRows.nth(i)
            const recordIdCell = row.locator('td').nth(2)
            const cellText = await recordIdCell.textContent()
            expect(cellText).toContain(recordIdText)
          }
        }
      }
    }
  })

  test('should display audit trail with proper timestamps', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Verify timestamps are displayed and formatted correctly
    const auditRows = page.locator('tbody tr')
    const rowCount = await auditRows.count()
    
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 5); i++) { // Check first 5 rows
        const row = auditRows.nth(i)
        const timestampCell = row.locator('td').last() // Assuming timestamp is last column
        const timestampText = await timestampCell.textContent()
        
        // Verify timestamp format (should contain date and time)
        expect(timestampText).toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/)
      }
    }
  })

  test('should handle audit trail pagination', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' })
    const prevButton = page.getByRole('button', { name: 'Previous' })
    const pageNumbers = page.locator('[data-testid="page-number"]')
    
    if (await nextButton.isVisible()) {
      // Test pagination
      await nextButton.click()
      await page.waitForTimeout(1000)
      
      // Verify page changed
      const currentPage = page.locator('[data-testid="current-page"]')
      if (await currentPage.isVisible()) {
        const pageText = await currentPage.textContent()
        expect(pageText).toContain('2')
      }
      
      // Go back to previous page
      if (await prevButton.isVisible()) {
        await prevButton.click()
        await page.waitForTimeout(1000)
      }
    }
  })

  test('should export audit trail data', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría' }).click()
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download|descargar/i })
    
    if (await exportButton.isVisible()) {
      // Set up download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Click export button
      await exportButton.click()
      
      // Wait for download
      const download = await downloadPromise
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/audit|log|trail/)
    } else {
      test.skip('Export functionality not found')
    }
  })
})
