import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test configuration for database testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbtninlyzpdemyudaqg.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'

// Skip tests if no valid Supabase configuration
const skipTests = !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

test.describe('Bulk Operations E2E Database Tests', () => {
  test.beforeEach(async () => {
    if (skipTests) {
      test.skip('Skipping database tests - Supabase configuration not available')
      return
    }
    // Clean up any existing test data
    await supabase
      .from('inventory')
      .delete()
      .like('sku', 'TEST-E2E-%')
  })

  test.afterEach(async () => {
    // Clean up test data after each test
    await supabase
      .from('inventory')
      .delete()
      .like('sku', 'TEST-E2E-%')
  })

  test('should complete full bulk create workflow with database verification', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial inventory count from database
    const { data: initialItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const initialCount = initialItems?.length || 0
    console.log(`Initial database count: ${initialCount}`)

    // Get initial UI count
    const countText = await page.textContent('text=/\\d+ productos/')
    const initialUICount = parseInt(countText?.match(/\d+/)?.[0] || '0')
    console.log(`Initial UI count: ${initialUICount}`)

    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Fill in the item data
    const testSku = `TEST-E2E-${Date.now()}-001`
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test E2E Item')
    
    // Select category and location
    await page.selectOption('select, [role="combobox"]', { label: 'Electronics' })
    await page.selectOption('select, [role="combobox"]:nth-of-type(2)', { label: 'Main Warehouse' })
    await page.fill('input[type="number"], input[placeholder*="Cantidad"]', '1')

    // Click create button
    await page.click('button:has-text("Crear 1 Items")')
    
    // Wait for success toast
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    
    // Wait for modal to close
    await page.waitForTimeout(3000)

    // Verify item was created in database
    const { data: createdItem, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', testSku)
      .single()

    expect(error).toBeNull()
    expect(createdItem).not.toBeNull()
    expect(createdItem!.name).toBe('Test E2E Item')
    expect(createdItem!.quantity).toBe(1)

    // Verify audit log was created
    const { data: auditLog } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem!.id)
      .eq('operation', 'INSERT')
      .single()

    expect(auditLog).not.toBeNull()
    expect(auditLog!.operation).toBe('INSERT')

    // Verify final database count
    const { data: finalItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const finalCount = finalItems?.length || 0
    expect(finalCount).toBe(initialCount + 1)

    // Verify UI count updated
    const finalCountText = await page.textContent('text=/\\d+ productos/')
    const finalUICount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0')
    expect(finalUICount).toBe(initialUICount + 1)

    // Verify item appears in the UI
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)

    const newItemRow = page.locator(`tr:has-text("${testSku}")`)
    await expect(newItemRow).toBeVisible()

    // Verify item details in UI
    await expect(newItemRow.locator('td:has-text("Test E2E Item")')).toBeVisible()
    await expect(newItemRow.locator('td:has-text("Electronics")')).toBeVisible()
    await expect(newItemRow.locator('td:has-text("Main Warehouse")')).toBeVisible()
    await expect(newItemRow.locator('td:has-text("1")')).toBeVisible()
  })

  test('should handle bulk create with validation errors and database rollback', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial database count
    const { data: initialItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const initialCount = initialItems?.length || 0

    // Click on "Crear Múltiples" button
    await page.click('button:has-text("Crear Múltiples")')
    await page.waitForTimeout(2000)

    // Try to create item without required fields
    await page.click('button:has-text("Crear 1 Items")')

    // Verify validation errors appear
    await expect(page.locator('text=Campo requerido, text=Required field')).toBeVisible()

    // Verify modal stays open
    await expect(page.locator('button:has-text("Crear 1 Items")')).toBeVisible()

    // Fill in required fields
    const testSku = `TEST-E2E-${Date.now()}-VALIDATION`
    await page.fill('input[placeholder*="SKU"]', testSku)
    await page.fill('input[placeholder*="Nombre"]', 'Test E2E Validation Item')
    await page.selectOption('select, [role="combobox"]', { label: 'Electronics' })
    await page.selectOption('select, [role="combobox"]:nth-of-type(2)', { label: 'Main Warehouse' })
    await page.fill('input[type="number"], input[placeholder*="Cantidad"]', '1')

    // Click create button again
    await page.click('button:has-text("Crear 1 Items")')

    // Wait for success toast
    await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Verify item was created in database
    const { data: createdItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', testSku)
      .single()

    expect(createdItem).not.toBeNull()
    expect(createdItem!.name).toBe('Test E2E Validation Item')

    // Verify final database count
    const { data: finalItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const finalCount = finalItems?.length || 0
    expect(finalCount).toBe(initialCount + 1)

    // Verify item appears in UI
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)

    const itemRow = page.locator(`tr:has-text("${testSku}")`)
    await expect(itemRow).toBeVisible()
  })

  test('should test complete bulk update workflow with database verification', async ({ page }) => {
    // First create an item via API
    const testSku = `TEST-E2E-${Date.now()}-UPDATE`
    const { data: createdItem, error: createError } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test E2E Update Item',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b', // Electronics
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d', // Main Warehouse
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_price: 99.99,
        status: 'active',
        images: []
      })
      .select()
      .single()

    expect(createError).toBeNull()
    expect(createdItem).not.toBeNull()

    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Search for the created item
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)

    // Verify item appears in UI
    const itemRow = page.locator(`tr:has-text("${testSku}")`)
    await expect(itemRow).toBeVisible()
    await expect(itemRow.locator('td:has-text("10")')).toBeVisible()

    // Select the item for bulk update
    await itemRow.locator('input[type="checkbox"]').check()

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForTimeout(2000)

    // Select update operation
    await page.click('button:has-text("Actualizar")')
    await page.waitForTimeout(2000)

    // Update the item
    await page.fill('input[placeholder*="Cantidad"], input[type="number"]', '20')
    await page.click('button:has-text("Aplicar Actualización")')

    // Wait for success toast
    await page.waitForSelector('text=Items actualizados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Verify item was updated in database
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem!.id)
      .single()

    expect(updateError).toBeNull()
    expect(updatedItem!.quantity).toBe(20)

    // Verify audit log was created for update
    const { data: updateAuditLog } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem!.id)
      .eq('operation', 'UPDATE')
      .single()

    expect(updateAuditLog).not.toBeNull()
    expect(updateAuditLog!.operation).toBe('UPDATE')

    // Verify item shows updated quantity in UI
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)

    const updatedItemRow = page.locator(`tr:has-text("${testSku}")`)
    await expect(updatedItemRow.locator('td:has-text("20")')).toBeVisible()
  })

  test('should test complete bulk delete workflow with database verification', async ({ page }) => {
    // First create an item via API
    const testSku = `TEST-E2E-${Date.now()}-DELETE`
    const { data: createdItem, error: createError } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test E2E Delete Item',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b', // Electronics
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d', // Main Warehouse
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_price: 99.99,
        status: 'active',
        images: []
      })
      .select()
      .single()

    expect(createError).toBeNull()
    expect(createdItem).not.toBeNull()

    // Get initial database count
    const { data: initialItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const initialCount = initialItems?.length || 0

    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Search for the created item
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)

    // Verify item appears in UI
    const itemRow = page.locator(`tr:has-text("${testSku}")`)
    await expect(itemRow).toBeVisible()

    // Select the item for bulk delete
    await itemRow.locator('input[type="checkbox"]').check()

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForTimeout(2000)

    // Select delete operation
    await page.click('button:has-text("Eliminar")')
    await page.waitForTimeout(2000)

    // Confirm deletion
    await page.click('button:has-text("Confirmar Eliminación")')

    // Wait for success toast
    await page.waitForSelector('text=Items eliminados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Verify item was deleted from database (hard delete)
    const { data: deletedItem, error: deleteError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem!.id)
      .single()

    // Item should not exist (hard delete)
    expect(deleteError).not.toBeNull()
    expect(deleteError!.code).toBe('PGRST116') // No rows returned

    // Verify audit log was created for delete
    const { data: deleteAuditLog } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem!.id)
      .eq('operation', 'DELETE')
      .single()

    expect(deleteAuditLog).not.toBeNull()
    expect(deleteAuditLog!.operation).toBe('DELETE')

    // Verify final database count (should be less since it's hard delete)
    const { data: finalItems } = await supabase
      .from('inventory')
      .select('id')

    const finalCount = finalItems?.length || 0
    expect(finalCount).toBe(initialCount - 1)

    // Verify item no longer appears in UI
    await page.fill('input[placeholder*="Buscar"], input[type="search"]', testSku)
    await page.waitForTimeout(2000)

    await expect(page.locator(`tr:has-text("${testSku}")`)).not.toBeVisible()
  })

  test('should test multiple bulk operations in sequence with database verification', async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000/en/inventory')
    await page.waitForLoadState('networkidle')

    // Get initial database count
    const { data: initialItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const initialCount = initialItems?.length || 0

    // Perform multiple bulk creates
    const items = [
      { sku: `TEST-E2E-${Date.now()}-MULTI-001`, name: 'Test E2E Multi Item 1' },
      { sku: `TEST-E2E-${Date.now()}-MULTI-002`, name: 'Test E2E Multi Item 2' },
      { sku: `TEST-E2E-${Date.now()}-MULTI-003`, name: 'Test E2E Multi Item 3' }
    ]

    for (const item of items) {
      // Create item
      await page.click('button:has-text("Crear Múltiples")')
      await page.waitForTimeout(2000)

      await page.fill('input[placeholder*="SKU"]', item.sku)
      await page.fill('input[placeholder*="Nombre"]', item.name)
      await page.selectOption('select, [role="combobox"]', { label: 'Electronics' })
      await page.selectOption('select, [role="combobox"]:nth-of-type(2)', { label: 'Main Warehouse' })
      await page.fill('input[type="number"], input[placeholder*="Cantidad"]', '1')

      await page.click('button:has-text("Crear 1 Items")')
      await page.waitForSelector('text=Items creados exitosamente', { timeout: 10000 })
      await page.waitForTimeout(2000)

      // Verify item was created in database
      const { data: dbItem } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku', item.sku)
        .single()

      expect(dbItem).not.toBeNull()
      expect(dbItem!.name).toBe(item.name)

      // Verify item appears in UI
      await page.fill('input[placeholder*="Buscar"], input[type="search"]', item.sku)
      await page.waitForTimeout(1000)

      const itemRow = page.locator(`tr:has-text("${item.sku}")`)
      await expect(itemRow).toBeVisible()

      console.log(`Created and verified: ${item.sku}`)
    }

    // Verify final database count
    const { data: finalItems } = await supabase
      .from('inventory')
      .select('id')
      .eq('deleted_at', null)

    const finalCount = finalItems?.length || 0
    expect(finalCount).toBe(initialCount + items.length)

    // Verify all items are visible in the table
    for (const item of items) {
      await page.fill('input[placeholder*="Buscar"], input[type="search"]', item.sku)
      await page.waitForTimeout(1000)

      const itemRow = page.locator(`tr:has-text("${item.sku}")`)
      await expect(itemRow).toBeVisible()
    }

    // Now test bulk update on all items
    for (const item of items) {
      // Search for item
      await page.fill('input[placeholder*="Buscar"], input[type="search"]', item.sku)
      await page.waitForTimeout(1000)

      // Select item
      const itemRow = page.locator(`tr:has-text("${item.sku}")`)
      await itemRow.locator('input[type="checkbox"]').check()
    }

    // Click bulk operations button
    await page.click('button:has-text("Operaciones en Lote")')
    await page.waitForTimeout(2000)

    // Select update operation
    await page.click('button:has-text("Actualizar")')
    await page.waitForTimeout(2000)

    // Update all items
    await page.fill('input[placeholder*="Cantidad"], input[type="number"]', '5')
    await page.click('button:has-text("Aplicar Actualización")')

    // Wait for success toast
    await page.waitForSelector('text=Items actualizados exitosamente', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Verify all items were updated in database
    for (const item of items) {
      const { data: updatedItem } = await supabase
        .from('inventory')
        .select('*')
        .eq('sku', item.sku)
        .single()

      expect(updatedItem).not.toBeNull()
      expect(updatedItem!.quantity).toBe(5)
    }

    // Verify all items show updated quantity in UI
    for (const item of items) {
      await page.fill('input[placeholder*="Buscar"], input[type="search"]', item.sku)
      await page.waitForTimeout(1000)

      const itemRow = page.locator(`tr:has-text("${item.sku}")`)
      await expect(itemRow.locator('td:has-text("5")')).toBeVisible()
    }
  })
})
