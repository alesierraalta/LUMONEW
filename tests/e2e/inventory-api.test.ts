import { test, expect } from '@playwright/test'

// API endpoint tests for inventory functionality
test.describe('Inventory API Endpoints', () => {
  const baseUrl = 'http://localhost:3000'
  const testItem = {
    name: 'API Test Product',
    sku: 'API-001',
    category_id: '1',
    location_id: '1',
    quantity: 100,
    min_stock: 10,
    max_stock: 200,
    unit_price: 99.99,
    status: 'active'
  }

  // Helper function to get auth token
  async function getAuthToken() {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    })
    const data = await response.json()
    return data.token
  }

  test.beforeEach(async () => {
    // Clean up any existing test data
    try {
      const token = await getAuthToken()
      const response = await fetch(`${baseUrl}/api/inventory?sku=API-001`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.data && data.data.length > 0) {
        await fetch(`${baseUrl}/api/inventory?id=${data.data[0].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }
    } catch (error) {
      console.log('Cleanup failed:', error)
    }
  })

  // Basic CRUD API Tests
  test.describe('Basic CRUD Operations', () => {
    test('POST /api/inventory - should create inventory item', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/inventory`, {
        data: testItem
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(testItem.name)
      expect(data.data.sku).toBe(testItem.sku)
    })

    test('GET /api/inventory - should retrieve inventory items', async ({ request }) => {
      // First create an item
      await request.post(`${baseUrl}/api/inventory`, { data: testItem })

      const response = await request.get(`${baseUrl}/api/inventory`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
    })

    test('GET /api/inventory with filters - should filter results', async ({ request }) => {
      // First create an item
      await request.post(`${baseUrl}/api/inventory`, { data: testItem })

      const response = await request.get(`${baseUrl}/api/inventory?category=${testItem.category_id}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.every((item: any) => item.category_id === testItem.category_id)).toBe(true)
    })

    test('GET /api/inventory with search - should search by name and SKU', async ({ request }) => {
      // First create an item
      await request.post(`${baseUrl}/api/inventory`, { data: testItem })

      const response = await request.get(`${baseUrl}/api/inventory?search=${testItem.sku}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.some((item: any) => item.sku === testItem.sku)).toBe(true)
    })

    test('PUT /api/inventory - should update inventory item', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      const updateData = { ...testItem, name: 'Updated API Test Product' }
      const response = await request.put(`${baseUrl}/api/inventory?id=${createdItem.data.id}`, {
        data: updateData
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated API Test Product')
    })

    test('DELETE /api/inventory - should delete inventory item', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      const response = await request.delete(`${baseUrl}/api/inventory?id=${createdItem.data.id}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted successfully')
    })
  })

  // Optimized API Tests
  test.describe('Optimized Inventory API', () => {
    test('GET /api/inventory/items - should return paginated results', async ({ request }) => {
      // Create multiple items
      for (let i = 0; i < 5; i++) {
        await request.post(`${baseUrl}/api/inventory`, {
          data: { ...testItem, sku: `API-${i.toString().padStart(3, '0')}`, name: `API Test Product ${i}` }
        })
      }

      const response = await request.get(`${baseUrl}/api/inventory/items?page=1&limit=3`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.data).toHaveLength(3)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(3)
      expect(data.pagination.totalCount).toBeGreaterThanOrEqual(5)
    })

    test('GET /api/inventory/items with advanced filters - should filter correctly', async ({ request }) => {
      // Create items with different quantities
      await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'LOW-STOCK-001', quantity: 5, min_stock: 10 }
      })
      await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'NORMAL-STOCK-001', quantity: 50, min_stock: 10 }
      })

      const response = await request.get(`${baseUrl}/api/inventory/items?lowStock=true`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.data.every((item: any) => item.quantity <= item.min_stock)).toBe(true)
    })

    test('POST /api/inventory/items - should create single item', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/inventory/items`, {
        data: testItem
      })

      expect(response.status()).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.item.name).toBe(testItem.name)
    })

    test('POST /api/inventory/items - should create multiple items', async ({ request }) => {
      const items = [
        { ...testItem, sku: 'BULK-001', name: 'Bulk Item 1' },
        { ...testItem, sku: 'BULK-002', name: 'Bulk Item 2' }
      ]

      const response = await request.post(`${baseUrl}/api/inventory/items`, {
        data: items
      })

      expect(response.status()).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.created).toBe(2)
      expect(data.items).toHaveLength(2)
    })

    test('GET /api/inventory/items/[id] - should return specific item', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory/items`, { data: testItem })
      const createdItem = await createResponse.json()

      const response = await request.get(`${baseUrl}/api/inventory/items/${createdItem.item.id}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.item.id).toBe(createdItem.item.id)
      expect(data.item.name).toBe(testItem.name)
    })

    test('PUT /api/inventory/items/[id] - should update specific item', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory/items`, { data: testItem })
      const createdItem = await createResponse.json()

      const updateData = { name: 'Updated Item Name' }
      const response = await request.put(`${baseUrl}/api/inventory/items/${createdItem.item.id}`, {
        data: updateData
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.item.name).toBe('Updated Item Name')
    })

    test('DELETE /api/inventory/items/[id] - should delete specific item', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory/items`, { data: testItem })
      const createdItem = await createResponse.json()

      const response = await request.delete(`${baseUrl}/api/inventory/items/${createdItem.item.id}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted successfully')
    })
  })

  // V1 API Tests
  test.describe('V1 Inventory API', () => {
    test('GET /api/v1/inventory - should return advanced filtered results', async ({ request }) => {
      // Create test items
      await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'V1-001', name: 'V1 Test Product' }
      })

      const response = await request.get(`${baseUrl}/api/v1/inventory?search=V1&sortBy=name&sortOrder=asc`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.items).toBeDefined()
      expect(data.data.pagination).toBeDefined()
    })

    test('POST /api/v1/inventory - should create item with strict validation', async ({ request }) => {
      const v1Item = {
        name: 'V1 Test Product',
        sku: 'V1-001',
        categoryId: '1',
        locationId: '1',
        currentStock: 100,
        minimumLevel: 10,
        price: 99.99
      }

      const response = await request.post(`${baseUrl}/api/v1/inventory`, {
        data: v1Item
      })

      expect(response.status()).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(v1Item.name)
    })

    test('PUT /api/v1/inventory - should update item with ID validation', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      const updateData = { name: 'V1 Updated Product' }
      const response = await request.put(`${baseUrl}/api/v1/inventory?id=${createdItem.data.id}`, {
        data: updateData
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('V1 Updated Product')
    })

    test('DELETE /api/v1/inventory - should delete item with ID validation', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      const response = await request.delete(`${baseUrl}/api/v1/inventory?id=${createdItem.data.id}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted successfully')
    })
  })

  // Bulk Operations API Tests
  test.describe('Bulk Operations API', () => {
    test('POST /api/v1/inventory/bulk - should create multiple items', async ({ request }) => {
      const items = [
        { ...testItem, sku: 'BULK-API-001', name: 'Bulk API Item 1' },
        { ...testItem, sku: 'BULK-API-002', name: 'Bulk API Item 2' }
      ]

      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'create',
          items: items
        }
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.successful).toBe(2)
      expect(data.data.failed).toBe(0)
    })

    test('POST /api/v1/inventory/bulk - should update multiple items', async ({ request }) => {
      // First create items
      const createResponse1 = await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'BULK-UPDATE-001', name: 'Bulk Update Item 1' }
      })
      const createResponse2 = await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'BULK-UPDATE-002', name: 'Bulk Update Item 2' }
      })
      const item1 = await createResponse1.json()
      const item2 = await createResponse2.json()

      const updateItems = [
        { id: item1.data.id, name: 'Updated Bulk Item 1' },
        { id: item2.data.id, name: 'Updated Bulk Item 2' }
      ]

      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'update',
          items: updateItems
        }
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.successful).toBe(2)
      expect(data.data.failed).toBe(0)
    })

    test('DELETE /api/v1/inventory/bulk - should delete multiple items', async ({ request }) => {
      // First create items
      const createResponse1 = await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'BULK-DELETE-001', name: 'Bulk Delete Item 1' }
      })
      const createResponse2 = await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'BULK-DELETE-002', name: 'Bulk Delete Item 2' }
      })
      const item1 = await createResponse1.json()
      const item2 = await createResponse2.json()

      const response = await request.delete(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          ids: [item1.data.id, item2.data.id]
        }
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.successful).toBe(2)
      expect(data.data.failed).toBe(0)
    })

    test('POST /api/v1/inventory/bulk - should handle bulk operation errors', async ({ request }) => {
      const invalidItems = [
        { ...testItem, sku: '', name: 'Invalid Item 1' }, // Missing SKU
        { ...testItem, sku: 'VALID-001', name: 'Valid Item' }
      ]

      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'create',
          items: invalidItems
        }
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('missing required fields')
    })
  })

  // Analytics API Tests
  test.describe('Analytics API', () => {
    test('GET /api/v1/inventory/analytics - should return overview metrics', async ({ request }) => {
      // Create test items
      await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'ANALYTICS-001', name: 'Analytics Test Item' }
      })

      const response = await request.get(`${baseUrl}/api/v1/inventory/analytics?type=overview`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.metrics).toBeDefined()
      expect(data.data.metrics.totalItems).toBeGreaterThanOrEqual(1)
    })

    test('GET /api/v1/inventory/analytics - should return detailed analytics', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/inventory/analytics?type=detailed`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.analytics).toBeDefined()
      expect(data.data.analytics.stockLevels).toBeDefined()
    })

    test('GET /api/v1/inventory/analytics - should return trend analysis', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/inventory/analytics?type=trends`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.trends).toBeDefined()
      expect(data.data.trends.stockLevels).toBeDefined()
    })

    test('GET /api/v1/inventory/analytics - should return alerts', async ({ request }) => {
      // Create low stock item
      await request.post(`${baseUrl}/api/inventory`, {
        data: { ...testItem, sku: 'LOW-STOCK-ALERT', quantity: 5, min_stock: 10 }
      })

      const response = await request.get(`${baseUrl}/api/v1/inventory/analytics?type=alerts`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.alerts).toBeDefined()
      expect(data.data.alerts.lowStock).toBeDefined()
    })

    test('GET /api/v1/inventory/analytics - should return performance metrics', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/inventory/analytics?type=performance`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.performance).toBeDefined()
      expect(data.data.performance.averageResponseTime).toBeDefined()
    })

    test('POST /api/v1/inventory/analytics - should generate custom report', async ({ request }) => {
      const reportData = {
        reportType: 'inventory_summary',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        },
        filters: {
          category: '1'
        },
        metrics: ['totalItems', 'totalValue'],
        groupBy: 'category'
      }

      const response = await request.post(`${baseUrl}/api/v1/inventory/analytics`, {
        data: reportData
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.reportType).toBe('inventory_summary')
      expect(data.data.data).toBeDefined()
    })
  })

  // Image Upload API Tests
  test.describe('Image Upload API', () => {
    test('POST /api/inventory/upload-image - should upload image', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      // Create a test image file
      const testImageBuffer = Buffer.from('fake-image-data')
      const formData = new FormData()
      formData.append('image', new Blob([testImageBuffer], { type: 'image/jpeg' }), 'test-image.jpg')
      formData.append('itemId', createdItem.data.id)

      const response = await request.post(`${baseUrl}/api/inventory/upload-image`, {
        multipart: {
          image: {
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: testImageBuffer
          },
          itemId: createdItem.data.id
        }
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.imageUrl).toBeDefined()
      expect(data.fileName).toBeDefined()
    })

    test('POST /api/inventory/upload-image - should reject invalid file type', async ({ request }) => {
      // First create an item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      // Try to upload invalid file type
      const testFileBuffer = Buffer.from('fake-file-data')
      const response = await request.post(`${baseUrl}/api/inventory/upload-image`, {
        multipart: {
          image: {
            name: 'test-file.txt',
            mimeType: 'text/plain',
            buffer: testFileBuffer
          },
          itemId: createdItem.data.id
        }
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid file type')
    })

    test('DELETE /api/inventory/upload-image - should delete image', async ({ request }) => {
      // First upload an image
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      const testImageBuffer = Buffer.from('fake-image-data')
      const uploadResponse = await request.post(`${baseUrl}/api/inventory/upload-image`, {
        multipart: {
          image: {
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: testImageBuffer
          },
          itemId: createdItem.data.id
        }
      })
      const uploadData = await uploadResponse.json()

      // Now delete the image
      const response = await request.delete(`${baseUrl}/api/inventory/upload-image?filePath=${uploadData.filePath}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted successfully')
    })
  })

  // Transaction API Tests
  test.describe('Transaction API', () => {
    test('GET /api/transactions - should return transaction list', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/transactions`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('GET /api/transactions with filters - should filter transactions', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/transactions?type=sale&limit=10`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.every((txn: any) => txn.type === 'sale')).toBe(true)
    })

    test('POST /api/transactions - should create transaction', async ({ request }) => {
      // First create an inventory item
      const createResponse = await request.post(`${baseUrl}/api/inventory`, { data: testItem })
      const createdItem = await createResponse.json()

      const transactionData = {
        type: 'sale',
        lineItems: [
          {
            product: {
              id: createdItem.data.id,
              sku: createdItem.data.sku,
              name: createdItem.data.name
            },
            quantity: 2,
            unitPrice: createdItem.data.unit_price,
            totalPrice: createdItem.data.unit_price * 2
          }
        ],
        subtotal: createdItem.data.unit_price * 2,
        tax: createdItem.data.unit_price * 2 * 0.16,
        taxRate: 0.16,
        total: createdItem.data.unit_price * 2 * 1.16,
        notes: 'Test transaction',
        createdBy: 'test-user'
      }

      const response = await request.post(`${baseUrl}/api/transactions`, {
        data: transactionData
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.type).toBe('sale')
      expect(data.data.lineItems).toHaveLength(1)
    })

    test('DELETE /api/transactions - should reset transaction history', async ({ request }) => {
      const response = await request.delete(`${baseUrl}/api/transactions`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('reset successfully')
    })
  })

  // Error Handling Tests
  test.describe('Error Handling', () => {
    test('should return 400 for missing required fields', async ({ request }) => {
      const invalidItem = {
        name: 'Test Item'
        // Missing required fields: sku, category_id, location_id, etc.
      }

      const response = await request.post(`${baseUrl}/api/inventory`, {
        data: invalidItem
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required fields')
    })

    test('should return 409 for duplicate SKU', async ({ request }) => {
      // First create an item
      await request.post(`${baseUrl}/api/inventory`, { data: testItem })

      // Try to create another item with same SKU
      const duplicateItem = { ...testItem, name: 'Different Name' }
      const response = await request.post(`${baseUrl}/api/inventory`, {
        data: duplicateItem
      })

      expect(response.status()).toBe(409)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('SKU already exists')
    })

    test('should return 404 for non-existent item', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/inventory/items/non-existent-id`)
      expect(response.status()).toBe(404)
      
      const data = await response.json()
      expect(data.error).toContain('Item not found')
    })

    test('should return 400 for invalid bulk operation', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'invalid_operation',
          items: []
        }
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid operation')
    })

    test('should return 400 for bulk operation without items', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'create'
          // Missing items array
        }
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Items array is required')
    })

    test('should return 400 for bulk operation with too many items', async ({ request }) => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        ...testItem,
        sku: `BULK-LIMIT-${i.toString().padStart(3, '0')}`,
        name: `Bulk Limit Item ${i}`
      }))

      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'create',
          items: items
        }
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Request too large')
    })
  })

  // Performance Tests
  test.describe('Performance Tests', () => {
    test('should handle large pagination requests efficiently', async ({ request }) => {
      const startTime = Date.now()
      
      const response = await request.get(`${baseUrl}/api/inventory/items?page=1&limit=100`)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(2000) // Should respond within 2 seconds
      
      const data = await response.json()
      expect(data.data.length).toBeLessThanOrEqual(100)
    })

    test('should handle bulk operations efficiently', async ({ request }) => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        ...testItem,
        sku: `PERF-BULK-${i.toString().padStart(3, '0')}`,
        name: `Performance Bulk Item ${i}`
      }))

      const startTime = Date.now()
      
      const response = await request.post(`${baseUrl}/api/v1/inventory/bulk`, {
        data: {
          operation: 'create',
          items: items
        }
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      const data = await response.json()
      expect(data.data.successful).toBe(50)
    })
  })
})