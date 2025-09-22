import { NextRequest } from 'next/server'
import { POST } from '@/app/api/v1/inventory/bulk/route'
import { apiCacheManager } from '@/lib/cache/api-cache-manager'

// Mock the dependencies
jest.mock('@/lib/cache/api-cache-manager', () => ({
  apiCacheManager: {
    invalidateByTags: jest.fn()
  }
}))

jest.mock('@/lib/services/optimized-inventory-service', () => ({
  optimizedInventoryService: {
    createMany: jest.fn()
  }
}))

jest.mock('@/lib/supabase/server-with-retry', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      }))
    }
  }))
}))

describe('Cache Invalidation in Bulk Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Cache Invalidation After Bulk Create', () => {
    it('should invalidate cache immediately after successful bulk create', async () => {
      // Mock successful creation
      const mockCreatedItems = [
        {
          id: '1',
          sku: 'TEST-CACHE-001',
          name: 'Test Cache Item 1',
          category_id: 'cat-1',
          location_id: 'loc-1',
          quantity: 0,
          price: 0,
          min_stock: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.createMany as jest.Mock).mockResolvedValue(mockCreatedItems)

      // Create request
      const requestBody = {
        operation: 'create',
        items: [
          {
            sku: 'TEST-CACHE-001',
            name: 'Test Cache Item 1',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 0
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify cache invalidation was called
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledTimes(1)
    })

    it('should not invalidate cache if bulk create fails', async () => {
      // Mock failed creation
      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.createMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const requestBody = {
        operation: 'create',
        items: [
          {
            sku: 'TEST-CACHE-002',
            name: 'Test Cache Item 2',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 0
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)

      // Verify cache invalidation was NOT called
      expect(apiCacheManager.invalidateByTags).not.toHaveBeenCalled()
    })

    it('should invalidate cache with correct tags', async () => {
      // Mock successful creation
      const mockCreatedItems = [
        {
          id: '1',
          sku: 'TEST-CACHE-003',
          name: 'Test Cache Item 3',
          category_id: 'cat-1',
          location_id: 'loc-1',
          quantity: 0,
          price: 0,
          min_stock: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.createMany as jest.Mock).mockResolvedValue(mockCreatedItems)

      const requestBody = {
        operation: 'create',
        items: [
          {
            sku: 'TEST-CACHE-003',
            name: 'Test Cache Item 3',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 0
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      await POST(request)

      // Verify cache invalidation was called with correct tags
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
      
      // Verify the tags are exactly what we expect
      const callArgs = (apiCacheManager.invalidateByTags as jest.Mock).mock.calls[0][0]
      expect(callArgs).toEqual(['inventory', 'list'])
      expect(callArgs).toHaveLength(2)
      expect(callArgs).toContain('inventory')
      expect(callArgs).toContain('list')
    })
  })

  describe('Cache Invalidation After Bulk Update', () => {
    it('should invalidate cache after successful bulk update', async () => {
      const requestBody = {
        operation: 'update',
        items: [
          {
            id: '1',
            sku: 'TEST-CACHE-004',
            name: 'Test Cache Item 4 Updated',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 10
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify cache invalidation was called
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
    })

    it('should not invalidate cache if no items were successfully updated', async () => {
      // Mock the update to return no successful updates
      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Item not found'
      })

      const requestBody = {
        operation: 'update',
        items: [
          {
            id: '999', // Non-existent ID
            sku: 'TEST-CACHE-005',
            name: 'Test Cache Item 5',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 10
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.successful).toBe(0)
      expect(responseData.data.failed).toBe(1)

      // Verify cache invalidation was NOT called (no successful updates)
      expect(apiCacheManager.invalidateByTags).not.toHaveBeenCalled()
    })
  })

  describe('Cache Invalidation After Bulk Delete', () => {
    it('should invalidate cache after successful bulk delete', async () => {
      const requestBody = {
        operation: 'delete',
        ids: ['1', '2', '3']
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify cache invalidation was called
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
    })

    it('should not invalidate cache if no items were successfully deleted', async () => {
      // Mock the delete to return no successful deletions
      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.delete as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Item not found'
      })

      const requestBody = {
        operation: 'delete',
        ids: ['999', '998', '997'] // Non-existent IDs
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Call the API
      const response = await POST(request)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.successful).toBe(0)
      expect(responseData.data.failed).toBe(3)

      // Verify cache invalidation was NOT called (no successful deletions)
      expect(apiCacheManager.invalidateByTags).not.toHaveBeenCalled()
    })
  })

  describe('Cache Invalidation Timing', () => {
    it('should invalidate cache synchronously with the operation', async () => {
      const mockCreatedItems = [
        {
          id: '1',
          sku: 'TEST-CACHE-006',
          name: 'Test Cache Item 6',
          category_id: 'cat-1',
          location_id: 'loc-1',
          quantity: 0,
          price: 0,
          min_stock: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.createMany as jest.Mock).mockResolvedValue(mockCreatedItems)

      const requestBody = {
        operation: 'create',
        items: [
          {
            sku: 'TEST-CACHE-006',
            name: 'Test Cache Item 6',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 0
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Record timing
      const startTime = Date.now()
      await POST(request)
      const endTime = Date.now()

      // Verify cache invalidation was called
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])

      // Verify the operation completed quickly (cache invalidation should be fast)
      const duration = endTime - startTime
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })
  })
})
