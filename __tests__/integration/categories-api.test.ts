import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST, PUT, DELETE } from '@/app/api/categories/route'
import { categoryService, inventoryService } from '@/lib/database'
import { auditedCategoryService } from '@/lib/database-with-audit'

// Mock the database services
vi.mock('@/lib/database', () => ({
  categoryService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  inventoryService: {
    getByCategory: vi.fn()
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedCategoryService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

describe('/api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/categories', () => {
    it('should return all categories successfully', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Electronics',
          description: 'Electronic devices and components',
          color: '#3b82f6',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Office Supplies',
          description: 'Office equipment and supplies',
          color: '#10b981',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(categoryService.getAll).mockResolvedValue(mockCategories)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/categories'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(categoryService.getAll).toHaveBeenCalledOnce()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCategories)
    })

    it('should filter out inactive categories by default', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Active Category',
          description: 'Active category',
          color: '#3b82f6',
          is_active: true
        },
        {
          id: '2',
          name: 'Inactive Category',
          description: 'Inactive category',
          color: '#ef4444',
          is_active: false
        }
      ]

      vi.mocked(categoryService.getAll).mockResolvedValue(mockCategories)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/categories'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].is_active).toBe(true)
    })

    it('should include inactive categories when includeInactive=true', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Active Category',
          description: 'Active category',
          color: '#3b82f6',
          is_active: true
        },
        {
          id: '2',
          name: 'Inactive Category',
          description: 'Inactive category',
          color: '#ef4444',
          is_active: false
        }
      ]

      vi.mocked(categoryService.getAll).mockResolvedValue(mockCategories)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/categories?includeInactive=true'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
    })

    it('should search categories by name and description', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Electronics',
          description: 'Electronic devices and components',
          color: '#3b82f6',
          is_active: true
        },
        {
          id: '2',
          name: 'Office Supplies',
          description: 'Office equipment and supplies',
          color: '#10b981',
          is_active: true
        }
      ]

      vi.mocked(categoryService.getAll).mockResolvedValue(mockCategories)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/categories?search=electronic'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Electronics')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(categoryService.getAll).mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/categories'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch categories')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/categories', () => {
    it('should create a new category successfully', async () => {
      const newCategory = {
        name: 'New Category',
        description: 'A new category for testing',
        color: '#8b5cf6'
      }

      const createdCategory = {
        id: '123',
        ...newCategory,
        is_active: true,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedCategoryService.create).mockResolvedValue(createdCategory)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/categories',
        body: newCategory
      })

      const response = await POST(req)
      const data = await response.json()

      expect(auditedCategoryService.create).toHaveBeenCalledWith({
        name: 'New Category',
        description: 'A new category for testing',
        color: '#8b5cf6'
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdCategory)
    })

    it('should create category with minimal required fields', async () => {
      const newCategory = {
        name: 'Minimal Category'
      }

      const createdCategory = {
        id: '123',
        name: 'Minimal Category',
        description: null,
        color: null,
        is_active: true,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedCategoryService.create).mockResolvedValue(createdCategory)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/categories',
        body: newCategory
      })

      const response = await POST(req)
      const data = await response.json()

      expect(auditedCategoryService.create).toHaveBeenCalledWith({
        name: 'Minimal Category',
        description: null,
        color: null
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdCategory)
    })

    it('should validate required fields', async () => {
      const incompleteCategory = {
        description: 'Missing name field'
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/categories',
        body: incompleteCategory
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
      expect(data.message).toContain('name')
    })

    it('should validate name length', async () => {
      const invalidCategory = {
        name: 'A' // Too short
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/categories',
        body: invalidCategory
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Category name must be between 2 and 100 characters')
    })

    it('should handle creation errors', async () => {
      const newCategory = {
        name: 'Test Category'
      }

      vi.mocked(auditedCategoryService.create).mockRejectedValue(new Error('Category name already exists'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/categories',
        body: newCategory
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create category')
      expect(data.message).toBe('Category name already exists')
    })
  })

  describe('PUT /api/categories', () => {
    it('should update a category successfully', async () => {
      const updates = {
        id: '123',
        name: 'Updated Category',
        description: 'Updated description',
        color: '#f59e0b'
      }

      const updatedCategory = {
        id: '123',
        name: 'Updated Category',
        description: 'Updated description',
        color: '#f59e0b',
        is_active: true,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedCategoryService.update).mockResolvedValue(updatedCategory)

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/categories',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(auditedCategoryService.update).toHaveBeenCalledWith('123', {
        name: 'Updated Category',
        description: 'Updated description',
        color: '#f59e0b'
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedCategory)
    })

    it('should require category ID', async () => {
      const updates = {
        name: 'Updated Category'
        // Missing ID
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/categories',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Category ID is required')
    })

    it('should validate name length in updates', async () => {
      const updates = {
        id: '123',
        name: 'A' // Too short
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/categories',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Category name must be between 2 and 100 characters')
    })

    it('should handle update errors', async () => {
      const updates = {
        id: '123',
        name: 'Updated Category'
      }

      vi.mocked(auditedCategoryService.update).mockRejectedValue(new Error('Category not found'))

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/categories',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update category')
      expect(data.message).toBe('Category not found')
    })
  })

  describe('DELETE /api/categories', () => {
    it('should delete a category successfully when not in use', async () => {
      vi.mocked(inventoryService.getByCategory).mockResolvedValue([])
      vi.mocked(auditedCategoryService.delete).mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/categories?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(inventoryService.getByCategory).toHaveBeenCalledWith('123')
      expect(auditedCategoryService.delete).toHaveBeenCalledWith('123')
      expect(data.success).toBe(true)
      expect(data.message).toBe('Category deleted successfully')
    })

    it('should prevent deletion when category is in use', async () => {
      const mockInventoryItems = [
        { id: '1', name: 'Item 1', category_id: '123' },
        { id: '2', name: 'Item 2', category_id: '123' }
      ]

      vi.mocked(inventoryService.getByCategory).mockResolvedValue(mockInventoryItems)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/categories?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(inventoryService.getByCategory).toHaveBeenCalledWith('123')
      expect(auditedCategoryService.delete).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Cannot delete category that is in use by inventory items')
      expect(data.message).toBe('Category is used by 2 inventory item(s)')
    })

    it('should require category ID', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/categories'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Category ID is required')
    })

    it('should handle deletion errors', async () => {
      vi.mocked(inventoryService.getByCategory).mockResolvedValue([])
      vi.mocked(auditedCategoryService.delete).mockRejectedValue(new Error('Category not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/categories?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete category')
      expect(data.message).toBe('Category not found')
    })
  })
})