import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST, PUT, DELETE } from '@/app/api/inventory/route'
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
    getLowStock: vi.fn(),
    getByCategory: vi.fn(),
    getByLocation: vi.fn()
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

describe('/api/inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/inventory', () => {
    it('should return all inventory items successfully', async () => {
      const mockInventory = [
        {
          id: '1',
          name: 'Test Item 1',
          sku: 'TEST-001',
          quantity: 100,
          min_stock: 10,
          max_stock: 500,
          unit_price: 25.99,
          status: 'active',
          categories: { id: 'cat1', name: 'Electronics', color: '#blue' },
          locations: { id: 'loc1', name: 'Warehouse A', address: '123 Main St' }
        },
        {
          id: '2',
          name: 'Test Item 2',
          sku: 'TEST-002',
          quantity: 50,
          min_stock: 5,
          max_stock: 200,
          unit_price: 15.50,
          status: 'active',
          categories: { id: 'cat2', name: 'Office', color: '#green' },
          locations: { id: 'loc2', name: 'Warehouse B', address: '456 Oak Ave' }
        }
      ]

      vi.mocked(inventoryService.getAll).mockResolvedValue(mockInventory)

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/inventory'
      })

      await GET(req)
      const response = await res._getJSONData()

      expect(inventoryService.getAll).toHaveBeenCalledOnce()
      expect(response).toEqual({
        success: true,
        data: mockInventory
      })
    })

    it('should filter inventory by category', async () => {
      const mockInventory = [
        {
          id: '1',
          name: 'Test Item 1',
          sku: 'TEST-001',
          category_id: 'cat1',
          categories: { id: 'cat1', name: 'Electronics', color: '#blue' }
        }
      ]

      vi.mocked(inventoryService.getAll).mockResolvedValue(mockInventory)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory?category=cat1'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].category_id).toBe('cat1')
    })

    it('should filter inventory by location', async () => {
      const mockInventory = [
        {
          id: '1',
          name: 'Test Item 1',
          sku: 'TEST-001',
          location_id: 'loc1',
          locations: { id: 'loc1', name: 'Warehouse A' }
        }
      ]

      vi.mocked(inventoryService.getAll).mockResolvedValue(mockInventory)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory?location=loc1'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].location_id).toBe('loc1')
    })

    it('should filter inventory by status', async () => {
      const mockInventory = [
        {
          id: '1',
          name: 'Test Item 1',
          sku: 'TEST-001',
          status: 'active'
        }
      ]

      vi.mocked(inventoryService.getAll).mockResolvedValue(mockInventory)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory?status=active'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('active')
    })

    it('should search inventory by name and SKU', async () => {
      const mockInventory = [
        {
          id: '1',
          name: 'Test Widget',
          sku: 'WIDGET-001',
          status: 'active'
        },
        {
          id: '2',
          name: 'Another Item',
          sku: 'ITEM-002',
          status: 'active'
        }
      ]

      vi.mocked(inventoryService.getAll).mockResolvedValue(mockInventory)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory?search=widget'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Test Widget')
    })

    it('should return low stock items when lowStock=true', async () => {
      const mockLowStock = [
        {
          id: '1',
          name: 'Low Stock Item',
          sku: 'LOW-001',
          quantity: 5,
          min_stock: 10
        }
      ]

      vi.mocked(inventoryService.getLowStock).mockResolvedValue(mockLowStock)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory?lowStock=true'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(inventoryService.getLowStock).toHaveBeenCalledOnce()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLowStock)
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(inventoryService.getAll).mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch inventory')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/inventory', () => {
    it('should create a new inventory item successfully', async () => {
      const newItem = {
        name: 'New Test Item',
        sku: 'NEW-001',
        category_id: 'cat1',
        location_id: 'loc1',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
        unit_price: 25.99
      }

      const createdItem = {
        id: '123',
        ...newItem,
        status: 'active',
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedInventoryService.create).mockResolvedValue(createdItem)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory',
        body: newItem
      })

      const response = await POST(req)
      const data = await response.json()

      expect(auditedInventoryService.create).toHaveBeenCalledWith(newItem)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdItem)
    })

    it('should validate required fields', async () => {
      const incompleteItem = {
        name: 'Test Item'
        // Missing required fields
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory',
        body: incompleteItem
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
      expect(data.message).toContain('sku')
    })

    it('should validate numeric fields', async () => {
      const invalidItem = {
        name: 'Test Item',
        sku: 'TEST-001',
        category_id: 'cat1',
        location_id: 'loc1',
        quantity: -5, // Invalid negative quantity
        min_stock: 10,
        max_stock: 500,
        unit_price: 25.99
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory',
        body: invalidItem
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Quantity must be a non-negative number')
    })

    it('should validate stock level logic', async () => {
      const invalidItem = {
        name: 'Test Item',
        sku: 'TEST-001',
        category_id: 'cat1',
        location_id: 'loc1',
        quantity: 100,
        min_stock: 50,
        max_stock: 30, // max_stock less than min_stock
        unit_price: 25.99
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory',
        body: invalidItem
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Maximum stock must be greater than minimum stock')
    })

    it('should handle creation errors', async () => {
      const newItem = {
        name: 'Test Item',
        sku: 'TEST-001',
        category_id: 'cat1',
        location_id: 'loc1',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
        unit_price: 25.99
      }

      vi.mocked(auditedInventoryService.create).mockRejectedValue(new Error('SKU already exists'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory',
        body: newItem
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create inventory item')
      expect(data.message).toBe('SKU already exists')
    })
  })

  describe('PUT /api/inventory', () => {
    it('should update an inventory item successfully', async () => {
      const updates = {
        id: '123',
        name: 'Updated Item Name',
        quantity: 150
      }

      const updatedItem = {
        id: '123',
        name: 'Updated Item Name',
        sku: 'TEST-001',
        quantity: 150,
        min_stock: 10,
        max_stock: 500,
        unit_price: 25.99,
        status: 'active'
      }

      vi.mocked(auditedInventoryService.update).mockResolvedValue(updatedItem)

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/inventory',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(auditedInventoryService.update).toHaveBeenCalledWith('123', {
        name: 'Updated Item Name',
        quantity: 150
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedItem)
    })

    it('should require item ID', async () => {
      const updates = {
        name: 'Updated Item Name'
        // Missing ID
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/inventory',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Inventory item ID is required')
    })

    it('should validate numeric updates', async () => {
      const updates = {
        id: '123',
        quantity: -10 // Invalid negative quantity
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/inventory',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Quantity must be a non-negative number')
    })

    it('should handle update errors', async () => {
      const updates = {
        id: '123',
        name: 'Updated Item'
      }

      vi.mocked(auditedInventoryService.update).mockRejectedValue(new Error('Item not found'))

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/inventory',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update inventory item')
      expect(data.message).toBe('Item not found')
    })
  })

  describe('DELETE /api/inventory', () => {
    it('should delete an inventory item successfully', async () => {
      vi.mocked(auditedInventoryService.delete).mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/inventory?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(auditedInventoryService.delete).toHaveBeenCalledWith('123')
      expect(data.success).toBe(true)
      expect(data.message).toBe('Inventory item deleted successfully')
    })

    it('should require item ID', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/inventory'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Inventory item ID is required')
    })

    it('should handle deletion errors', async () => {
      vi.mocked(auditedInventoryService.delete).mockRejectedValue(new Error('Item not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/inventory?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete inventory item')
      expect(data.message).toBe('Item not found')
    })
  })
})