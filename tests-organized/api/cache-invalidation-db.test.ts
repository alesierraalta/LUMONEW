import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { apiCacheManager } from '@/lib/cache/api-cache-manager'

// Test configuration for database testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbtninlyzpdemyudaqg.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'

// Skip tests if no valid Supabase configuration
const skipTests = !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

test.describe('Cache Invalidation Database Tests', () => {
  test.beforeEach(async () => {
    if (skipTests) {
      test.skip('Skipping database tests - Supabase configuration not available')
      return
    }
    // Clean up any existing test data
    await supabase
      .from('inventory')
      .delete()
      .like('sku', 'TEST-CACHE-%')
    
    // Clear cache before each test
    await apiCacheManager.clear()
  })

  test.afterEach(async () => {
    // Clean up test data after each test
    await supabase
      .from('inventory')
      .delete()
      .like('sku', 'TEST-CACHE-%')
    
    // Clear cache after each test
    await apiCacheManager.clear()
  })

  test('should invalidate cache after bulk create operation', async () => {
    // First, populate cache with initial data
    const cacheKey = '/api/inventory/items'
    const initialData = {
      data: [
        { id: '1', sku: 'EXISTING-001', name: 'Existing Item' }
      ]
    }
    
    await apiCacheManager.set(cacheKey, initialData, { tags: ['inventory', 'list'] })

    // Verify cache is populated
    const cachedData = await apiCacheManager.get(cacheKey)
    expect(cachedData).toEqual(initialData)

    // Create new item in database
    const testSku = `TEST-CACHE-${Date.now()}-001`
    const { data: createdItem, error } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test Cache Item',
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

    expect(error).toBeNull()
    expect(createdItem).not.toBeNull()

    // Simulate cache invalidation after bulk create
    await apiCacheManager.invalidateByTags(['inventory', 'list'])

    // Verify cache is cleared
    const clearedCache = await apiCacheManager.get(cacheKey)
    expect(clearedCache).toBeNull()

    // Verify new item exists in database
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', testSku)
      .single()

    expect(dbItem).not.toBeNull()
    expect(dbItem!.name).toBe('Test Cache Item')
  })

  test('should invalidate cache after bulk update operation', async () => {
    // First create an item in database
    const testSku = `TEST-CACHE-${Date.now()}-UPDATE`
    const { data: createdItem, error: createError } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test Cache Update Item',
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

    // Populate cache with item data
    const cacheKey = '/api/inventory/items'
    const cachedData = {
      data: [createdItem]
    }
    
    await apiCacheManager.set(cacheKey, cachedData, { tags: ['inventory', 'list'] })

    // Verify cache is populated
    const retrievedCache = await apiCacheManager.get(cacheKey)
    expect(retrievedCache).toEqual(cachedData)

    // Update item in database
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory')
      .update({
        quantity: 20,
        unit_price: 199.99
      })
      .eq('id', createdItem!.id)
      .select()
      .single()

    expect(updateError).toBeNull()
    expect(updatedItem!.quantity).toBe(20)
    expect(updatedItem!.unit_price).toBe(199.99)

    // Simulate cache invalidation after bulk update
    await apiCacheManager.invalidateByTags(['inventory', 'list'])

    // Verify cache is cleared
    const clearedCache = await apiCacheManager.get(cacheKey)
    expect(clearedCache).toBeNull()

    // Verify updated item exists in database
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem!.id)
      .single()

    expect(dbItem).not.toBeNull()
    expect(dbItem!.quantity).toBe(20)
    expect(dbItem!.unit_price).toBe(199.99)
  })

  test('should invalidate cache after bulk delete operation', async () => {
    // First create an item in database
    const testSku = `TEST-CACHE-${Date.now()}-DELETE`
    const { data: createdItem, error: createError } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test Cache Delete Item',
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

    // Populate cache with item data
    const cacheKey = '/api/inventory/items'
    const cachedData = {
      data: [createdItem]
    }
    
    await apiCacheManager.set(cacheKey, cachedData, { tags: ['inventory', 'list'] })

    // Verify cache is populated
    const retrievedCache = await apiCacheManager.get(cacheKey)
    expect(retrievedCache).toEqual(cachedData)

    // Soft delete item in database
    const { data: deletedItem, error: deleteError } = await supabase
      .from('inventory')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', createdItem!.id)
      .select()
      .single()

    expect(deleteError).toBeNull()
    expect(deletedItem!.deleted_at).not.toBeNull()

    // Simulate cache invalidation after bulk delete
    await apiCacheManager.invalidateByTags(['inventory', 'list'])

    // Verify cache is cleared
    const clearedCache = await apiCacheManager.get(cacheKey)
    expect(clearedCache).toBeNull()

    // Verify item is soft deleted in database
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem!.id)
      .single()

    expect(dbItem).not.toBeNull()
    expect(dbItem!.deleted_at).not.toBeNull()
  })

  test('should handle cache invalidation timing correctly', async () => {
    // Create multiple items in database
    const testItems = [
      {
        sku: `TEST-CACHE-${Date.now()}-TIMING-001`,
        name: 'Test Cache Timing Item 1',
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
        sku: `TEST-CACHE-${Date.now()}-TIMING-002`,
        name: 'Test Cache Timing Item 2',
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

    // Create items in database
    const { data: createdItems, error } = await supabase
      .from('inventory')
      .insert(testItems)
      .select()

    expect(error).toBeNull()
    expect(createdItems).toHaveLength(2)

    // Populate cache with initial data
    const cacheKey = '/api/inventory/items'
    const initialCacheData = {
      data: createdItems
    }
    
    await apiCacheManager.set(cacheKey, initialCacheData, { tags: ['inventory', 'list'] })

    // Verify cache is populated
    const retrievedCache = await apiCacheManager.get(cacheKey)
    expect(retrievedCache).toEqual(initialCacheData)

    // Record timing for cache invalidation
    const startTime = Date.now()

    // Simulate cache invalidation after bulk operation
    await apiCacheManager.invalidateByTags(['inventory', 'list'])

    const endTime = Date.now()
    const duration = endTime - startTime

    // Verify cache invalidation is fast (should be less than 100ms)
    expect(duration).toBeLessThan(100)

    // Verify cache is cleared
    const clearedCache = await apiCacheManager.get(cacheKey)
    expect(clearedCache).toBeNull()

    // Verify items still exist in database
    const { data: dbItems } = await supabase
      .from('inventory')
      .select('*')
      .in('sku', testItems.map(item => item.sku))

    expect(dbItems).toHaveLength(2)
    expect(dbItems![0].name).toBe('Test Cache Timing Item 1')
    expect(dbItems![1].name).toBe('Test Cache Timing Item 2')
  })

  test('should handle multiple cache entries with inventory tag', async () => {
    // Create multiple cache entries with inventory tag
    const cacheEntries = [
      { key: '/api/inventory/items', data: { items: [] }, tags: ['inventory', 'list'] },
      { key: '/api/inventory/low-stock', data: { items: [] }, tags: ['inventory', 'low-stock'] },
      { key: '/api/inventory/out-of-stock', data: { items: [] }, tags: ['inventory', 'out-of-stock'] },
      { key: '/api/categories', data: { categories: [] }, tags: ['categories', 'list'] }
    ]

    // Set up cache entries
    for (const entry of cacheEntries) {
      await apiCacheManager.set(entry.key, entry.data, { tags: entry.tags })
    }

    // Verify all entries exist
    for (const entry of cacheEntries) {
      const cachedData = await apiCacheManager.get(entry.key)
      expect(cachedData).toEqual(entry.data)
    }

    // Create item in database
    const testSku = `TEST-CACHE-${Date.now()}-MULTIPLE`
    const { data: createdItem, error } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test Cache Multiple Item',
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

    expect(error).toBeNull()
    expect(createdItem).not.toBeNull()

    // Invalidate all inventory-related cache
    await apiCacheManager.invalidateByTags(['inventory'])

    // Verify all inventory cache entries are cleared
    const inventoryCacheEntries = cacheEntries.filter(entry => entry.tags.includes('inventory'))
    for (const entry of inventoryCacheEntries) {
      const clearedCache = await apiCacheManager.get(entry.key)
      expect(clearedCache).toBeNull()
    }

    // Verify categories cache entry is still there
    const categoriesCache = await apiCacheManager.get('/api/categories')
    expect(categoriesCache).toEqual({ categories: [] })

    // Verify item exists in database
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', testSku)
      .single()

    expect(dbItem).not.toBeNull()
    expect(dbItem!.name).toBe('Test Cache Multiple Item')
  })

  test('should handle cache invalidation with database transactions', async () => {
    // Start a database transaction
    const { data: transactionResult, error: transactionError } = await supabase
      .rpc('begin_transaction')

    expect(transactionError).toBeNull()

    // Create item in database within transaction
    const testSku = `TEST-CACHE-${Date.now()}-TRANSACTION`
    const { data: createdItem, error: createError } = await supabase
      .from('inventory')
      .insert({
        sku: testSku,
        name: 'Test Cache Transaction Item',
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

    // Populate cache
    const cacheKey = '/api/inventory/items'
    const cachedData = {
      data: [createdItem]
    }
    
    await apiCacheManager.set(cacheKey, cachedData, { tags: ['inventory', 'list'] })

    // Verify cache is populated
    const retrievedCache = await apiCacheManager.get(cacheKey)
    expect(retrievedCache).toEqual(cachedData)

    // Simulate cache invalidation after transaction commit
    await apiCacheManager.invalidateByTags(['inventory', 'list'])

    // Verify cache is cleared
    const clearedCache = await apiCacheManager.get(cacheKey)
    expect(clearedCache).toBeNull()

    // Commit transaction
    const { error: commitError } = await supabase
      .rpc('commit_transaction')

    expect(commitError).toBeNull()

    // Verify item exists in database after commit
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', testSku)
      .single()

    expect(dbItem).not.toBeNull()
    expect(dbItem!.name).toBe('Test Cache Transaction Item')
  })
})
