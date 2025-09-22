/**
 * Inventory CRUD Operations Tests
 * Tests all Create, Read, Update, Delete operations for inventory items
 */

import { test, expect } from '@playwright/test'

test.describe('Inventory CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should create a single inventory item', async ({ page }) => {
    // Click "Nuevo Producto" button
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Fill in the form
    await page.fill('input[name="sku"]', 'TEST-CRUD-001')
    await page.fill('input[name="name"]', 'Test CRUD Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '99.99')
    await page.fill('input[name="quantity"]', '10')
    await page.fill('input[name="min_stock"]', '2')
    await page.fill('input[name="max_stock"]', '50')
    
    // Submit the form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Verify success message
    await expect(page.getByText('Producto creado exitosamente')).toBeVisible()
    
    // Verify item appears in the table
    await expect(page.getByText('TEST-CRUD-001')).toBeVisible()
    await expect(page.getByText('Test CRUD Product')).toBeVisible()
  })

  test('should read/display inventory items', async ({ page }) => {
    // Verify inventory table is visible
    await expect(page.getByRole('table')).toBeVisible()
    
    // Verify table headers
    await expect(page.getByText('SKU')).toBeVisible()
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Category')).toBeVisible()
    await expect(page.getByText('Location')).toBeVisible()
    await expect(page.getByText('Price')).toBeVisible()
    await expect(page.getByText('Stock')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    
    // Verify at least one item is displayed
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount({ min: 1 })
  })

  test('should update an inventory item', async ({ page }) => {
    // Find and click edit button for the first item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Edit' }).click()
    
    // Update the name
    await page.fill('input[name="name"]', 'Updated Product Name')
    await page.fill('input[name="unit_price"]', '149.99')
    
    // Submit the update
    await page.getByRole('button', { name: 'Actualizar Producto' }).click()
    
    // Verify success message
    await expect(page.getByText('Producto actualizado exitosamente')).toBeVisible()
    
    // Verify the changes are reflected in the table
    await expect(page.getByText('Updated Product Name')).toBeVisible()
  })

  test('should delete an inventory item', async ({ page }) => {
    // Get initial count
    const initialRows = page.locator('tbody tr')
    const initialCount = await initialRows.count()
    
    // Find and click delete button for the first item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Delete' }).click()
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Confirmar' }).click()
    
    // Verify success message
    await expect(page.getByText('Producto eliminado exitosamente')).toBeVisible()
    
    // Verify item count decreased
    await expect(initialRows).toHaveCount(initialCount - 1)
  })

  test('should handle bulk creation', async ({ page }) => {
    // Click "Crear Múltiples" button
    await page.getByRole('button', { name: 'Crear Múltiples' }).click()
    
    // Fill in multiple items
    await page.fill('input[data-testid="sku-1"]', 'BULK-CRUD-001')
    await page.fill('input[data-testid="name-1"]', 'Bulk Test 1')
    await page.fill('input[data-testid="sku-2"]', 'BULK-CRUD-002')
    await page.fill('input[data-testid="name-2"]', 'Bulk Test 2')
    
    // Submit bulk creation
    await page.getByRole('button', { name: 'Crear 2 Items' }).click()
    
    // Verify success message
    await expect(page.getByText('Items creados exitosamente')).toBeVisible()
    
    // Verify items appear in the table
    await expect(page.getByText('BULK-CRUD-001')).toBeVisible()
    await expect(page.getByText('BULK-CRUD-002')).toBeVisible()
  })
})
