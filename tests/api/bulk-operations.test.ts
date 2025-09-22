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

describe('Bulk Operations API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/v1/inventory/bulk - Create Operation', () => {
    it('should create items and invalidate cache successfully', async () => {
      // Mock the createMany function to return created items
      const mockCreatedItems = [
        {
          id: '1',
          sku: 'TEST-001',
          name: 'Test Item 1',
          category_id: 'cat-1',
          location_id: 'loc-1',
          quantity: 0,
          price: 0,
          min_stock: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          sku: 'TEST-002',
          name: 'Test Item 2',
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

      // Create request body
      const requestBody = {
        operation: 'create',
        items: [
          {
            sku: 'TEST-001',
            name: 'Test Item 1',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 0
          },
          {
            sku: 'TEST-002',
            name: 'Test Item 2',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 0
          }
        ]
      }

      // Create NextRequest
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

      // Assertions
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.successful).toBe(2)
      expect(responseData.data.failed).toBe(0)
      expect(responseData.data.items).toHaveLength(2)

      // Verify that createMany was called with correct parameters
      expect(optimizedInventoryService.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sku: 'TEST-001',
            name: 'Test Item 1'
          }),
          expect.objectContaining({
            sku: 'TEST-002',
            name: 'Test Item 2'
          })
        ]),
        expect.objectContaining({
          id: 'test-user-id',
          email: 'test@example.com'
        })
      )

      // Verify that cache invalidation was called
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
    })

    it('should handle create operation errors gracefully', async () => {
      // Mock createMany to throw an error
      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      ;(optimizedInventoryService.createMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const requestBody = {
        operation: 'create',
        items: [
          {
            sku: 'TEST-001',
            name: 'Test Item 1',
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

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toContain('Database error')

      // Verify that cache invalidation was NOT called on error
      expect(apiCacheManager.invalidateByTags).not.toHaveBeenCalled()
    })

    it('should validate request body structure', async () => {
      const requestBody = {
        operation: 'create',
        items: [] // Empty items array
      }

      const request = new NextRequest('http://localhost:3000/api/v1/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toContain('No items provided')
    })
  })

  describe('POST /api/v1/inventory/bulk - Update Operation', () => {
    it('should update items and invalidate cache successfully', async () => {
      const requestBody = {
        operation: 'update',
        items: [
          {
            id: '1',
            sku: 'TEST-001-UPDATED',
            name: 'Test Item 1 Updated',
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

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify that cache invalidation was called for successful updates
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
    })
  })

  describe('POST /api/v1/inventory/bulk - Delete Operation', () => {
    it('should delete items and invalidate cache successfully', async () => {
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

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify that cache invalidation was called for successful deletions
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
    })
  })
})
