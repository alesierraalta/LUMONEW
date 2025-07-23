import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  userService, 
  categoryService, 
  locationService, 
  inventoryService, 
  auditService, 
  analyticsService,
  transactionService 
} from '@/lib/database'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      head: vi.fn()
    }))
  }
}))

describe('Database Services Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('userService', () => {
    it('should get all users with proper query structure', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockUsers, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await userService.getAll()

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockUsers)
    })

    it('should get user by ID', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' }

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await userService.getById('1')

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1')
      expect(mockChain.single).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should create a new user', async () => {
      const newUser = { email: 'new@example.com', name: 'New User', role: 'user' }
      const createdUser = { id: '123', ...newUser, created_at: new Date().toISOString() }

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdUser, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await userService.create(newUser)

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.insert).toHaveBeenCalledWith([newUser])
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.single).toHaveBeenCalled()
      expect(result).toEqual(createdUser)
    })

    it('should update a user', async () => {
      const updates = { name: 'Updated Name', role: 'admin' }
      const updatedUser = { id: '1', email: 'user@example.com', ...updates }

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedUser, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await userService.update('1', updates)

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.update).toHaveBeenCalledWith(updates)
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1')
      expect(result).toEqual(updatedUser)
    })

    it('should delete a user', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      await userService.delete('1')

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should handle database errors', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      await expect(userService.getAll()).rejects.toThrow('Database error')
    })
  })

  describe('categoryService', () => {
    it('should get all categories ordered by name', async () => {
      const mockCategories = [
        { id: '1', name: 'Electronics', description: 'Electronic items', color: '#blue' },
        { id: '2', name: 'Office', description: 'Office supplies', color: '#green' }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await categoryService.getAll()

      expect(supabase.from).toHaveBeenCalledWith('categories')
      expect(mockChain.order).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockCategories)
    })

    it('should create a category with proper structure', async () => {
      const newCategory = { name: 'New Category', description: 'Test category', color: '#red' }
      const createdCategory = { id: '123', ...newCategory }

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdCategory, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await categoryService.create(newCategory)

      expect(mockChain.insert).toHaveBeenCalledWith([newCategory])
      expect(result).toEqual(createdCategory)
    })
  })

  describe('locationService', () => {
    it('should get all locations ordered by name', async () => {
      const mockLocations = [
        { id: '1', name: 'Warehouse A', address: '123 Main St' },
        { id: '2', name: 'Warehouse B', address: '456 Oak Ave' }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockLocations, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await locationService.getAll()

      expect(supabase.from).toHaveBeenCalledWith('locations')
      expect(mockChain.order).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockLocations)
    })

    it('should create a location', async () => {
      const newLocation = { name: 'New Warehouse', address: '789 Pine St' }
      const createdLocation = { id: '123', ...newLocation }

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdLocation, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await locationService.create(newLocation)

      expect(mockChain.insert).toHaveBeenCalledWith([newLocation])
      expect(result).toEqual(createdLocation)
    })
  })

  describe('inventoryService', () => {
    it('should get all inventory with relations', async () => {
      const mockInventory = [
        {
          id: '1',
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 100,
          categories: { id: 'cat1', name: 'Electronics', color: '#blue' },
          locations: { id: 'loc1', name: 'Warehouse A', address: '123 Main St' }
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInventory, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await inventoryService.getAll()

      expect(supabase.from).toHaveBeenCalledWith('inventory')
      expect(mockChain.select).toHaveBeenCalledWith(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockInventory)
    })

    it('should get low stock items', async () => {
      const mockLowStock = [
        {
          id: '1',
          name: 'Low Stock Item',
          quantity: 5,
          min_stock: 10,
          categories: { id: 'cat1', name: 'Electronics' },
          locations: { id: 'loc1', name: 'Warehouse A' }
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockLowStock, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await inventoryService.getLowStock()

      expect(mockChain.filter).toHaveBeenCalledWith('quantity', 'lte', 'min_stock')
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active')
      expect(result).toEqual(mockLowStock)
    })

    it('should get inventory by category', async () => {
      const mockCategoryInventory = [
        {
          id: '1',
          name: 'Electronics Item',
          category_id: 'cat1',
          categories: { id: 'cat1', name: 'Electronics' }
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockResolvedValue({ data: mockCategoryInventory, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await inventoryService.getByCategory('cat1')

      expect(mockChain.eq).toHaveBeenCalledWith('category_id', 'cat1')
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active')
      expect(result).toEqual(mockCategoryInventory)
    })

    it('should get inventory by location', async () => {
      const mockLocationInventory = [
        {
          id: '1',
          name: 'Warehouse Item',
          location_id: 'loc1',
          locations: { id: 'loc1', name: 'Warehouse A' }
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockResolvedValue({ data: mockLocationInventory, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await inventoryService.getByLocation('loc1')

      expect(mockChain.eq).toHaveBeenCalledWith('location_id', 'loc1')
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active')
      expect(result).toEqual(mockLocationInventory)
    })
  })

  describe('auditService', () => {
    it('should get audit logs with user relations', async () => {
      const mockAuditLogs = [
        {
          id: '1',
          action: 'CREATE',
          table_name: 'inventory',
          record_id: 'item1',
          users: { id: 'user1', name: 'John Doe', email: 'john@example.com' }
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockAuditLogs, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await auditService.getAll(10)

      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockChain.select).toHaveBeenCalledWith(`
        *,
        users (id, name, email)
      `)
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockChain.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockAuditLogs)
    })

    it('should create audit log entry', async () => {
      const newLog = {
        user_id: 'user1',
        action: 'UPDATE',
        table_name: 'inventory',
        record_id: 'item1',
        old_values: { quantity: 10 },
        new_values: { quantity: 15 }
      }

      const createdLog = { id: '123', ...newLog, created_at: new Date().toISOString() }

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdLog, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await auditService.create(newLog)

      expect(mockChain.insert).toHaveBeenCalledWith([newLog])
      expect(result).toEqual(createdLog)
    })

    it('should get audit logs by user', async () => {
      const mockUserLogs = [
        {
          id: '1',
          user_id: 'user1',
          action: 'CREATE',
          users: { id: 'user1', name: 'John Doe' }
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockUserLogs, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await auditService.getByUser('user1', 5)

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user1')
      expect(mockChain.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockUserLogs)
    })
  })

  describe('analyticsService', () => {
    it('should get dashboard metrics', async () => {
      // Mock multiple Supabase calls for dashboard metrics
      const mockInventoryCount = { count: 150 }
      const mockLowStockData = [
        { quantity: 5, min_stock: 10 },
        { quantity: 8, min_stock: 15 }
      ]
      const mockInventoryValues = [
        { quantity: 10, unit_price: 25.99 },
        { quantity: 5, unit_price: 15.50 }
      ]
      const mockCategoriesCount = { count: 8 }
      const mockLocationsCount = { count: 3 }

      // Create separate mock chains for each call
      const mockCountChain = vi.fn().mockResolvedValue({ count: mockInventoryCount.count, error: null })
      const mockDataChain = vi.fn().mockResolvedValue({ data: mockLowStockData, error: null })
      const mockValuesChain = vi.fn().mockResolvedValue({ data: mockInventoryValues, error: null })
      const mockCatCountChain = vi.fn().mockResolvedValue({ count: mockCategoriesCount.count, error: null })
      const mockLocCountChain = vi.fn().mockResolvedValue({ count: mockLocationsCount.count, error: null })

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: mockCountChain
          })
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: mockDataChain
          })
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: mockValuesChain
          })
        } as any)
        .mockReturnValueOnce({
          select: mockCatCountChain
        } as any)
        .mockReturnValueOnce({
          select: mockLocCountChain
        } as any)

      const result = await analyticsService.getDashboardMetrics()

      expect(result).toEqual({
        totalItems: 150,
        lowStockCount: 2, // Both items are below min_stock
        totalValue: 337.4, // (10 * 25.99) + (5 * 15.50)
        categoriesCount: 8,
        locationsCount: 3
      })
    })
  })

  describe('transactionService', () => {
    it('should get all transactions with items', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'sale',
          total: 108.00,
          transaction_items: [
            {
              id: 'item1',
              product_name: 'Test Product',
              quantity: 2,
              unit_price: 50.00
            }
          ]
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as any)

      const result = await transactionService.getAll(25)

      expect(supabase.from).toHaveBeenCalledWith('transactions')
      expect(mockChain.limit).toHaveBeenCalledWith(25)
      expect(result).toEqual(mockTransactions)
    })

    it('should delete all transactions and items', async () => {
      const mockItemsChain = {
        delete: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ error: null })
      }

      const mockTransactionsChain = {
        delete: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockItemsChain as any)
        .mockReturnValueOnce(mockTransactionsChain as any)

      await transactionService.deleteAll()

      expect(supabase.from).toHaveBeenCalledWith('transaction_items')
      expect(supabase.from).toHaveBeenCalledWith('transactions')
      expect(mockItemsChain.neq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000')
      expect(mockTransactionsChain.neq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000')
    })
  })
})