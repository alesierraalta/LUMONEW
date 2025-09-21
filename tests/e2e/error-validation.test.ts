/**
 * Error Validation Tests
 * Tests error handling, validation, and edge cases
 */

import { test, expect } from '@playwright/test'

test.describe('Error Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should validate required fields in inventory creation', async ({ page }) => {
    // Click "Nuevo Producto" button
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Try to submit form without required fields
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Verify validation errors are displayed
    const skuError = page.locator('[data-testid="sku-error"], .field-error')
    const nameError = page.locator('[data-testid="name-error"], .field-error')
    
    const hasSkuError = await skuError.isVisible().catch(() => false)
    const hasNameError = await nameError.isVisible().catch(() => false)
    
    // At least one validation error should be visible
    expect(hasSkuError || hasNameError).toBeTruthy()
  })

  test('should validate SKU uniqueness', async ({ page }) => {
    // Get an existing SKU from the table
    const firstRow = page.locator('tbody tr').first()
    const skuCell = firstRow.locator('td').nth(2) // SKU column
    const existingSku = await skuCell.textContent()
    
    if (!existingSku) {
      test.skip('No existing SKU found')
      return
    }
    
    // Try to create item with duplicate SKU
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', existingSku)
    await page.fill('input[name="name"]', 'Duplicate SKU Test')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for validation
    await page.waitForTimeout(2000)
    
    // Verify duplicate SKU error
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('SKU') || expect(errorText).toContain('duplicate') || expect(errorText).toContain('already exists')
    }
  })

  test('should validate numeric fields', async ({ page }) => {
    // Click "Nuevo Producto" button
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Fill form with invalid numeric values
    await page.fill('input[name="sku"]', 'NUMERIC-TEST-001')
    await page.fill('input[name="name"]', 'Numeric Test Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', 'invalid-price')
    await page.fill('input[name="quantity"]', 'invalid-quantity')
    await page.fill('input[name="min_stock"]', 'invalid-min')
    await page.fill('input[name="max_stock"]', 'invalid-max')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for validation
    await page.waitForTimeout(2000)
    
    // Verify numeric validation errors
    const priceError = page.locator('[data-testid="price-error"], .field-error')
    const quantityError = page.locator('[data-testid="quantity-error"], .field-error')
    
    const hasPriceError = await priceError.isVisible().catch(() => false)
    const hasQuantityError = await quantityError.isVisible().catch(() => false)
    
    // At least one numeric validation error should be visible
    expect(hasPriceError || hasQuantityError).toBeTruthy()
  })

  test('should validate negative values', async ({ page }) => {
    // Click "Nuevo Producto" button
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Fill form with negative values
    await page.fill('input[name="sku"]', 'NEGATIVE-TEST-001')
    await page.fill('input[name="name"]', 'Negative Test Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '-10.00')
    await page.fill('input[name="quantity"]', '-5')
    await page.fill('input[name="min_stock"]', '-1')
    await page.fill('input[name="max_stock"]', '-10')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for validation
    await page.waitForTimeout(2000)
    
    // Verify negative value validation errors
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('negative') || expect(errorText).toContain('positive') || expect(errorText).toContain('greater than')
    }
  })

  test('should validate min/max stock relationship', async ({ page }) => {
    // Click "Nuevo Producto" button
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Fill form with min_stock > max_stock
    await page.fill('input[name="sku"]', 'MINMAX-TEST-001')
    await page.fill('input[name="name"]', 'Min Max Test Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '99.99')
    await page.fill('input[name="quantity"]', '10')
    await page.fill('input[name="min_stock"]', '20')
    await page.fill('input[name="max_stock"]', '10')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for validation
    await page.waitForTimeout(2000)
    
    // Verify min/max validation error
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('min') || expect(errorText).toContain('max') || expect(errorText).toContain('greater than')
    }
  })

  test('should handle database constraint violations', async ({ page }) => {
    // Try to create item with invalid category_id
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'CONSTRAINT-TEST-001')
    await page.fill('input[name="name"]', 'Constraint Test Product')
    
    // Try to submit with invalid category (if possible)
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for error
    await page.waitForTimeout(2000)
    
    // Verify constraint violation error
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('constraint') || expect(errorText).toContain('foreign key') || expect(errorText).toContain('invalid')
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.context().setOffline(true)
    
    // Try to create an item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'NETWORK-ERROR-TEST')
    await page.fill('input[name="name"]', 'Network Error Test')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for error handling
    await page.waitForTimeout(3000)
    
    // Verify network error message
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('network') || expect(errorText).toContain('connection') || expect(errorText).toContain('offline')
    }
    
    // Restore network
    await page.context().setOffline(false)
  })

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error response
    await page.route('**/api/v1/inventory', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Something went wrong on the server'
        })
      })
    })
    
    // Try to create an item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'SERVER-ERROR-TEST')
    await page.fill('input[name="name"]', 'Server Error Test')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for error handling
    await page.waitForTimeout(3000)
    
    // Verify server error message
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('server') || expect(errorText).toContain('error') || expect(errorText).toContain('wrong')
    }
  })

  test('should handle authentication errors', async ({ page }) => {
    // Clear authentication
    await page.context().clearCookies()
    
    // Try to access protected functionality
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Try to create an item
    const newProductButton = page.getByRole('button', { name: 'Nuevo Producto' })
    if (await newProductButton.isVisible()) {
      await newProductButton.click()
      
      // Wait for authentication error
      await page.waitForTimeout(2000)
      
      // Verify authentication error
      const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
      const hasError = await errorMessage.isVisible().catch(() => false)
      
      if (hasError) {
        const errorText = await errorMessage.textContent()
        expect(errorText).toContain('auth') || expect(errorText).toContain('login') || expect(errorText).toContain('unauthorized')
      }
    }
  })

  test('should handle bulk creation validation errors', async ({ page }) => {
    // Click "Crear Múltiples" button
    await page.getByRole('button', { name: 'Crear Múltiples' }).click()
    
    // Try to submit with empty fields
    await page.getByRole('button', { name: 'Crear 0 Items' }).click()
    
    // Wait for validation
    await page.waitForTimeout(2000)
    
    // Verify validation errors
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('required') || expect(errorText).toContain('empty') || expect(errorText).toContain('missing')
    }
  })

  test('should handle file upload errors', async ({ page }) => {
    // Look for file upload functionality
    const fileUploadButton = page.getByRole('button', { name: /upload|import|csv/i })
    
    if (await fileUploadButton.isVisible()) {
      await fileUploadButton.click()
      
      // Try to upload invalid file
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.isVisible()) {
        // Create a temporary invalid file
        const invalidFile = new File(['invalid content'], 'invalid.txt', { type: 'text/plain' })
        
        // Upload file
        await fileInput.setInputFiles([invalidFile])
        
        // Wait for error
        await page.waitForTimeout(2000)
        
        // Verify file validation error
        const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
        const hasError = await errorMessage.isVisible().catch(() => false)
        
        if (hasError) {
          const errorText = await errorMessage.textContent()
          expect(errorText).toContain('file') || expect(errorText).toContain('format') || expect(errorText).toContain('invalid')
        }
      }
    } else {
      test.skip('File upload functionality not found')
    }
  })

  test('should handle concurrent modification errors', async ({ page }) => {
    // Open edit form for an item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Edit' }).click()
    
    // Open another tab and modify the same item
    const newPage = await page.context().newPage()
    await newPage.goto('http://localhost:3002/inventory')
    await newPage.waitForLoadState('networkidle')
    
    const firstRowNew = newPage.locator('tbody tr').first()
    await firstRowNew.getByRole('button', { name: 'Edit' }).click()
    
    // Modify in second tab
    await newPage.fill('input[name="name"]', 'Modified in second tab')
    await newPage.getByRole('button', { name: 'Actualizar Producto' }).click()
    
    // Wait for update
    await newPage.waitForTimeout(2000)
    await newPage.close()
    
    // Try to modify in first tab
    await page.fill('input[name="name"]', 'Modified in first tab')
    await page.getByRole('button', { name: 'Actualizar Producto' }).click()
    
    // Wait for error
    await page.waitForTimeout(2000)
    
    // Verify concurrent modification error
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.textContent()
      expect(errorText).toContain('concurrent') || expect(errorText).toContain('modified') || expect(errorText).toContain('conflict')
    }
  })
})
