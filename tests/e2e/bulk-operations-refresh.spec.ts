import { test, expect } from '@playwright/test'

test.describe('Bulk Operations Refresh', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should refresh inventory table after bulk create operation', async ({ page }) => {
    // Get initial inventory count
    const initialCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const initialCount = await initialCountElement.textContent()
    const initialCountNumber = parseInt(initialCount?.replace(/\D/g, '') || '0')

    console.log(`Initial inventory count: ${initialCountNumber}`)

    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    // Fill in the first item
    await page.fill('[data-testid="sku-field-1"]', 'TEST-E2E-001')
    await page.fill('[data-testid="name-field-1"]', 'Test E2E Item 1')

    // Select category
    await page.click('[data-testid="category-field-1"]')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })

    // Select location
    await page.click('[data-testid="location-field-1"]')
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })

    // Set quantity
    await page.fill('[data-testid="quantity-field-1"]', '10')

    // Click create button
    await page.click('button:has-text("Crear 1 Items")')

    // Wait for success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for inventory table to refresh
    await page.waitForTimeout(2000)

    // Get updated inventory count
    const updatedCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const updatedCount = await updatedCountElement.textContent()
    const updatedCountNumber = parseInt(updatedCount?.replace(/\D/g, '') || '0')

    console.log(`Updated inventory count: ${updatedCountNumber}`)

    // Verify count increased
    expect(updatedCountNumber).toBe(initialCountNumber + 1)

    // Search for the new item
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-001')
    await page.waitForTimeout(1000)

    // Verify the new item appears in the table
    const newItemRow = page.locator('tr:has-text("TEST-E2E-001")')
    await expect(newItemRow).toBeVisible()

    // Verify item details
    await expect(newItemRow.locator('td:has-text("Test E2E Item 1")')).toBeVisible()
    await expect(newItemRow.locator('td:has-text("Electronics")')).toBeVisible()
    await expect(newItemRow.locator('td:has-text("Main Warehouse")')).toBeVisible()
    await expect(newItemRow.locator('td:has-text("10")')).toBeVisible()
  })

  test('should handle multiple items in bulk create', async ({ page }) => {
    // Get initial inventory count
    const initialCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const initialCount = await initialCountElement.textContent()
    const initialCountNumber = parseInt(initialCount?.replace(/\D/g, '') || '0')

    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    // Add a second item
    await page.click('button:has-text("Agregar Item")')

    // Fill in the first item
    await page.fill('[data-testid="sku-field-1"]', 'TEST-E2E-002')
    await page.fill('[data-testid="name-field-1"]', 'Test E2E Item 2')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '5')

    // Fill in the second item
    await page.fill('[data-testid="sku-field-2"]', 'TEST-E2E-003')
    await page.fill('[data-testid="name-field-2"]', 'Test E2E Item 3')
    await page.selectOption('[data-testid="category-field-2"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-2"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-2"]', '8')

    // Click create button
    await page.click('button:has-text("Crear 2 Items")')

    // Wait for success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for inventory table to refresh
    await page.waitForTimeout(2000)

    // Get updated inventory count
    const updatedCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const updatedCount = await updatedCountElement.textContent()
    const updatedCountNumber = parseInt(updatedCount?.replace(/\D/g, '') || '0')

    // Verify count increased by 2
    expect(updatedCountNumber).toBe(initialCountNumber + 2)

    // Search for the new items
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-002')
    await page.waitForTimeout(1000)

    // Verify the first new item appears
    const firstItemRow = page.locator('tr:has-text("TEST-E2E-002")')
    await expect(firstItemRow).toBeVisible()

    // Search for the second item
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-003')
    await page.waitForTimeout(1000)

    // Verify the second new item appears
    const secondItemRow = page.locator('tr:has-text("TEST-E2E-003")')
    await expect(secondItemRow).toBeVisible()
  })

  test('should handle validation errors in bulk create', async ({ page }) => {
    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    // Try to create item without required fields
    await page.click('button:has-text("Crear 1 Items")')

    // Verify validation errors appear
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()

    // Verify modal stays open
    await expect(page.locator('[data-testid="bulk-create-modal"]')).toBeVisible()

    // Fill in required fields
    await page.fill('[data-testid="sku-field-1"]', 'TEST-E2E-004')
    await page.fill('[data-testid="name-field-1"]', 'Test E2E Item 4')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '3')

    // Click create button again
    await page.click('button:has-text("Crear 1 Items")')

    // Wait for success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Verify item was created
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-004')
    await page.waitForTimeout(1000)

    const newItemRow = page.locator('tr:has-text("TEST-E2E-004")')
    await expect(newItemRow).toBeVisible()
  })

  test('should refresh inventory table after bulk update operation', async ({ page }) => {
    // First, create an item to update
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    await page.fill('[data-testid="sku-field-1"]', 'TEST-E2E-UPDATE-001')
    await page.fill('[data-testid="name-field-1"]', 'Test E2E Update Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '5')

    await page.click('button:has-text("Crear 1 Items")')
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for table to refresh
    await page.waitForTimeout(2000)

    // Search for the created item
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-UPDATE-001')
    await page.waitForTimeout(1000)

    // Select the item for bulk update
    const itemRow = page.locator('tr:has-text("TEST-E2E-UPDATE-001")')
    await itemRow.locator('[data-testid="select-checkbox"]').check()

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForSelector('[data-testid="bulk-operations-modal"]', { timeout: 5000 })

    // Select update operation
    await page.click('button:has-text("Actualizar")')
    await page.waitForSelector('[data-testid="bulk-update-form"]', { timeout: 5000 })

    // Update the item
    await page.fill('[data-testid="update-quantity"]', '15')
    await page.click('button:has-text("Aplicar Actualización")')

    // Wait for success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="bulk-operations-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for table to refresh
    await page.waitForTimeout(2000)

    // Verify the item was updated
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-UPDATE-001')
    await page.waitForTimeout(1000)

    const updatedItemRow = page.locator('tr:has-text("TEST-E2E-UPDATE-001")')
    await expect(updatedItemRow.locator('td:has-text("15")')).toBeVisible()
  })

  test('should refresh inventory table after bulk delete operation', async ({ page }) => {
    // First, create an item to delete
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { timeout: 5000 })

    await page.fill('[data-testid="sku-field-1"]', 'TEST-E2E-DELETE-001')
    await page.fill('[data-testid="name-field-1"]', 'Test E2E Delete Item')
    await page.selectOption('[data-testid="category-field-1"]', { label: 'Electronics' })
    await page.selectOption('[data-testid="location-field-1"]', { label: 'Main Warehouse' })
    await page.fill('[data-testid="quantity-field-1"]', '1')

    await page.click('button:has-text("Crear 1 Items")')
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    await page.waitForSelector('[data-testid="bulk-create-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for table to refresh
    await page.waitForTimeout(2000)

    // Get initial count
    const initialCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const initialCount = await initialCountElement.textContent()
    const initialCountNumber = parseInt(initialCount?.replace(/\D/g, '') || '0')

    // Search for the created item
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-DELETE-001')
    await page.waitForTimeout(1000)

    // Select the item for bulk delete
    const itemRow = page.locator('tr:has-text("TEST-E2E-DELETE-001")')
    await itemRow.locator('[data-testid="select-checkbox"]').check()

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForSelector('[data-testid="bulk-operations-modal"]', { timeout: 5000 })

    // Select delete operation
    await page.click('button:has-text("Eliminar")')
    await page.waitForSelector('[data-testid="bulk-delete-confirmation"]', { timeout: 5000 })

    // Confirm deletion
    await page.click('button:has-text("Confirmar Eliminación")')

    // Wait for success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="bulk-operations-modal"]', { state: 'hidden', timeout: 5000 })

    // Wait for table to refresh
    await page.waitForTimeout(2000)

    // Get updated count
    const updatedCountElement = await page.locator('[data-testid="inventory-count"]').first()
    const updatedCount = await updatedCountElement.textContent()
    const updatedCountNumber = parseInt(updatedCount?.replace(/\D/g, '') || '0')

    // Verify count decreased by 1
    expect(updatedCountNumber).toBe(initialCountNumber - 1)

    // Verify the item is no longer visible
    await page.fill('[data-testid="search-input"]', 'TEST-E2E-DELETE-001')
    await page.waitForTimeout(1000)

    await expect(page.locator('tr:has-text("TEST-E2E-DELETE-001")')).not.toBeVisible()
  })
})
