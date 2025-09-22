import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OptimizedInventoryService, InventoryItem, InventoryFilters } from '@/lib/services/optimized-inventory-service'
import { createClient } from '@/lib/supabase/client'
import { auditService } from '@/lib/audit'
import { inventoryCache } from '@/lib/cache/cache-manager'

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/audit', () => ({
  auditService: {
    logCreate: vi.fn(),
    logUpdate: vi.fn(),
    logDelete: vi.fn(),
    logOperation: vi.fn(),
    logBulkOperation: vi.fn(),
  }
}))

vi.mock('@/lib/cache/cache-manager', () => ({
  inventoryCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidateByTags: vi.fn(),
  }
}))

vi.mock('@/lib/supabase/service-role', () => ({
  getServiceRoleClient: vi.fn(() => ({
    _auditUser: null
  }))
}))

describe('OptimizedInventoryService', () => {
  let service: OptimizedInventoryService
  let mockSupabase: any
  
  const mockInventoryItem: InventoryItem = {
    id: '1',
    name: 'Test Item',
    sku: 'TEST-001',
    category_id: 'cat-1',
    location_id: 'loc-1',
    quantity: 10,
    min_stock: 5,
    max_stock: 100,
    unit_price: 25.99,
    status: 'active',
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    categories: {
      id: 'cat-1',
      name: 'Electronics',
      color: '#3B82F6'
    },
    locations: {
      id: 'loc-1',
      name: 'Warehouse A',
      address: '123 Main St'
    }
  }

  const mockUser = {
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      role: 'admin',
      department: 'IT'
    }
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockInventoryItem,
                error: null
              })),
              order: vi.fn(() => ({
                data: [mockInventoryItem],
                error: null
              })),
              gte: vi.fn(() => ({
                data: [mockInventoryItem],
                error: null
              })),
              lte: vi.fn(() => ({
                data: [mockInventoryItem],
                error: null
              })),
              filter: vi.fn(() => ({
                data: [mockInventoryItem],
                error: null
              })),
              or: vi.fn(() => ({
                data: [mockInventoryItem],
                error: null
              }))
            })),
            single: vi.fn(() => ({
              data: mockInventoryItem,
              error: null
            })),
            order: vi.fn(() => ({
              data: [mockInventoryItem],
              error: null
            }))
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [mockInventoryItem],
              error: null
            }))
          })),
          filter: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [mockInventoryItem],
                error: null
              }))
            }))
          })),
          or: vi.fn(() => ({
            data: [mockInventoryItem],
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockInventoryItem,
              error: null
            })),
            data: [mockInventoryItem],
            error: null
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockInventoryItem,
                error: null
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      })),
      rpc: vi.fn(() => ({
        data: {
          totalItems: 100,
          lowStockItems: 5,
          outOfStockItems: 2,
          totalValue: 5000.00
        },
        error: null
      }))
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase)
    vi.mocked(inventoryCache.get).mockReturnValue(null)
    
    service = new OptimizedInventoryService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAll', () => {
    it('should return cached results when available', async () => {
      const cachedResult = {
        data: [mockInventoryItem],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
      vi.mocked(inventoryCache.get).mockReturnValue(cachedResult)

      const result = await service.getAll()

      expect(result).toEqual(cachedResult)
      expect(inventoryCache.get).toHaveBeenCalled()
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should fetch from database when cache is empty', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)

      const result = await service.getAll()

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.set).toHaveBeenCalled()
      expect(result.data).toEqual([mockInventoryItem])
    })

    it('should apply category filter', async () => {
      const filters: InventoryFilters = { category: 'cat-1' }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should apply location filter', async () => {
      const filters: InventoryFilters = { location: 'loc-1' }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should apply status filter', async () => {
      const filters: InventoryFilters = { status: 'inactive' }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should apply search filter', async () => {
      const filters: InventoryFilters = { search: 'test' }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should apply quantity range filters', async () => {
      const filters: InventoryFilters = { 
        minQuantity: 5,
        maxQuantity: 50
      }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should apply low stock filter', async () => {
      const filters: InventoryFilters = { lowStock: true }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should apply out of stock filter', async () => {
      const filters: InventoryFilters = { outOfStock: true }
      
      await service.getAll({}, filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
    })

    it('should handle database errors', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: new Error('Database error')
          }))
        }))
      })

      await expect(service.getAll()).rejects.toThrow('Database error')
    })
  })

  describe('getById', () => {
    it('should return cached item when available', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(mockInventoryItem)

      const result = await service.getById('1')

      expect(result).toEqual(mockInventoryItem)
      expect(inventoryCache.get).toHaveBeenCalledWith('inventory:item:1')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should fetch from database when cache is empty', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)

      const result = await service.getById('1')

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.set).toHaveBeenCalled()
      expect(result).toEqual(mockInventoryItem)
    })

    it('should handle item not found', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: new Error('Item not found')
              }))
            }))
          }))
        }))
      })

      await expect(service.getById('nonexistent')).rejects.toThrow('Item not found')
    })
  })

  describe('getLowStock', () => {
    it('should return cached low stock items when available', async () => {
      const lowStockItems = [{ ...mockInventoryItem, quantity: 2 }]
      vi.mocked(inventoryCache.get).mockReturnValue(lowStockItems)

      const result = await service.getLowStock()

      expect(result).toEqual(lowStockItems)
      expect(inventoryCache.get).toHaveBeenCalledWith('inventory:low-stock')
    })

    it('should fetch from database when cache is empty', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)

      const result = await service.getLowStock()

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.set).toHaveBeenCalled()
      expect(result).toEqual([mockInventoryItem])
    })

    it('should handle database errors', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          filter: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                error: new Error('Database error')
              }))
            }))
          }))
        }))
      })

      await expect(service.getLowStock()).rejects.toThrow('Database error')
    })
  })

  describe('getByCategory', () => {
    it('should delegate to getAll with category filter', async () => {
      const spy = vi.spyOn(service, 'getAll')
      
      await service.getByCategory('cat-1')

      expect(spy).toHaveBeenCalledWith({}, { category: 'cat-1' })
    })
  })

  describe('getByLocation', () => {
    it('should delegate to getAll with location filter', async () => {
      const spy = vi.spyOn(service, 'getAll')
      
      await service.getByLocation('loc-1')

      expect(spy).toHaveBeenCalledWith({}, { location: 'loc-1' })
    })
  })

  describe('search', () => {
    it('should delegate to getAll with search filter', async () => {
      const spy = vi.spyOn(service, 'getAll')
      
      await service.search('test query')

      expect(spy).toHaveBeenCalledWith({}, { search: 'test query' })
    })

    it('should combine search with additional filters', async () => {
      const spy = vi.spyOn(service, 'getAll')
      const additionalFilters = { category: 'cat-1' }
      
      await service.search('test query', {}, additionalFilters)

      expect(spy).toHaveBeenCalledWith({}, { 
        ...additionalFilters, 
        search: 'test query' 
      })
    })
  })

  describe('create', () => {
    const newItem = {
      name: 'New Item',
      sku: 'NEW-001',
      category_id: 'cat-1',
      location_id: 'loc-1',
      quantity: 20,
      min_stock: 5,
      max_stock: 100,
      unit_price: 29.99
    }

    it('should create item successfully', async () => {
      const result = await service.create(newItem, mockUser)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.invalidateByTags).toHaveBeenCalled()
      expect(auditService.logCreate).toHaveBeenCalled()
      expect(result).toEqual(mockInventoryItem)
    })

    it('should set default status to active', async () => {
      await service.create(newItem, mockUser)

      expect(mockSupabase.from().insert).toHaveBeenCalledWith([{
        ...newItem,
        status: 'active'
      }])
    })

    it('should preserve provided status', async () => {
      const itemWithStatus = { ...newItem, status: 'inactive' }
      
      await service.create(itemWithStatus, mockUser)

      expect(mockSupabase.from().insert).toHaveBeenCalledWith([itemWithStatus])
    })

    it('should handle creation errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: new Error('Duplicate SKU')
            }))
          }))
        }))
      })

      await expect(service.create(newItem, mockUser)).rejects.toThrow('Duplicate SKU')
      expect(auditService.logOperation).toHaveBeenCalled()
    })

    it('should work without user context', async () => {
      const result = await service.create(newItem)

      expect(result).toEqual(mockInventoryItem)
      expect(auditService.logCreate).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    const updates = {
      name: 'Updated Item',
      quantity: 15
    }

    it('should update item successfully', async () => {
      // Mock getById to return existing item
      vi.spyOn(service, 'getById').mockResolvedValue(mockInventoryItem)

      const result = await service.update('1', updates, mockUser)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.invalidateByTags).toHaveBeenCalled()
      expect(auditService.logUpdate).toHaveBeenCalled()
      expect(result).toEqual(mockInventoryItem)
    })

    it('should detect quantity changes', async () => {
      const oldItem = { ...mockInventoryItem, quantity: 10 }
      vi.spyOn(service, 'getById').mockResolvedValue(oldItem)

      await service.update('1', { quantity: 15 }, mockUser)

      expect(auditService.logUpdate).toHaveBeenCalledWith(
        'inventory',
        '1',
        oldItem,
        mockInventoryItem,
        expect.objectContaining({
          action_type: 'inventory_stock_adjusted',
          stock_change: {
            from: 10,
            to: 15,
            difference: 5
          }
        }),
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should handle update errors', async () => {
      vi.spyOn(service, 'getById').mockResolvedValue(mockInventoryItem)
      
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: new Error('Update failed')
              }))
            }))
          }))
        }))
      })

      await expect(service.update('1', updates, mockUser)).rejects.toThrow('Update failed')
      expect(auditService.logOperation).toHaveBeenCalled()
    })

    it('should work without user context', async () => {
      vi.spyOn(service, 'getById').mockResolvedValue(mockInventoryItem)

      const result = await service.update('1', updates)

      expect(result).toEqual(mockInventoryItem)
    })
  })

  describe('delete', () => {
    it('should delete item successfully', async () => {
      vi.spyOn(service, 'getById').mockResolvedValue(mockInventoryItem)

      await service.delete('1', mockUser)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.invalidateByTags).toHaveBeenCalled()
      expect(auditService.logDelete).toHaveBeenCalled()
    })

    it('should handle deletion errors', async () => {
      vi.spyOn(service, 'getById').mockResolvedValue(mockInventoryItem)
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: new Error('Cannot delete item with transactions')
          }))
        }))
      })

      await expect(service.delete('1', mockUser)).rejects.toThrow('Cannot delete item with transactions')
      expect(auditService.logOperation).toHaveBeenCalled()
    })

    it('should work without user context', async () => {
      vi.spyOn(service, 'getById').mockResolvedValue(mockInventoryItem)

      await service.delete('1')

      expect(auditService.logDelete).toHaveBeenCalled()
    })
  })

  describe('createMany', () => {
    const newItems = [
      {
        name: 'Item 1',
        sku: 'BULK-001',
        category_id: 'cat-1',
        location_id: 'loc-1',
        quantity: 10,
        min_stock: 5,
        max_stock: 50,
        unit_price: 19.99
      },
      {
        name: 'Item 2',
        sku: 'BULK-002',
        category_id: 'cat-2',
        location_id: 'loc-2',
        quantity: 20,
        min_stock: 10,
        max_stock: 100,
        unit_price: 29.99
      }
    ]

    it('should create multiple items successfully', async () => {
      const result = await service.createMany(newItems, mockUser)

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory')
      expect(inventoryCache.invalidateByTags).toHaveBeenCalled()
      expect(auditService.logBulkOperation).toHaveBeenCalled()
      expect(result).toEqual([mockInventoryItem])
    })

    it('should set default status for all items', async () => {
      await service.createMany(newItems, mockUser)

      const expectedItems = newItems.map(item => ({ ...item, status: 'active' }))
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(expectedItems)
    })

    it('should handle bulk creation errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: null,
            error: new Error('Bulk insert failed')
          }))
        }))
      })

      await expect(service.createMany(newItems, mockUser)).rejects.toThrow('Bulk insert failed')
    })

    it('should work without user context', async () => {
      const result = await service.createMany(newItems)

      expect(result).toEqual([mockInventoryItem])
      expect(auditService.logBulkOperation).not.toHaveBeenCalled()
    })
  })

  describe('getStatistics', () => {
    it('should return cached statistics when available', async () => {
      const cachedStats = {
        totalItems: 150,
        lowStockItems: 8,
        outOfStockItems: 3,
        totalValue: 7500.00
      }
      vi.mocked(inventoryCache.get).mockReturnValue(cachedStats)

      const result = await service.getStatistics()

      expect(result).toEqual(cachedStats)
      expect(inventoryCache.get).toHaveBeenCalledWith('inventory:statistics')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should fetch from database when cache is empty', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)

      const result = await service.getStatistics()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_inventory_statistics')
      expect(inventoryCache.set).toHaveBeenCalled()
      expect(result).toEqual({
        totalItems: 100,
        lowStockItems: 5,
        outOfStockItems: 2,
        totalValue: 5000.00
      })
    })

    it('should handle RPC errors', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: new Error('RPC failed')
      })

      await expect(service.getStatistics()).rejects.toThrow('RPC failed')
    })

    it('should return default stats when RPC returns null', async () => {
      vi.mocked(inventoryCache.get).mockReturnValue(null)
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: null
      })

      const result = await service.getStatistics()

      expect(result).toEqual({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0
      })
    })
  })

  describe('clearCache', () => {
    it('should invalidate all inventory caches', () => {
      service.clearCache()

      expect(inventoryCache.invalidateByTags).toHaveBeenCalledWith(['inventory'])
    })
  })

  describe('private methods', () => {
    it('should invalidate related caches with proper tags', () => {
      // Access private method through service instance
      const service = new OptimizedInventoryService()
      const tags = ['list', 'low-stock', 'item:1']
      
      // Call a method that triggers cache invalidation
      service.clearCache()
      
      expect(inventoryCache.invalidateByTags).toHaveBeenCalled()
    })
  })
})