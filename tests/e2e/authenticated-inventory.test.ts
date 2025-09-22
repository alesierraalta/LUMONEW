/**
 * Authenticated Inventory Tests
 * Tests that require user authentication
 */

import { test, expect } from '@playwright/test'

test.describe('Authenticated Inventory Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Check if already logged in
    const isLoggedIn = await page.locator('text=Alejandro Sierraalta').isVisible().catch(() => false)
    
    if (!isLoggedIn) {
      // Perform login
      await page.fill('input[type="email"]', 'alesierraalta@gmail.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.getByRole('button', { name: /login|sign in|iniciar sesión/i }).click()
      
      // Wait for redirect to dashboard, then navigate to inventory
      await page.waitForURL('**/dashboard**', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
      
      // Navigate to inventory page
      await page.goto('http://localhost:3002/inventory')
      await page.waitForLoadState('networkidle')
    }
  })

  test('should display inventory page after login', async ({ page }) => {
    // Verify we're on inventory page
    expect(page.url()).toContain('/inventory')
    
    // Verify page title
    await expect(page).toHaveTitle(/LUMO.*Sistema de Gestión de Inventario/)
    
    // Verify user is logged in
    await expect(page.locator('text=Alejandro Sierraalta')).toBeVisible()
  })

  test('should display inventory table', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table is visible
    await expect(page.getByRole('table')).toBeVisible()
    
    // Verify table headers
    await expect(page.getByText('SKU')).toBeVisible()
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Category')).toBeVisible()
    await expect(page.locator('th:has-text("Location")')).toBeVisible()
    await expect(page.getByText('Price')).toBeVisible()
    await expect(page.getByText('Stock')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
  })

  test('should display action buttons', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Verify action buttons are visible
    await expect(page.getByRole('button', { name: 'Nuevo Producto' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Crear Múltiples' })).toBeVisible()
  })

  test('should create a single inventory item', async ({ page }) => {
    // Click "Nuevo Producto" button
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Wait for form to appear
    await page.waitForSelector('input[name="sku"]', { timeout: 5000 })
    
    // Fill in the form
    await page.fill('input[name="sku"]', 'TEST-AUTH-001')
    await page.fill('input[name="name"]', 'Test Auth Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '99.99')
    await page.fill('input[name="quantity"]', '10')
    await page.fill('input[name="min_stock"]', '2')
    await page.fill('input[name="max_stock"]', '50')
    
    // Submit the form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for success message or redirect
    await page.waitForTimeout(3000)
    
    // Verify success (either success message or item appears in table)
    const successMessage = page.locator('[data-testid="success-message"], .success, .alert-success')
    const hasSuccessMessage = await successMessage.isVisible().catch(() => false)
    
    if (hasSuccessMessage) {
      await expect(successMessage).toBeVisible()
    } else {
      // Check if item appears in table
      await expect(page.getByText('TEST-AUTH-001')).toBeVisible()
    }
  })

  test('should handle bulk creation', async ({ page }) => {
    // Click "Crear Múltiples" button
    await page.getByRole('button', { name: 'Crear Múltiples' }).click()
    
    // Wait for bulk form to appear
    await page.waitForSelector('input[data-testid="sku-1"]', { timeout: 5000 })
    
    // Fill in multiple items
    await page.fill('input[data-testid="sku-1"]', 'BULK-AUTH-001')
    await page.fill('input[data-testid="name-1"]', 'Bulk Auth Test 1')
    await page.fill('input[data-testid="sku-2"]', 'BULK-AUTH-002')
    await page.fill('input[data-testid="name-2"]', 'Bulk Auth Test 2')
    
    // Submit bulk creation
    await page.getByRole('button', { name: 'Crear 2 Items' }).click()
    
    // Wait for success
    await page.waitForTimeout(3000)
    
    // Verify success
    const successMessage = page.locator('[data-testid="success-message"], .success, .alert-success')
    const hasSuccessMessage = await successMessage.isVisible().catch(() => false)
    
    if (hasSuccessMessage) {
      await expect(successMessage).toBeVisible()
    } else {
      // Check if items appear in table
      await expect(page.getByText('BULK-AUTH-001')).toBeVisible()
      await expect(page.getByText('BULK-AUTH-002')).toBeVisible()
    }
  })

  test('should display inventory items', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify at least one item is displayed
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has expected columns
    const firstRow = rows.first()
    const cells = firstRow.locator('td')
    const cellCount = await cells.count()
    
    expect(cellCount).toBeGreaterThanOrEqual(5) // At least 5 columns
  })

  test('should handle search functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]')
    
    if (await searchInput.isVisible()) {
      // Get a SKU from the first row
      const firstRow = page.locator('tbody tr').first()
      const skuCell = firstRow.locator('td').nth(2) // SKU column
      const skuText = await skuCell.textContent()
      
      if (skuText) {
        // Search by SKU
        await searchInput.fill(skuText)
        await page.keyboard.press('Enter')
        
        // Wait for search results
        await page.waitForTimeout(2000)
        
        // Verify search results
        const rows = page.locator('tbody tr')
        const rowCount = await rows.count()
        expect(rowCount).toBeGreaterThan(0)
      }
    }
  })

  test('should handle logout', async ({ page }) => {
    // Look for logout button or user menu
    const logoutButton = page.getByRole('button', { name: /logout|sign out|cerrar sesión/i })
    const userMenu = page.locator('[data-testid="user-menu"]')
    
    if (await logoutButton.isVisible()) {
      // Click logout button
      await logoutButton.click()
      
      // Wait for redirect to login
      await page.waitForURL('**/login**', { timeout: 10000 })
      
      // Verify we're on login page
      expect(page.url()).toContain('/login')
    } else if (await userMenu.isVisible()) {
      // Click user menu to reveal logout option
      await userMenu.click()
      
      const logoutOption = page.getByRole('button', { name: /logout|sign out|cerrar sesión/i })
      if (await logoutOption.isVisible()) {
        await logoutOption.click()
        
        // Wait for redirect to login
        await page.waitForURL('**/login**', { timeout: 10000 })
        
        // Verify we're on login page
        expect(page.url()).toContain('/login')
      }
    }
  })
})
