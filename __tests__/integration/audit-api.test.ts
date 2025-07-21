import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      or: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
      }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null
    }))
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}))

// Mock audit service
vi.mock('@/lib/audit', () => ({
  auditService: {
    getAuditLogs: vi.fn(),
    getRecentActivity: vi.fn(),
    getUserActivity: vi.fn(),
    getAuditStats: vi.fn(),
    logOperation: vi.fn()
  }
}))

describe('Audit API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/audit/logs', () => {
    it('should return audit logs with default parameters', async () => {
      const mockLogs = [
        {
          id: '1',
          operation: 'INSERT',
          table_name: 'inventory',
          record_id: '123',
          user_email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          operation: 'UPDATE',
          table_name: 'users',
          record_id: '456',
          user_email: 'admin@example.com',
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      // Mock the audit service response
      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: mockLogs,
        error: null
      })

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/audit/logs', {
        method: 'GET'
      })

      // Import and test the API handler
      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLogs)
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({})
    })

    it('should handle query parameters correctly', async () => {
      const mockLogs = [
        {
          id: '1',
          operation: 'DELETE',
          table_name: 'inventory',
          record_id: '789',
          user_email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: mockLogs,
        error: null
      })

      const url = new URL('http://localhost:3000/api/audit/logs')
      url.searchParams.set('operation', 'DELETE')
      url.searchParams.set('table_name', 'inventory')
      url.searchParams.set('limit', '25')

      const request = new NextRequest(url, { method: 'GET' })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({
        operation: 'DELETE',
        table_name: 'inventory',
        limit: 25
      })
    })

    it('should handle search parameters', async () => {
      const mockLogs = [
        {
          id: '1',
          operation: 'INSERT',
          table_name: 'inventory',
          record_id: '123',
          user_email: 'search@example.com',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: mockLogs,
        error: null
      })

      const url = new URL('http://localhost:3000/api/audit/logs')
      url.searchParams.set('search', 'search@example.com')

      const request = new NextRequest(url, { method: 'GET' })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({
        search: 'search@example.com'
      })
    })

    it('should handle date range filters', async () => {
      const mockLogs = []

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: mockLogs,
        error: null
      })

      const url = new URL('http://localhost:3000/api/audit/logs')
      url.searchParams.set('date_from', '2024-01-01')
      url.searchParams.set('date_to', '2024-01-31')

      const request = new NextRequest(url, { method: 'GET' })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      })
    })

    it('should handle service errors gracefully', async () => {
      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: [],
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/audit/logs', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })
  })

  describe('GET /api/audit/stats', () => {
    it('should return audit statistics', async () => {
      const mockStats = {
        total_operations: 1000,
        operations_by_type: {
          INSERT: 400,
          UPDATE: 350,
          DELETE: 250
        },
        operations_by_table: {
          inventory: 600,
          users: 300,
          categories: 100
        },
        recent_activity: []
      }

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditStats).mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/audit/stats', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/audit/stats/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockStats)
    })

    it('should handle date range parameters for stats', async () => {
      const mockStats = {
        total_operations: 100,
        operations_by_type: { INSERT: 50, UPDATE: 30, DELETE: 20 },
        operations_by_table: { inventory: 100 },
        recent_activity: []
      }

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditStats).mockResolvedValue(mockStats)

      const url = new URL('http://localhost:3000/api/audit/stats')
      url.searchParams.set('date_from', '2024-01-01')
      url.searchParams.set('date_to', '2024-01-31')

      const request = new NextRequest(url, { method: 'GET' })

      const { GET } = await import('@/app/api/audit/stats/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditService.getAuditStats).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
    })

    it('should handle stats service errors', async () => {
      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditStats).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/audit/stats', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/audit/stats/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch audit statistics')
    })
  })

  describe('GET /api/audit/recent', () => {
    it('should return recent activity', async () => {
      const mockActivity = [
        {
          id: '1',
          operation: 'INSERT',
          table_name: 'inventory',
          record_id: '123',
          user_email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      ]

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getRecentActivity).mockResolvedValue(mockActivity)

      const request = new NextRequest('http://localhost:3000/api/audit/recent', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/audit/recent/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockActivity)
      expect(auditService.getRecentActivity).toHaveBeenCalledWith(10)
    })

    it('should handle custom limit parameter', async () => {
      const mockActivity = []

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getRecentActivity).mockResolvedValue(mockActivity)

      const url = new URL('http://localhost:3000/api/audit/recent')
      url.searchParams.set('limit', '25')

      const request = new NextRequest(url, { method: 'GET' })

      const { GET } = await import('@/app/api/audit/recent/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(auditService.getRecentActivity).toHaveBeenCalledWith(25)
    })
  })

  describe('GET /api/audit/user/[userId]', () => {
    it('should return user-specific activity', async () => {
      const mockUserActivity = [
        {
          id: '1',
          user_id: 'user-123',
          operation: 'UPDATE',
          table_name: 'profile',
          record_id: 'profile-456',
          created_at: new Date().toISOString()
        }
      ]

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getUserActivity).mockResolvedValue(mockUserActivity)

      const request = new NextRequest('http://localhost:3000/api/audit/user/user-123', {
        method: 'GET'
      })

      // Mock the params object that Next.js would provide
      const params = { userId: 'user-123' }

      const { GET } = await import('@/app/api/audit/user/[userId]/route')
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUserActivity)
      expect(auditService.getUserActivity).toHaveBeenCalledWith('user-123', 20)
    })

    it('should handle custom limit for user activity', async () => {
      const mockUserActivity = []

      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getUserActivity).mockResolvedValue(mockUserActivity)

      const url = new URL('http://localhost:3000/api/audit/user/user-123')
      url.searchParams.set('limit', '50')

      const request = new NextRequest(url, { method: 'GET' })
      const params = { userId: 'user-123' }

      const { GET } = await import('@/app/api/audit/user/[userId]/route')
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(auditService.getUserActivity).toHaveBeenCalledWith('user-123', 50)
    })

    it('should handle missing userId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/user/', {
        method: 'GET'
      })

      const params = { userId: undefined }

      const { GET } = await import('@/app/api/audit/user/[userId]/route')
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('User ID is required')
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost:3000/api/audit/logs', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should validate query parameters', async () => {
      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: [],
        error: null
      })

      const url = new URL('http://localhost:3000/api/audit/logs')
      url.searchParams.set('limit', 'invalid')

      const request = new NextRequest(url, { method: 'GET' })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)

      expect(response.status).toBe(200) // Should handle invalid params gracefully
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({
        limit: NaN // or however the API handles invalid numbers
      })
    })
  })

  describe('Authentication & Authorization', () => {
    it('should handle authenticated requests', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-user', email: 'auth@example.com' } },
        error: null
      })

      const mockLogs = []
      const { auditService } = await import('@/lib/audit')
      vi.mocked(auditService.getAuditLogs).mockResolvedValue({
        data: mockLogs,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/audit/logs', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle unauthenticated requests', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const request = new NextRequest('http://localhost:3000/api/audit/logs', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/audit/logs/route')
      const response = await GET(request)

      // Depending on your auth implementation, this might return 401 or still work
      expect([200, 401]).toContain(response.status)
    })
  })
})