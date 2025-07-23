import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST, PUT, DELETE } from '@/app/api/users/route'
import { userService } from '@/lib/database'
import { auditedUserService } from '@/lib/database-with-audit'

// Mock the database services
vi.mock('@/lib/database', () => ({
  userService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedUserService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

describe('/api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/users', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(userService.getAll).mockResolvedValue(mockUsers)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(userService.getAll).toHaveBeenCalledOnce()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUsers)
    })

    it('should filter users by role', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          is_active: true
        },
        {
          id: '2',
          name: 'Regular User',
          email: 'user@example.com',
          role: 'user',
          is_active: true
        }
      ]

      vi.mocked(userService.getAll).mockResolvedValue(mockUsers)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?role=admin'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].role).toBe('admin')
    })

    it('should filter users by status', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Active User',
          email: 'active@example.com',
          role: 'user',
          is_active: true
        },
        {
          id: '2',
          name: 'Inactive User',
          email: 'inactive@example.com',
          role: 'user',
          is_active: false
        }
      ]

      vi.mocked(userService.getAll).mockResolvedValue(mockUsers)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?status=active'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].is_active).toBe(true)
    })

    it('should search users by name and email', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          is_active: true
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          is_active: true
        }
      ]

      vi.mocked(userService.getAll).mockResolvedValue(mockUsers)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users?search=john'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('John Doe')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(userService.getAll).mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch users')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        role: 'user',
        status: 'active'
      }

      const createdUser = {
        id: '123',
        ...newUser,
        is_active: true,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedUserService.create).mockResolvedValue(createdUser)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: newUser
      })

      const response = await POST(req)
      const data = await response.json()

      expect(auditedUserService.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@example.com',
        role: 'user',
        status: 'active'
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdUser)
    })

    it('should validate required fields', async () => {
      const incompleteUser = {
        name: 'Test User'
        // Missing email and role
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: incompleteUser
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
      expect(data.message).toContain('email')
      expect(data.message).toContain('role')
    })

    it('should validate email format', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email',
        role: 'user'
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: invalidUser
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid email format')
    })

    it('should handle creation errors', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      }

      vi.mocked(auditedUserService.create).mockRejectedValue(new Error('Email already exists'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users',
        body: newUser
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create user')
      expect(data.message).toBe('Email already exists')
    })
  })

  describe('PUT /api/users', () => {
    it('should update a user successfully', async () => {
      const updates = {
        id: '123',
        name: 'Updated Name',
        role: 'admin'
      }

      const updatedUser = {
        id: '123',
        name: 'Updated Name',
        email: 'user@example.com',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedUserService.update).mockResolvedValue(updatedUser)

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/users',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(auditedUserService.update).toHaveBeenCalledWith('123', {
        name: 'Updated Name',
        role: 'admin'
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedUser)
    })

    it('should require user ID', async () => {
      const updates = {
        name: 'Updated Name'
        // Missing ID
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/users',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('User ID is required')
    })

    it('should validate email format in updates', async () => {
      const updates = {
        id: '123',
        email: 'invalid-email-format'
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/users',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid email format')
    })

    it('should handle update errors', async () => {
      const updates = {
        id: '123',
        name: 'Updated Name'
      }

      vi.mocked(auditedUserService.update).mockRejectedValue(new Error('User not found'))

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/users',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update user')
      expect(data.message).toBe('User not found')
    })
  })

  describe('DELETE /api/users', () => {
    it('should delete a user successfully', async () => {
      vi.mocked(auditedUserService.delete).mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/users?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(auditedUserService.delete).toHaveBeenCalledWith('123')
      expect(data.success).toBe(true)
      expect(data.message).toBe('User deleted successfully')
    })

    it('should require user ID', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/users'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('User ID is required')
    })

    it('should handle deletion errors', async () => {
      vi.mocked(auditedUserService.delete).mockRejectedValue(new Error('User not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/users?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete user')
      expect(data.message).toBe('User not found')
    })
  })
})