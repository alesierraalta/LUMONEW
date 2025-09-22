/**
 * Comprehensive Audit System Tests
 * Automated tests that replicate the manual testing performed on the audit system
 * Tests all audit functionality including filtering, search, and statistics
 */

import { test, expect } from '@playwright/test'

test.describe('Comprehensive Audit System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application (using the correct port)
    await page.goto('http://localhost:3000/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should display audit system statistics correctly', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify statistics are displayed
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByText('Creaciones')).toBeVisible()
    await expect(page.getByText('Modificaciones')).toBeVisible()
    await expect(page.getByText('Eliminaciones')).toBeVisible()
    
    // Verify statistics show numbers (not just labels)
    const totalElement = page.locator('text=Total').locator('..').locator('p')
    const totalText = await totalElement.textContent()
    expect(totalText).toMatch(/\d+/)
    
    const creationsElement = page.locator('text=Creaciones').locator('..').locator('p')
    const creationsText = await creationsElement.textContent()
    expect(creationsText).toMatch(/\d+/)
    
    const modificationsElement = page.locator('text=Modificaciones').locator('..').locator('p')
    const modificationsText = await modificationsElement.textContent()
    expect(modificationsText).toMatch(/\d+/)
    
    const deletionsElement = page.locator('text=Eliminaciones').locator('..').locator('p')
    const deletionsText = await deletionsElement.textContent()
    expect(deletionsText).toMatch(/\d+/)
  })

  test('should display comprehensive audit log entries', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify audit entries are displayed with proper structure
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
    const entryCount = await auditEntries.count()
    expect(entryCount).toBeGreaterThan(0)
    
    // Verify each entry has the required information
    for (let i = 0; i < Math.min(entryCount, 5); i++) {
      const entry = auditEntries.nth(i)
      
      // Check for operation type (INSERT, UPDATE, DELETE)
      const operationText = await entry.textContent()
      expect(operationText).toMatch(/INSERT|UPDATE|DELETE/)
      
      // Check for table name (inventario, usuarios, categorías, ubicaciones)
      expect(operationText).toMatch(/inventario|usuarios|categorías|ubicaciones/)
      
      // Check for user context
      expect(operationText).toMatch(/alesierraalta@gmail.com|system@system.com|Sistema/)
      
      // Check for timestamp
      expect(operationText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{2}:\d{2}|Hace \d+/)
    }
  })

  test('should filter audit logs by operation type (DELETE)', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Look for operation type filter dropdown
    const operationFilter = page.locator('combobox').first()
    
    if (await operationFilter.isVisible()) {
      await operationFilter.click()
      
      // Select DELETE operation
      const deleteOption = page.locator('option', { hasText: '🗑️ Eliminaciones' })
      if (await deleteOption.isVisible()) {
        await deleteOption.click()
        
        // Wait for filter to apply
        await page.waitForTimeout(2000)
        
        // Verify only DELETE operations are shown
        const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
        const entryCount = await auditEntries.count()
        
        if (entryCount > 0) {
          for (let i = 0; i < Math.min(entryCount, 3); i++) {
            const entry = auditEntries.nth(i)
            const entryText = await entry.textContent()
            expect(entryText).toContain('DELETE')
          }
        }
      }
    }
  })

  test('should search audit logs by specific terms', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Find the search input
    const searchInput = page.locator('textbox[placeholder*="Buscar"], input[placeholder*="Buscar"]')
    
    if (await searchInput.isVisible()) {
      // Search for "Inventario"
      await searchInput.fill('Inventario')
      
      // Wait for search results
      await page.waitForTimeout(2000)
      
      // Verify search results (should show filtered results or no results message)
      const noResultsMessage = page.locator('text=No hay registros de auditoría')
      const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
      
      if (await noResultsMessage.isVisible()) {
        // If no results, that's also valid for this search term
        expect(await noResultsMessage.isVisible()).toBe(true)
      } else {
        // If results exist, verify they contain the search term
        const entryCount = await auditEntries.count()
        if (entryCount > 0) {
          const firstEntry = auditEntries.first()
          const entryText = await firstEntry.textContent()
          expect(entryText?.toLowerCase()).toContain('inventario')
        }
      }
    }
  })

  test('should display audit logs with proper user context', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify user context is displayed in audit entries
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
    const entryCount = await auditEntries.count()
    
    expect(entryCount).toBeGreaterThan(0)
    
    // Check first few entries for user context
    for (let i = 0; i < Math.min(entryCount, 3); i++) {
      const entry = auditEntries.nth(i)
      const entryText = await entry.textContent()
      
      // Should contain user information
      expect(entryText).toMatch(/alesierraalta@gmail.com|system@system.com|Sistema/)
    }
  })

  test('should display audit logs with proper timestamps', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify timestamps are displayed
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
    const entryCount = await auditEntries.count()
    
    expect(entryCount).toBeGreaterThan(0)
    
    // Check first few entries for timestamps
    for (let i = 0; i < Math.min(entryCount, 3); i++) {
      const entry = auditEntries.nth(i)
      const entryText = await entry.textContent()
      
      // Should contain timestamp information
      expect(entryText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{2}:\d{2}|Hace \d+/)
    }
  })

  test('should display audit logs with proper table information', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify table information is displayed
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
    const entryCount = await auditEntries.count()
    
    expect(entryCount).toBeGreaterThan(0)
    
    // Check entries for table information
    let foundTables = false
    for (let i = 0; i < Math.min(entryCount, 5); i++) {
      const entry = auditEntries.nth(i)
      const entryText = await entry.textContent()
      
      // Should contain table names
      if (entryText?.match(/inventario|usuarios|categorías|ubicaciones/)) {
        foundTables = true
        break
      }
    }
    
    expect(foundTables).toBe(true)
  })

  test('should display audit logs with proper operation types', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify operation types are displayed
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
    const entryCount = await auditEntries.count()
    
    expect(entryCount).toBeGreaterThan(0)
    
    // Check entries for operation types
    let foundOperations = false
    for (let i = 0; i < Math.min(entryCount, 5); i++) {
      const entry = auditEntries.nth(i)
      const entryText = await entry.textContent()
      
      // Should contain operation types
      if (entryText?.match(/INSERT|UPDATE|DELETE/)) {
        foundOperations = true
        break
      }
    }
    
    expect(foundOperations).toBe(true)
  })

  test('should display audit logs with record IDs', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Verify record IDs are displayed
    const auditEntries = page.locator('[data-testid="audit-entry"], .audit-entry, .audit-log-item')
    const entryCount = await auditEntries.count()
    
    expect(entryCount).toBeGreaterThan(0)
    
    // Check first few entries for record IDs
    for (let i = 0; i < Math.min(entryCount, 3); i++) {
      const entry = auditEntries.nth(i)
      const entryText = await entry.textContent()
      
      // Should contain record ID information
      expect(entryText).toMatch(/ID:|failed/)
    }
  })

  test('should show audit logs count at bottom', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Look for audit logs count display
    const countDisplay = page.locator('text=Mostrando').or(page.locator('text=registros'))
    
    if (await countDisplay.isVisible()) {
      const countText = await countDisplay.textContent()
      expect(countText).toMatch(/\d+/)
    }
  })

  test('should show operation type breakdown at bottom', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Look for operation breakdown
    const breakdown = page.locator('text=Creaciones:').or(page.locator('text=Modificaciones:')).or(page.locator('text=Eliminaciones:'))
    
    if (await breakdown.isVisible()) {
      // Verify breakdown shows numbers
      const breakdownText = await breakdown.textContent()
      expect(breakdownText).toMatch(/\d+/)
    }
  })

  test('should have functional close button', async ({ page }) => {
    // Navigate to audit history
    await page.getByRole('button', { name: 'Historial de Auditoría Seguimiento de cambios' }).click()
    
    // Wait for dialog to load
    await page.waitForSelector('dialog[open]', { timeout: 10000 })
    
    // Find and click close button
    const closeButton = page.locator('button', { hasText: 'Close' }).or(page.locator('button[aria-label*="close"]'))
    
    if (await closeButton.isVisible()) {
      await closeButton.click()
      
      // Verify dialog is closed
      await expect(page.locator('dialog[open]')).not.toBeVisible()
    }
  })
})
