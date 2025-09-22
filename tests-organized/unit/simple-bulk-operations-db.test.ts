import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test configuration for database testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbtninlyzpdemyudaqg.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'

// Skip tests if no valid Supabase configuration
const skipTests = !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

test.describe('Simple Bulk Operations Database Tests', () => {
  test.beforeEach(async () => {
    if (skipTests) {
      test.skip('Skipping database tests - Supabase configuration not available')
      return
    }
    // Clean up any existing test data
    await supabase
      .from('inventory')
      .delete()
      .like('sku', 'TEST-SIMPLE-%')
  })

  test.afterEach(async () => {
    // Clean up test data after each test
    await supabase
      .from('inventory')
      .delete()
      .like('sku', 'TEST-SIMPLE-%')
  })

  test('should create multiple items directly in database', async () => {
    // Create test data
    const testItems = [
      {
        sku: `TEST-SIMPLE-${Date.now()}-001`,
        name: 'Test Simple Item 1',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b', // Electronics
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d', // Main Warehouse
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_price: 99.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-SIMPLE-${Date.now()}-002`,
        name: 'Test Simple Item 2',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b', // Electronics
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d', // Main Warehouse
        quantity: 5,
        min_stock: 1,
        max_stock: 25,
        unit_price: 149.99,
        status: 'active',
        images: []
      }
    ]

    // Create items directly in database
    const { data: createdItems, error } = await supabase
      .from('inventory')
      .insert(testItems)
      .select()

    // Verify items were created
    expect(error).toBeNull()
    expect(createdItems).toHaveLength(2)
    expect(createdItems![0].sku).toBe(testItems[0].sku)
    expect(createdItems![1].sku).toBe(testItems[1].sku)

    // Verify items exist in database using the created items
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .in('id', [createdItems![0].id, createdItems![1].id])

    expect(dbError).toBeNull()
    expect(dbItems).toHaveLength(2)
    expect(dbItems![0].name).toBe('Test Simple Item 1')
    expect(dbItems![1].name).toBe('Test Simple Item 2')

    // Verify audit logs were created (filter for INSERT only)
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('operation', 'INSERT')
      .in('record_id', [createdItems![0].id, createdItems![1].id])

    expect(auditLogs).toHaveLength(2)
    expect(auditLogs![0].operation).toBe('INSERT')
    expect(auditLogs![1].operation).toBe('INSERT')
  })

  test('should update multiple items in database', async () => {
    // First create test items
    const testItems = [
      {
        sku: `TEST-SIMPLE-${Date.now()}-UPDATE-001`,
        name: 'Test Simple Update Item 1',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b',
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d',
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_price: 99.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-SIMPLE-${Date.now()}-UPDATE-002`,
        name: 'Test Simple Update Item 2',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b',
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d',
        quantity: 5,
        min_stock: 1,
        max_stock: 25,
        unit_price: 149.99,
        status: 'active',
        images: []
      }
    ]

    // Create items
    const { data: createdItems, error: createError } = await supabase
      .from('inventory')
      .insert(testItems)
      .select()

    expect(createError).toBeNull()
    expect(createdItems).toHaveLength(2)

    // Update items
    const updatePromises = createdItems!.map(item => 
      supabase
        .from('inventory')
        .update({
          quantity: 20,
          unit_price: 199.99
        })
        .eq('id', item.id)
        .select()
        .single()
    )

    const updateResults = await Promise.all(updatePromises)

    // Verify updates were successful
    expect(updateResults).toHaveLength(2)
    expect(updateResults[0].error).toBeNull()
    expect(updateResults[1].error).toBeNull()
    expect(updateResults[0].data!.quantity).toBe(20)
    expect(updateResults[1].data!.quantity).toBe(20)

    // Verify items were updated in database
    const { data: updatedItems } = await supabase
      .from('inventory')
      .select('*')
      .in('id', [createdItems![0].id, createdItems![1].id])

    expect(updatedItems).toHaveLength(2)
    expect(updatedItems![0].quantity).toBe(20)
    expect(updatedItems![0].unit_price).toBe(199.99)
    expect(updatedItems![1].quantity).toBe(20)
    expect(updatedItems![1].unit_price).toBe(199.99)

    // Verify audit logs were created for updates
    const { data: updateAuditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('operation', 'UPDATE')
      .in('record_id', [createdItems![0].id, createdItems![1].id])

    expect(updateAuditLogs).toHaveLength(2)
  })

  test('should delete multiple items from database', async () => {
    // First create test items
    const testItems = [
      {
        sku: `TEST-SIMPLE-${Date.now()}-DELETE-001`,
        name: 'Test Simple Delete Item 1',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b',
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d',
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_price: 99.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-SIMPLE-${Date.now()}-DELETE-002`,
        name: 'Test Simple Delete Item 2',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b',
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d',
        quantity: 5,
        min_stock: 1,
        max_stock: 25,
        unit_price: 149.99,
        status: 'active',
        images: []
      }
    ]

    // Create items
    const { data: createdItems, error: createError } = await supabase
      .from('inventory')
      .insert(testItems)
      .select()

    expect(createError).toBeNull()
    expect(createdItems).toHaveLength(2)

    // Delete items
    const deletePromises = createdItems!.map(item => 
      supabase
        .from('inventory')
        .delete()
        .eq('id', item.id)
    )

    const deleteResults = await Promise.all(deletePromises)

    // Verify deletions were successful
    expect(deleteResults).toHaveLength(2)
    expect(deleteResults[0].error).toBeNull()
    expect(deleteResults[1].error).toBeNull()

    // Verify items were deleted from database
    const { data: deletedItems } = await supabase
      .from('inventory')
      .select('*')
      .in('id', [createdItems![0].id, createdItems![1].id])

    // Items should be completely removed (hard delete)
    expect(deletedItems).toHaveLength(0)

    // Verify audit logs were created for deletions
    const { data: deleteAuditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('operation', 'DELETE')
      .in('record_id', [createdItems![0].id, createdItems![1].id])

    expect(deleteAuditLogs).toHaveLength(2)
  })

  test('should handle bulk operations with proper error handling', async () => {
    // Test with invalid data
    const invalidItems = [
      {
        sku: '', // Invalid: empty SKU
        name: 'Invalid Item',
        category_id: '44166394-996a-4c80-b48b-c6bf2e97387b',
        location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d',
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_price: 99.99,
        status: 'active',
        images: []
      }
    ]

    // This should fail due to empty SKU
    const { data: createdItems, error } = await supabase
      .from('inventory')
      .insert(invalidItems)
      .select()

    // Should fail due to validation
    expect(error).not.toBeNull()
    expect(error!.code).toBe('23505') // Unique constraint violation for empty SKU

    // Verify no items were created (check for items with empty SKU)
    const { data: dbItems } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', '')

    expect(dbItems).toHaveLength(0)
  })

  test('should verify database connectivity and basic operations', async () => {
    // Test basic connectivity
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1)

    expect(catError).toBeNull()
    expect(categories).toHaveLength(1)

    // Test locations
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name')
      .limit(1)

    expect(locError).toBeNull()
    expect(locations).toHaveLength(1)

    // Test inventory table
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('id, sku, name')
      .limit(1)

    expect(invError).toBeNull()
    // Inventory might be empty, so we just check no error

    console.log('✅ Database connectivity verified')
    console.log('✅ Categories table accessible')
    console.log('✅ Locations table accessible')
    console.log('✅ Inventory table accessible')
  })
})
