import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import handler from '@/app/api/v1/inventory/bulk/route'
import { auditedInventoryService } from '@/lib/database-with-audit'

// Mock the database service
vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    bulkCreate: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
    bulkStatusUpdate: vi.fn(),
    bulkCategoryUpdate: vi.fn(),
    bulkLocationUpdate: vi.fn(),
  }
}))

describe('/api/v1/inventory/bulk - Integration Tests', () => {
  const mockItems = [
    {
      id: '1',
      name: 'Test Item 1',
      sku: 'TEST-001',
      category_id: 'cat-1',
      location_id: 'loc-1',
      quantity: 10,
      status: 'active'
    },
    {
      id: '2',
      name: 'Test Item 2',
      sku: 'TEST-002',
      category_id: 'cat-2',
      location_id: 'loc-2',
      quantity: 5,
      status: 'active'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/inventory/bulk - Bulk Create', () => {
    const bulkCreateData = {
      operation: 'create',
      items: [
        {
          name: 'New Item 1',
          sku: 'NEW-001',
          description: 'New description 1',
          category_id: 'cat-1',
          location_id: 'loc-1',
          quantity: 20,
          min_quantity: 5,
          max_quantity: 100,
          unit_price: 25.99,
          status: 'active'
        },
        {
          name: 'New Item 2',
          sku: 'NEW-002',
          description: 'New description 2',
          category_id: 'cat-2',
          location_id: 'loc-2',
          quantity: 15,
          min_quantity: 3,
          max_quantity: 50,
          unit_price: 15.50,
          status: 'active'
        }
      ]
    }

    it('should create multiple inventory items successfully', async () => {
      const createdItems = [
        { id: '3', ...bulkCreateData.items[0], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: '4', ...bulkCreateData.items[1], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      ]
      auditedInventoryService.bulkCreate.mockResolvedValue({
        success: true,
        created: createdItems,
        errors: []
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkCreateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkCreateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.created).toEqual(createdItems)
      expect(data.errors).toEqual([])
      expect(auditedInventoryService.bulkCreate).toHaveBeenCalledWith(bulkCreateData.items)
    })

    it('should handle partial success with some validation errors', async () => {
      const createdItem = { id: '3', ...bulkCreateData.items[0], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      auditedInventoryService.bulkCreate.mockResolvedValue({
        success: true,
        created: [createdItem],
        errors: [
          {
            index: 1,
            item: bulkCreateData.items[1],
            error: 'SKU already exists'
          }
        ]
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkCreateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkCreateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(207) // Multi-Status
      expect(data.success).toBe(true)
      expect(data.created).toHaveLength(1)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0].error).toBe('SKU already exists')
    })

    it('should validate bulk create request structure', async () => {
      const invalidData = {
        operation: 'create',
        items: [] // Empty items array
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Items array cannot be empty')
    })

    it('should validate individual item data in bulk create', async () => {
      const invalidBulkData = {
        operation: 'create',
        items: [
          {
            name: 'Valid Item',
            sku: 'VALID-001',
            category_id: 'cat-1',
            location_id: 'loc-1',
            quantity: 10,
            unit_price: 25.99
          },
          {
            name: 'Invalid Item',
            // Missing required fields
            quantity: 'invalid'
          }
        ]
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidBulkData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidBulkData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid item at index 1')
    })

    it('should handle bulk create database errors', async () => {
      auditedInventoryService.bulkCreate.mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkCreateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkCreateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/v1/inventory/bulk - Bulk Update', () => {
    const bulkUpdateData = {
      operation: 'update',
      items: [
        {
          id: '1',
          name: 'Updated Item 1',
          quantity: 25,
          unit_price: 30.99
        },
        {
          id: '2',
          name: 'Updated Item 2',
          quantity: 15,
          unit_price: 20.50
        }
      ]
    }

    it('should update multiple inventory items successfully', async () => {
      const updatedItems = [
        { ...mockItems[0], ...bulkUpdateData.items[0], updated_at: '2024-01-02T00:00:00Z' },
        { ...mockItems[1], ...bulkUpdateData.items[1], updated_at: '2024-01-02T00:00:00Z' }
      ]
      auditedInventoryService.bulkUpdate.mockResolvedValue({
        success: true,
        updated: updatedItems,
        errors: []
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkUpdateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkUpdateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.updated).toEqual(updatedItems)
      expect(data.errors).toEqual([])
      expect(auditedInventoryService.bulkUpdate).toHaveBeenCalledWith(bulkUpdateData.items)
    })

    it('should handle partial updates with some errors', async () => {
      const updatedItem = { ...mockItems[0], ...bulkUpdateData.items[0], updated_at: '2024-01-02T00:00:00Z' }
      auditedInventoryService.bulkUpdate.mockResolvedValue({
        success: true,
        updated: [updatedItem],
        errors: [
          {
            index: 1,
            item: bulkUpdateData.items[1],
            error: 'Item not found'
          }
        ]
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkUpdateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkUpdateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(207)
      expect(data.success).toBe(true)
      expect(data.updated).toHaveLength(1)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0].error).toBe('Item not found')
    })

    it('should validate bulk update request structure', async () => {
      const invalidData = {
        operation: 'update',
        items: [
          {
            // Missing required id field
            name: 'Updated Item'
          }
        ]
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Item ID is required for updates')
    })
  })

  describe('POST /api/v1/inventory/bulk - Bulk Delete', () => {
    const bulkDeleteData = {
      operation: 'delete',
      itemIds: ['1', '2', '3']
    }

    it('should delete multiple inventory items successfully', async () => {
      auditedInventoryService.bulkDelete.mockResolvedValue({
        success: true,
        deleted: ['1', '2', '3'],
        errors: []
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkDeleteData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkDeleteData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.deleted).toEqual(['1', '2', '3'])
      expect(data.errors).toEqual([])
      expect(auditedInventoryService.bulkDelete).toHaveBeenCalledWith(bulkDeleteData.itemIds)
    })

    it('should handle partial deletion with some errors', async () => {
      auditedInventoryService.bulkDelete.mockResolvedValue({
        success: true,
        deleted: ['1', '2'],
        errors: [
          {
            itemId: '3',
            error: 'Item has active transactions'
          }
        ]
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkDeleteData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkDeleteData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(207)
      expect(data.success).toBe(true)
      expect(data.deleted).toEqual(['1', '2'])
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0].error).toBe('Item has active transactions')
    })

    it('should validate bulk delete request structure', async () => {
      const invalidData = {
        operation: 'delete',
        itemIds: [] // Empty array
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Item IDs array cannot be empty')
    })
  })

  describe('POST /api/v1/inventory/bulk - Bulk Status Update', () => {
    const bulkStatusData = {
      operation: 'status',
      itemIds: ['1', '2'],
      status: 'inactive'
    }

    it('should update status for multiple items successfully', async () => {
      auditedInventoryService.bulkStatusUpdate.mockResolvedValue({
        success: true,
        updated: ['1', '2'],
        errors: []
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkStatusData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkStatusData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.updated).toEqual(['1', '2'])
      expect(data.errors).toEqual([])
      expect(auditedInventoryService.bulkStatusUpdate).toHaveBeenCalledWith(
        bulkStatusData.itemIds,
        bulkStatusData.status
      )
    })

    it('should validate status values', async () => {
      const invalidData = {
        operation: 'status',
        itemIds: ['1', '2'],
        status: 'invalid_status'
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid status value')
    })
  })

  describe('POST /api/v1/inventory/bulk - Bulk Category Update', () => {
    const bulkCategoryData = {
      operation: 'category',
      itemIds: ['1', '2'],
      categoryId: 'cat-new'
    }

    it('should update category for multiple items successfully', async () => {
      auditedInventoryService.bulkCategoryUpdate.mockResolvedValue({
        success: true,
        updated: ['1', '2'],
        errors: []
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkCategoryData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkCategoryData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.updated).toEqual(['1', '2'])
      expect(data.errors).toEqual([])
      expect(auditedInventoryService.bulkCategoryUpdate).toHaveBeenCalledWith(
        bulkCategoryData.itemIds,
        bulkCategoryData.categoryId
      )
    })
  })

  describe('POST /api/v1/inventory/bulk - Bulk Location Update', () => {
    const bulkLocationData = {
      operation: 'location',
      itemIds: ['1', '2'],
      locationId: 'loc-new'
    }

    it('should update location for multiple items successfully', async () => {
      auditedInventoryService.bulkLocationUpdate.mockResolvedValue({
        success: true,
        updated: ['1', '2'],
        errors: []
      })

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: bulkLocationData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(bulkLocationData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.updated).toEqual(['1', '2'])
      expect(data.errors).toEqual([])
      expect(auditedInventoryService.bulkLocationUpdate).toHaveBeenCalledWith(
        bulkLocationData.itemIds,
        bulkLocationData.locationId
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle unsupported operation types', async () => {
      const invalidData = {
        operation: 'unsupported',
        itemIds: ['1', '2']
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Unsupported operation')
    })

    it('should handle missing operation field', async () => {
      const invalidData = {
        itemIds: ['1', '2']
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: invalidData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Operation is required')
    })

    it('should handle invalid JSON', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: 'invalid json',
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid JSON')
    })

    it('should handle missing content type', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/bulk',
        body: '{}',
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: '{}'
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Content-Type must be application/json')
    })

    it('should return 405 for non-POST methods', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/bulk',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('Only POST method is allowed')
    })
  })
})