import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/v1/inventory/route'
import { inventoryService } from '@/lib/database'
import { auditedInventoryService } from '@/lib/database-with-audit'

// Mock the database services
vi.mock('@/lib/database', () => ({
  inventoryService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    getByCategory: vi.fn(),
    getByLocation: vi.fn(),
    getLowStock: vi.fn(),
    getBySku: vi.fn(),
    bulkCreate: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
    getAnalytics: vi.fn(),
    exportToCSV: vi.fn(),
    importFromCSV: vi.fn(),
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    getByCategory: vi.fn(),
    getByLocation: vi.fn(),
    getLowStock: vi.fn(),
    getBySku: vi.fn(),
    bulkCreate: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
    getAnalytics: vi.fn(),
    exportToCSV: vi.fn(),
    importFromCSV: vi.fn(),
  }
}))

describe('/api/v1/inventory - Comprehensive Integration Tests', () => {
  const mockItems = [
    {
      id: '1',
      name: 'Test Item 1',
      sku: 'TEST-001',
      description: 'Test description 1',
      category_id: 'cat-1',
      location_id: 'loc-1',
      quantity: 10,
      min_quantity: 5,
      max_quantity: 100,
      unit_price: 25.99,
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Test Item 2',
      sku: 'TEST-002',
      description: 'Test description 2',
      category_id: 'cat-2',
      location_id: 'loc-2',
      quantity: 3,
      min_quantity: 5,
      max_quantity: 50,
      unit_price: 15.50,
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/v1/inventory', () => {
    it('should return all inventory items with default pagination', async () => {
      auditedInventoryService.getAll.mockResolvedValue({
        items: mockItems,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toEqual(mockItems)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
      expect(auditedInventoryService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      })
    })

    it('should handle custom pagination parameters', async () => {
      auditedInventoryService.getAll.mockResolvedValue({
        items: [mockItems[0]],
        total: 1,
        page: 2,
        limit: 1,
        totalPages: 2
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?page=2&limit=1&sortBy=sku&sortOrder=desc',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(2)
      expect(data.limit).toBe(1)
      expect(auditedInventoryService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 1,
        sortBy: 'sku',
        sortOrder: 'desc'
      })
    })

    it('should filter by category', async () => {
      auditedInventoryService.getAll.mockResolvedValue({
        items: [mockItems[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?category=cat-1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        category: 'cat-1'
      })
    })

    it('should filter by location', async () => {
      auditedInventoryService.getAll.mockResolvedValue({
        items: [mockItems[1]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?location=loc-2',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        location: 'loc-2'
      })
    })

    it('should filter by status', async () => {
      auditedInventoryService.getAll.mockResolvedValue({
        items: mockItems,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?status=active',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        status: 'active'
      })
    })

    it('should search by text query', async () => {
      auditedInventoryService.search.mockResolvedValue({
        items: [mockItems[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?q=Test Item 1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.search).toHaveBeenCalledWith({
        query: 'Test Item 1',
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      })
    })

    it('should handle low stock filter', async () => {
      auditedInventoryService.getLowStock.mockResolvedValue({
        items: [mockItems[1]], // Item with quantity 3, min_quantity 5
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?lowStock=true',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getLowStock).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      })
    })

    it('should handle server errors', async () => {
      auditedInventoryService.getAll.mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Database connection failed')
    })

    it('should validate pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?page=0&limit=0',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Page must be greater than 0')
    })

    it('should validate sort parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/inventory?sortBy=invalid_field',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid sort field')
    })
  })

  describe('POST /api/v1/inventory', () => {
    const validItem = {
      name: 'New Test Item',
      sku: 'NEW-001',
      description: 'New test description',
      category_id: 'cat-1',
      location_id: 'loc-1',
      quantity: 20,
      min_quantity: 5,
      max_quantity: 100,
      unit_price: 29.99,
      status: 'active'
    }

    it('should create a new inventory item successfully', async () => {
      const createdItem = { id: '3', ...validItem, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
      auditedInventoryService.create.mockResolvedValue(createdItem)

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: validItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(validItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdItem)
      expect(auditedInventoryService.create).toHaveBeenCalledWith(validItem)
    })

    it('should validate required fields', async () => {
      const invalidItem = {
        name: 'Test Item',
        // Missing required fields: sku, category_id, location_id
        quantity: 10,
        unit_price: 25.99
      }

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: invalidItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('SKU is required')
    })

    it('should validate SKU uniqueness', async () => {
      auditedInventoryService.create.mockRejectedValue(new Error('SKU already exists'))

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: validItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(validItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('SKU already exists')
    })

    it('should validate numeric fields', async () => {
      const invalidItem = {
        ...validItem,
        quantity: 'invalid',
        unit_price: 'not-a-number'
      }

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: invalidItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Quantity must be a number')
    })

    it('should validate price range', async () => {
      const invalidItem = {
        ...validItem,
        unit_price: -10.99
      }

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: invalidItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Unit price must be greater than 0')
    })

    it('should validate quantity range', async () => {
      const invalidItem = {
        ...validItem,
        quantity: -5
      }

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: invalidItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Quantity cannot be negative')
    })

    it('should handle server errors during creation', async () => {
      auditedInventoryService.create.mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: validItem,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(validItem),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Database error')
    })
  })

  describe('PUT /api/v1/inventory', () => {
    const updateData = {
      name: 'Updated Test Item',
      description: 'Updated description',
      quantity: 15,
      unit_price: 35.99
    }

    it('should update an inventory item successfully', async () => {
      const updatedItem = { ...mockItems[0], ...updateData, updated_at: '2024-01-02T00:00:00Z' }
      auditedInventoryService.update.mockResolvedValue(updatedItem)

      const { req } = createMocks({
        method: 'PUT',
        url: 'http://localhost:3000/api/v1/inventory?id=1',
        body: updateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedItem)
      expect(auditedInventoryService.update).toHaveBeenCalledWith('1', updateData)
    })

    it('should require item ID for updates', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: 'http://localhost:3000/api/v1/inventory',
        body: updateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Item ID is required for updates')
    })

    it('should handle item not found during update', async () => {
      auditedInventoryService.update.mockRejectedValue(new Error('Item not found'))

      const { req } = createMocks({
        method: 'PUT',
        url: 'http://localhost:3000/api/v1/inventory?id=999',
        body: updateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
      expect(data.message).toBe('Item not found')
    })

    it('should validate update data', async () => {
      const invalidUpdate = {
        quantity: -10,
        unit_price: 'invalid'
      }

      const { req } = createMocks({
        method: 'PUT',
        url: 'http://localhost:3000/api/v1/inventory?id=1',
        body: invalidUpdate,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidUpdate),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Quantity cannot be negative')
    })
  })

  describe('DELETE /api/v1/inventory', () => {
    it('should delete an inventory item successfully', async () => {
      auditedInventoryService.delete.mockResolvedValue(true)

      const { req } = createMocks({
        method: 'DELETE',
        url: 'http://localhost:3000/api/v1/inventory?id=1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Item deleted successfully')
      expect(auditedInventoryService.delete).toHaveBeenCalledWith('1')
    })

    it('should require item ID for deletion', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: 'http://localhost:3000/api/v1/inventory',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Item ID is required for deletion')
    })

    it('should handle item not found during deletion', async () => {
      auditedInventoryService.delete.mockRejectedValue(new Error('Item not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: 'http://localhost:3000/api/v1/inventory?id=999',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
      expect(data.message).toBe('Item not found')
    })

    it('should handle deletion errors', async () => {
      auditedInventoryService.delete.mockRejectedValue(new Error('Cannot delete item with active transactions'))

      const { req } = createMocks({
        method: 'DELETE',
        url: 'http://localhost:3000/api/v1/inventory?id=1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('Cannot delete item with active transactions')
    })
  })

  describe('Method Not Allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req } = createMocks({
        method: 'PATCH',
        url: 'http://localhost:3000/api/v1/inventory',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('Method PATCH not allowed')
    })
  })

  describe('Content-Type Validation', () => {
    it('should validate JSON content type for POST requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: 'invalid json',
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid JSON')
    })

    it('should handle missing content type for POST requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/inventory',
        body: '{}',
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: '{}'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Content-Type must be application/json')
    })
  })
})