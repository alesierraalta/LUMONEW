import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  auditedUserService, 
  auditedCategoryService, 
  auditedInventoryService, 
  auditedLocationService 
} from '@/lib/database-with-audit'
import { 
  userService, 
  categoryService, 
  inventoryService, 
  locationService 
} from '@/lib/database'
import { AuditService } from '@/lib/audit'

// Mock the base database services
vi.mock('@/lib/database', () => ({
  userService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn()
  },
  categoryService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn()
  },
  inventoryService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn()
  },
  locationService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn()
  }
}))

// Mock the audit service
vi.mock('@/lib/audit', () => ({
  AuditService: {
    getInstance: vi.fn(() => ({
      logCreate: vi.fn(),
      logUpdate: vi.fn(),
      logDelete: vi.fn()
    }))
  }
}))

describe('Database Services with Audit Integration Tests', () => {
  let mockAuditService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditService = {
      logCreate: vi.fn(),
      logUpdate: vi.fn(),
      logDelete: vi.fn()
    }
    vi.mocked(AuditService.getInstance).mockReturnValue(mockAuditService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('auditedUserService', () => {
    it('should create user and log audit entry', async () => {
      const newUser = { email: 'test@example.com', name: 'Test User', role: 'user' }
      const createdUser = { id: '123', ...newUser, created_at: new Date().toISOString() }

      vi.mocked(userService.create).mockResolvedValue(createdUser)

      const result = await auditedUserService.create(newUser)

      expect(userService.create).toHaveBeenCalledWith(newUser)
      expect(mockAuditService.logCreate).toHaveBeenCalledWith(
        'users',
        '123',
        createdUser,
        undefined // No user context in test
      )
      expect(result).toEqual(createdUser)
    })

    it('should update user and log audit entry with old values', async () => {
      const userId = '123'
      const updates = { name: 'Updated Name', role: 'admin' }
      const oldUser = { id: userId, name: 'Old Name', email: 'test@example.com', role: 'user' }
      const updatedUser = { ...oldUser, ...updates }

      vi.mocked(userService.getById).mockResolvedValue(oldUser)
      vi.mocked(userService.update).mockResolvedValue(updatedUser)

      const result = await auditedUserService.update(userId, updates)

      expect(userService.getById).toHaveBeenCalledWith(userId)
      expect(userService.update).toHaveBeenCalledWith(userId, updates)
      expect(mockAuditService.logUpdate).toHaveBeenCalledWith(
        'users',
        userId,
        oldUser,
        updatedUser,
        undefined
      )
      expect(result).toEqual(updatedUser)
    })

    it('should delete user and log audit entry', async () => {
      const userId = '123'
      const userToDelete = { id: userId, name: 'User to Delete', email: 'delete@example.com', role: 'user' }

      vi.mocked(userService.getById).mockResolvedValue(userToDelete)
      vi.mocked(userService.delete).mockResolvedValue(undefined)

      await auditedUserService.delete(userId)

      expect(userService.getById).toHaveBeenCalledWith(userId)
      expect(userService.delete).toHaveBeenCalledWith(userId)
      expect(mockAuditService.logDelete).toHaveBeenCalledWith(
        'users',
        userId,
        userToDelete,
        undefined
      )
    })

    it('should handle errors during user creation', async () => {
      const newUser = { email: 'test@example.com', name: 'Test User', role: 'user' }
      const error = new Error('Database constraint violation')

      vi.mocked(userService.create).mockRejectedValue(error)

      await expect(auditedUserService.create(newUser)).rejects.toThrow('Database constraint violation')
      expect(mockAuditService.logCreate).not.toHaveBeenCalled()
    })

    it('should handle missing user during update', async () => {
      const userId = '123'
      const updates = { name: 'Updated Name' }

      vi.mocked(userService.getById).mockResolvedValue(null)

      await expect(auditedUserService.update(userId, updates)).rejects.toThrow('User not found')
      expect(userService.update).not.toHaveBeenCalled()
      expect(mockAuditService.logUpdate).not.toHaveBeenCalled()
    })
  })

  describe('auditedCategoryService', () => {
    it('should create category and log audit entry', async () => {
      const newCategory = { name: 'New Category', description: 'Test category', color: '#blue' }
      const createdCategory = { id: '123', ...newCategory, created_at: new Date().toISOString() }

      vi.mocked(categoryService.create).mockResolvedValue(createdCategory)

      const result = await auditedCategoryService.create(newCategory)

      expect(categoryService.create).toHaveBeenCalledWith(newCategory)
      expect(mockAuditService.logCreate).toHaveBeenCalledWith(
        'categories',
        '123',
        createdCategory,
        undefined
      )
      expect(result).toEqual(createdCategory)
    })

    it('should update category and log audit entry', async () => {
      const categoryId = '123'
      const updates = { name: 'Updated Category', color: '#red' }
      const oldCategory = { id: categoryId, name: 'Old Category', description: 'Old desc', color: '#blue' }
      const updatedCategory = { ...oldCategory, ...updates }

      vi.mocked(categoryService.getById).mockResolvedValue(oldCategory)
      vi.mocked(categoryService.update).mockResolvedValue(updatedCategory)

      const result = await auditedCategoryService.update(categoryId, updates)

      expect(categoryService.getById).toHaveBeenCalledWith(categoryId)
      expect(categoryService.update).toHaveBeenCalledWith(categoryId, updates)
      expect(mockAuditService.logUpdate).toHaveBeenCalledWith(
        'categories',
        categoryId,
        oldCategory,
        updatedCategory,
        undefined
      )
      expect(result).toEqual(updatedCategory)
    })

    it('should delete category and log audit entry', async () => {
      const categoryId = '123'
      const categoryToDelete = { id: categoryId, name: 'Category to Delete', description: 'Test', color: '#blue' }

      vi.mocked(categoryService.getById).mockResolvedValue(categoryToDelete)
      vi.mocked(categoryService.delete).mockResolvedValue(undefined)

      await auditedCategoryService.delete(categoryId)

      expect(categoryService.getById).toHaveBeenCalledWith(categoryId)
      expect(categoryService.delete).toHaveBeenCalledWith(categoryId)
      expect(mockAuditService.logDelete).toHaveBeenCalledWith(
        'categories',
        categoryId,
        categoryToDelete,
        undefined
      )
    })
  })

  describe('auditedInventoryService', () => {
    it('should create inventory item and log audit entry', async () => {
      const newItem = {
        name: 'New Item',
        sku: 'NEW-001',
        category_id: 'cat1',
        location_id: 'loc1',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
        unit_price: 25.99
      }
      const createdItem = { id: '123', ...newItem, status: 'active', created_at: new Date().toISOString() }

      vi.mocked(inventoryService.create).mockResolvedValue(createdItem)

      const result = await auditedInventoryService.create(newItem)

      expect(inventoryService.create).toHaveBeenCalledWith(newItem)
      expect(mockAuditService.logCreate).toHaveBeenCalledWith(
        'inventory',
        '123',
        createdItem,
        undefined
      )
      expect(result).toEqual(createdItem)
    })

    it('should update inventory item and log audit entry', async () => {
      const itemId = '123'
      const updates = { quantity: 150, unit_price: 29.99 }
      const oldItem = {
        id: itemId,
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 100,
        unit_price: 25.99,
        status: 'active'
      }
      const updatedItem = { ...oldItem, ...updates }

      vi.mocked(inventoryService.getById).mockResolvedValue(oldItem)
      vi.mocked(inventoryService.update).mockResolvedValue(updatedItem)

      const result = await auditedInventoryService.update(itemId, updates)

      expect(inventoryService.getById).toHaveBeenCalledWith(itemId)
      expect(inventoryService.update).toHaveBeenCalledWith(itemId, updates)
      expect(mockAuditService.logUpdate).toHaveBeenCalledWith(
        'inventory',
        itemId,
        oldItem,
        updatedItem,
        undefined
      )
      expect(result).toEqual(updatedItem)
    })

    it('should delete inventory item and log audit entry', async () => {
      const itemId = '123'
      const itemToDelete = {
        id: itemId,
        name: 'Item to Delete',
        sku: 'DELETE-001',
        quantity: 50,
        status: 'active'
      }

      vi.mocked(inventoryService.getById).mockResolvedValue(itemToDelete)
      vi.mocked(inventoryService.delete).mockResolvedValue(undefined)

      await auditedInventoryService.delete(itemId)

      expect(inventoryService.getById).toHaveBeenCalledWith(itemId)
      expect(inventoryService.delete).toHaveBeenCalledWith(itemId)
      expect(mockAuditService.logDelete).toHaveBeenCalledWith(
        'inventory',
        itemId,
        itemToDelete,
        undefined
      )
    })

    it('should handle quantity updates with proper audit logging', async () => {
      const itemId = '123'
      const quantityUpdate = { quantity: 75 }
      const oldItem = {
        id: itemId,
        name: 'Stock Item',
        sku: 'STOCK-001',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
        unit_price: 15.99
      }
      const updatedItem = { ...oldItem, quantity: 75 }

      vi.mocked(inventoryService.getById).mockResolvedValue(oldItem)
      vi.mocked(inventoryService.update).mockResolvedValue(updatedItem)

      const result = await auditedInventoryService.update(itemId, quantityUpdate)

      expect(mockAuditService.logUpdate).toHaveBeenCalledWith(
        'inventory',
        itemId,
        oldItem,
        updatedItem,
        undefined
      )
      expect(result).toEqual(updatedItem)
    })
  })

  describe('auditedLocationService', () => {
    it('should create location and log audit entry', async () => {
      const newLocation = { name: 'New Warehouse', address: '789 Pine St' }
      const createdLocation = { id: '123', ...newLocation, created_at: new Date().toISOString() }

      vi.mocked(locationService.create).mockResolvedValue(createdLocation)

      const result = await auditedLocationService.create(newLocation)

      expect(locationService.create).toHaveBeenCalledWith(newLocation)
      expect(mockAuditService.logCreate).toHaveBeenCalledWith(
        'locations',
        '123',
        createdLocation,
        undefined
      )
      expect(result).toEqual(createdLocation)
    })

    it('should update location and log audit entry', async () => {
      const locationId = '123'
      const updates = { name: 'Updated Warehouse', address: '999 Updated St' }
      const oldLocation = { id: locationId, name: 'Old Warehouse', address: '123 Old St' }
      const updatedLocation = { ...oldLocation, ...updates }

      vi.mocked(locationService.getById).mockResolvedValue(oldLocation)
      vi.mocked(locationService.update).mockResolvedValue(updatedLocation)

      const result = await auditedLocationService.update(locationId, updates)

      expect(locationService.getById).toHaveBeenCalledWith(locationId)
      expect(locationService.update).toHaveBeenCalledWith(locationId, updates)
      expect(mockAuditService.logUpdate).toHaveBeenCalledWith(
        'locations',
        locationId,
        oldLocation,
        updatedLocation,
        undefined
      )
      expect(result).toEqual(updatedLocation)
    })

    it('should delete location and log audit entry', async () => {
      const locationId = '123'
      const locationToDelete = { id: locationId, name: 'Location to Delete', address: '123 Delete St' }

      vi.mocked(locationService.getById).mockResolvedValue(locationToDelete)
      vi.mocked(locationService.delete).mockResolvedValue(undefined)

      await auditedLocationService.delete(locationId)

      expect(locationService.getById).toHaveBeenCalledWith(locationId)
      expect(locationService.delete).toHaveBeenCalledWith(locationId)
      expect(mockAuditService.logDelete).toHaveBeenCalledWith(
        'locations',
        locationId,
        locationToDelete,
        undefined
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle audit service failures gracefully', async () => {
      const newUser = { email: 'test@example.com', name: 'Test User', role: 'user' }
      const createdUser = { id: '123', ...newUser }

      vi.mocked(userService.create).mockResolvedValue(createdUser)
      mockAuditService.logCreate.mockRejectedValue(new Error('Audit service unavailable'))

      // Should still return the created user even if audit fails
      const result = await auditedUserService.create(newUser)

      expect(userService.create).toHaveBeenCalledWith(newUser)
      expect(mockAuditService.logCreate).toHaveBeenCalled()
      expect(result).toEqual(createdUser)
    })

    it('should propagate database service errors', async () => {
      const newCategory = { name: 'Test Category', description: 'Test', color: '#blue' }
      const dbError = new Error('Unique constraint violation')

      vi.mocked(categoryService.create).mockRejectedValue(dbError)

      await expect(auditedCategoryService.create(newCategory)).rejects.toThrow('Unique constraint violation')
      expect(mockAuditService.logCreate).not.toHaveBeenCalled()
    })

    it('should handle missing records during update operations', async () => {
      const itemId = '123'
      const updates = { quantity: 50 }

      vi.mocked(inventoryService.getById).mockResolvedValue(null)

      await expect(auditedInventoryService.update(itemId, updates)).rejects.toThrow('Inventory item not found')
      expect(inventoryService.update).not.toHaveBeenCalled()
      expect(mockAuditService.logUpdate).not.toHaveBeenCalled()
    })

    it('should handle missing records during delete operations', async () => {
      const locationId = '123'

      vi.mocked(locationService.getById).mockResolvedValue(null)

      await expect(auditedLocationService.delete(locationId)).rejects.toThrow('Location not found')
      expect(locationService.delete).not.toHaveBeenCalled()
      expect(mockAuditService.logDelete).not.toHaveBeenCalled()
    })
  })
})