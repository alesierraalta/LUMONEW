import { test, expect } from '@playwright/test'

test.describe('Inventory Status API Tests', () => {
  test('should return correct inventory status from API', async ({ request }) => {
    // Test the inventory items API endpoint
    const response = await request.get('/api/inventory/items')
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    
    // Should return inventory data
    expect(data).toBeDefined()
    
    // If data is paginated, check the structure
    if (data.data && Array.isArray(data.data)) {
      expect(Array.isArray(data.data)).toBe(true)
      
      // If there are items, validate their structure
      if (data.data.length > 0) {
        const item = data.data[0]
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('sku')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('quantity')
        expect(item).toHaveProperty('min_stock')
        expect(item).toHaveProperty('unit_price')
      }
    } else if (Array.isArray(data)) {
      // Direct array format
      expect(Array.isArray(data)).toBe(true)
      
      if (data.length > 0) {
        const item = data[0]
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('sku')
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('quantity')
        expect(item).toHaveProperty('min_stock')
        expect(item).toHaveProperty('unit_price')
      }
    }
  })

  test('should update inventory status after bulk create operation', async ({ request }) => {
    // Get initial inventory count
    const initialResponse = await request.get('/api/inventory/items')
    const initialData = await initialResponse.json()
    
    let initialCount = 0
    if (initialData.data && Array.isArray(initialData.data)) {
      initialCount = initialData.data.length
    } else if (Array.isArray(initialData)) {
      initialCount = initialData.length
    }

    console.log(`Initial inventory count: ${initialCount}`)

    // Create a test item via bulk API
    const testSku = `TEST-API-${Date.now()}`
    const bulkCreateData = {
      operation: 'create',
      items: [
        {
          sku: testSku,
          name: 'Test API Item',
          category_id: '44166394-996a-4c80-b48b-c6bf2e97387b', // Electronics
          location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d', // Main Warehouse
          quantity: 10,
          min_stock: 2,
          max_stock: 50,
          unit_price: 99.99,
          status: 'active',
          images: []
        }
      ]
    }

    const createResponse = await request.post('/api/v1/inventory/bulk', {
      data: bulkCreateData
    })

    expect(createResponse.status()).toBe(200)
    
    const createResult = await createResponse.json()
    expect(createResult.successful).toBe(1)
    expect(createResult.failed).toBe(0)

    // Wait a moment for the operation to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get updated inventory count
    const updatedResponse = await request.get('/api/inventory/items')
    const updatedData = await updatedResponse.json()
    
    let updatedCount = 0
    if (updatedData.data && Array.isArray(updatedData.data)) {
      updatedCount = updatedData.data.length
    } else if (Array.isArray(updatedData)) {
      updatedCount = updatedData.length
    }

    console.log(`Updated inventory count: ${updatedCount}`)

    // Verify the count increased
    expect(updatedCount).toBe(initialCount + 1)

    // Verify the new item exists in the API response
    let foundItem = false
    if (updatedData.data && Array.isArray(updatedData.data)) {
      foundItem = updatedData.data.some((item: any) => item.sku === testSku)
    } else if (Array.isArray(updatedData)) {
      foundItem = updatedData.some((item: any) => item.sku === testSku)
    }

    expect(foundItem).toBe(true)
  })

  test('should update inventory status after bulk update operation', async ({ request }) => {
    // First create a test item
    const testSku = `TEST-API-UPDATE-${Date.now()}`
    const bulkCreateData = {
      operation: 'create',
      items: [
        {
          sku: testSku,
          name: 'Test API Update Item',
          category_id: '44166394-996a-4c80-b48b-c6bf2e97387b',
          location_id: '424acea8-70c2-46c6-9a2e-e7ee0ba6a72d',
          quantity: 10,
          min_stock: 5,
          max_stock: 50,
          unit_price: 99.99,
          status: 'active',
          images: []
        }
      ]
    }

    const createResponse = await request.post('/api/v1/inventory/bulk', {
      data: bulkCreateData
    })

    expect(createResponse.status()).toBe(200)
    const createResult = await createResponse.json()
    const createdItemId = createResult.items[0].id

    // Wait for creation to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Now update the item to make it low stock
    const bulkUpdateData = {
      operation: 'update',
      items: [
        {
          id: createdItemId,
          quantity: 3 // Below min_stock of 5
        }
      ]
    }

    const updateResponse = await request.post('/api/v1/inventory/bulk', {
      data: bulkUpdateData
    })

    expect(updateResponse.status()).toBe(200)
    
    const updateResult = await updateResponse.json()
    expect(updateResult.successful).toBe(1)
    expect(updateResult.failed).toBe(0)

    // Wait for update to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verify the item was updated
    const getResponse = await request.get('/api/inventory/items')
    const getData = await getResponse.json()
    
    let updatedItem = null
    if (getData.data && Array.isArray(getData.data)) {
      updatedItem = getData.data.find((item: any) => item.id === createdItemId)
    } else if (Array.isArray(getData)) {
      updatedItem = getData.find((item: any) => item.id === createdItemId)
    }

    expect(updatedItem).toBeDefined()
    expect(updatedItem.quantity).toBe(3)
  })

  test('should update inventory status after bulk delete operation', async ({ request }) => {
    // First create a test item
    const testSku = `TEST-API-DELETE-${Date.now()}`
    const bulkCreateData = {
      operation: 'create',
      items: [
        {
          sku: testSku,
          name: 'Test API Delete Item',
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
    }

    const createResponse = await request.post('/api/v1/inventory/bulk', {
      data: bulkCreateData
    })

    expect(createResponse.status()).toBe(200)
    const createResult = await createResponse.json()
    const createdItemId = createResult.items[0].id

    // Wait for creation to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get count before deletion
    const beforeDeleteResponse = await request.get('/api/inventory/items')
    const beforeDeleteData = await beforeDeleteResponse.json()
    
    let beforeDeleteCount = 0
    if (beforeDeleteData.data && Array.isArray(beforeDeleteData.data)) {
      beforeDeleteCount = beforeDeleteData.data.length
    } else if (Array.isArray(beforeDeleteData)) {
      beforeDeleteCount = beforeDeleteData.length
    }

    // Now delete the item
    const bulkDeleteData = {
      operation: 'delete',
      items: [
        {
          id: createdItemId
        }
      ]
    }

    const deleteResponse = await request.post('/api/v1/inventory/bulk', {
      data: bulkDeleteData
    })

    expect(deleteResponse.status()).toBe(200)
    
    const deleteResult = await deleteResponse.json()
    expect(deleteResult.successful).toBe(1)
    expect(deleteResult.failed).toBe(0)

    // Wait for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get count after deletion
    const afterDeleteResponse = await request.get('/api/inventory/items')
    const afterDeleteData = await afterDeleteResponse.json()
    
    let afterDeleteCount = 0
    if (afterDeleteData.data && Array.isArray(afterDeleteData.data)) {
      afterDeleteCount = afterDeleteData.data.length
    } else if (Array.isArray(afterDeleteData)) {
      afterDeleteCount = afterDeleteData.length
    }

    // Verify the count decreased
    expect(afterDeleteCount).toBe(beforeDeleteCount - 1)

    // Verify the item no longer exists
    let foundItem = false
    if (afterDeleteData.data && Array.isArray(afterDeleteData.data)) {
      foundItem = afterDeleteData.data.some((item: any) => item.id === createdItemId)
    } else if (Array.isArray(afterDeleteData)) {
      foundItem = afterDeleteData.some((item: any) => item.id === createdItemId)
    }

    expect(foundItem).toBe(false)
  })

  test('should handle API cache invalidation correctly', async ({ request }) => {
    // This test verifies that the API cache is properly invalidated after bulk operations
    
    // Get initial response
    const initialResponse = await request.get('/api/inventory/items')
    const initialData = await initialResponse.json()
    
    // Create an item
    const testSku = `TEST-CACHE-${Date.now()}`
    const bulkCreateData = {
      operation: 'create',
      items: [
        {
          sku: testSku,
          name: 'Test Cache Item',
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
    }

    const createResponse = await request.post('/api/v1/inventory/bulk', {
      data: bulkCreateData
    })

    expect(createResponse.status()).toBe(200)

    // Wait for cache invalidation
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Get updated response - should include the new item
    const updatedResponse = await request.get('/api/inventory/items')
    const updatedData = await updatedResponse.json()
    
    // Verify the new item is in the response (cache was invalidated)
    let foundItem = false
    if (updatedData.data && Array.isArray(updatedData.data)) {
      foundItem = updatedData.data.some((item: any) => item.sku === testSku)
    } else if (Array.isArray(updatedData)) {
      foundItem = updatedData.some((item: any) => item.sku === testSku)
    }

    expect(foundItem).toBe(true)
  })
})
