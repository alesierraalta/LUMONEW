import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { auditService } from '@/lib/audit'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          range: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        lte: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            range: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        lt: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        lt: vi.fn()
      }))
    }))
  }
}))

// Mock browser APIs
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  writable: true
})

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance
    ;(auditService as any).instance = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = auditService
      const instance2 = auditService
      expect(instance1).toBe(instance2)
    })
  })

  describe('setUserContext', () => {
    it('should set user context correctly', () => {
      const user = { id: 'user-123', email: 'test@example.com' }
      const sessionId = 'session-456'
      
      auditService.setUserContext(user, sessionId)
      
      expect((auditService as any).currentUser).toEqual(user)
      expect((auditService as any).sessionId).toBe(sessionId)
    })
  })

  describe('logOperation', () => {
    it('should log a basic operation successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123', operation: 'INSERT' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const operationData = {
        operation: 'INSERT' as const,
        table_name: 'inventory',
        record_id: '456',
        new_values: { name: 'Test Item', quantity: 10 }
      }

      const result = await auditService.logOperation(operationData)

      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          operation: 'INSERT',
          table_name: 'inventory',
          record_id: '456',
          new_values: { name: 'Test Item', quantity: 10 },
          user_agent: expect.stringContaining('Mozilla')
        })
      ])
      expect(result).toEqual({ id: '123', operation: 'INSERT' })
    })

    it('should handle user context when available', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const user = { id: 'user-123', email: 'test@example.com' }
      auditService.setUserContext(user, 'session-456')

      const operationData = {
        operation: 'UPDATE' as const,
        table_name: 'users',
        record_id: '789'
      }

      await auditService.logOperation(operationData)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user-123',
          user_email: 'test@example.com',
          session_id: 'session-456'
        })
      ])
    })

    it('should handle errors gracefully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const operationData = {
        operation: 'DELETE' as const,
        table_name: 'inventory',
        record_id: '999'
      }

      const result = await auditService.logOperation(operationData)
      expect(result).toBeNull()
    })
  })

  describe('logCreate', () => {
    it('should log create operation with correct data', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const newData = { id: '456', name: 'New Item', quantity: 5 }
      const metadata = { action_type: 'item_created' }

      await auditService.logCreate('inventory', '456', newData, metadata)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          operation: 'INSERT',
          table_name: 'inventory',
          record_id: '456',
          new_values: newData,
          metadata: expect.objectContaining({
            ...metadata,
            action_type: 'create'
          })
        })
      ])
    })
  })

  describe('logUpdate', () => {
    it('should log update operation with old and new values', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const oldData = { id: '456', name: 'Old Item', quantity: 5 }
      const newData = { id: '456', name: 'Updated Item', quantity: 10 }
      const metadata = { action_type: 'item_updated' }

      await auditService.logUpdate('inventory', '456', oldData, newData, metadata)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          operation: 'UPDATE',
          table_name: 'inventory',
          record_id: '456',
          old_values: oldData,
          new_values: newData,
          metadata: expect.objectContaining({
            ...metadata,
            action_type: 'update',
            affected_fields: ['name', 'quantity']
          })
        })
      ])
    })

    it('should detect field changes correctly', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const oldData = { id: '456', name: 'Old Item', quantity: 5, price: 10.00 }
      const newData = { id: '456', name: 'Updated Item', quantity: 5, price: 15.00 }

      await auditService.logUpdate('inventory', '456', oldData, newData)

      const insertCall = mockInsert.mock.calls[0][0][0]
      expect(insertCall.metadata.affected_fields).toEqual(['name', 'price'])
    })
  })

  describe('logDelete', () => {
    it('should log delete operation with old values', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const oldData = { id: '456', name: 'Deleted Item', quantity: 5 }
      const metadata = { action_type: 'item_deleted', reason: 'User requested deletion' }

      await auditService.logDelete('inventory', '456', oldData, metadata)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          operation: 'DELETE',
          table_name: 'inventory',
          record_id: '456',
          old_values: oldData,
          new_values: null,
          metadata: expect.objectContaining({
            ...metadata,
            action_type: 'delete'
          })
        })
      ])
    })
  })

  describe('logAuth', () => {
    it('should log authentication events', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      await auditService.logAuth('LOGIN', 'user-123', 'test@example.com', { device: 'mobile' })

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          operation: 'LOGIN',
          table_name: 'users',
          record_id: 'user-123',
          user_id: 'user-123',
          user_email: 'test@example.com',
          metadata: expect.objectContaining({
            action_type: 'login',
            device: 'mobile'
          })
        })
      ])
    })
  })

  describe('getRecentLogs', () => {
    it('should retrieve recent logs with default limit', async () => {
      const mockData = [
        { id: '1', operation: 'INSERT', table_name: 'inventory', created_at: '2024-01-01' },
        { id: '2', operation: 'UPDATE', table_name: 'users', created_at: '2024-01-02' }
      ]

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      ;(supabase.from as Mock).mockReturnValue({
        select: mockSelect
      })

      const result = await auditService.getRecentLogs()

      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockLimit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockData)
    })

    it('should retrieve recent logs with custom limit', async () => {
      const mockData = [
        { id: '1', operation: 'INSERT', table_name: 'inventory', created_at: '2024-01-01' }
      ]

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      ;(supabase.from as Mock).mockReturnValue({
        select: mockSelect
      })

      const result = await auditService.getRecentLogs(5)

      expect(mockLimit).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockData)
    })
  })

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      const mockData = [
        { id: '1', operation: 'DELETE', table_name: 'inventory', user_id: 'user-123' }
      ]

      // Mock the complete query chain
      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
      }

      ;(supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQueryChain)
      })

      const filters = {
        user_id: 'user-123',
        operation: 'DELETE',
        table_name: 'inventory'
      }

      const result = await auditService.getAuditLogs(filters)

      expect(mockQueryChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockQueryChain.eq).toHaveBeenCalledWith('operation', 'DELETE')
      expect(mockQueryChain.eq).toHaveBeenCalledWith('table_name', 'inventory')
      expect(result.data).toEqual(mockData)
      expect(result.error).toBeNull()
    })

    it('should handle search filters', async () => {
      const mockData = [
        { id: '1', table_name: 'inventory', user_email: 'test@example.com' }
      ]

      // Mock the complete query chain for search
      const mockQueryChain = {
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
      }

      ;(supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQueryChain)
      })

      const result = await auditService.getAuditLogs({ search: 'test' })

      expect(mockQueryChain.or).toHaveBeenCalledWith(expect.stringContaining('test'))
      expect(result.data).toEqual(mockData)
    })
  })

  describe('getRecentActivity', () => {
    it('should retrieve recent activity with default limit', async () => {
      const mockData = [
        { id: '1', operation: 'INSERT', created_at: new Date().toISOString() }
      ]

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      ;(supabase.from as Mock).mockReturnValue({
        select: mockSelect
      })

      const result = await auditService.getRecentActivity()

      expect(mockLimit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockData)
    })

    it('should retrieve recent activity with custom limit', async () => {
      const mockData = [
        { id: '1', operation: 'INSERT', created_at: new Date().toISOString() }
      ]

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      ;(supabase.from as Mock).mockReturnValue({
        select: mockSelect
      })

      const result = await auditService.getRecentActivity(25)

      expect(mockLimit).toHaveBeenCalledWith(25)
      expect(result).toEqual(mockData)
    })
  })

  describe('getUserActivity', () => {
    it('should retrieve user-specific activity', async () => {
      const mockData = [
        { id: '1', user_id: 'user-123', operation: 'UPDATE' }
      ]

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      ;(supabase.from as Mock).mockReturnValue({
        select: mockSelect
      })

      const result = await auditService.getUserActivity('user-123', 25)

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockLimit).toHaveBeenCalledWith(25)
      expect(result).toEqual(mockData)
    })
  })

  describe('getAuditStats', () => {
    it('should retrieve audit statistics', async () => {
      const mockData = [
        { operation: 'INSERT', table_name: 'inventory', created_at: '2024-01-01' },
        { operation: 'UPDATE', table_name: 'inventory', created_at: '2024-01-02' },
        { operation: 'DELETE', table_name: 'users', created_at: '2024-01-03' }
      ]

      // Create a fresh mock for this specific test
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      })

      // Replace the entire supabase mock for this test
      vi.mocked(supabase).from = mockFrom

      const result = await auditService.getAuditStats()

      expect(mockFrom).toHaveBeenCalledWith('audit_logs')
      expect(result).toEqual({
        total_operations: 3,
        operations_by_type: { INSERT: 1, UPDATE: 1, DELETE: 1 },
        operations_by_table: { inventory: 2, users: 1 },
        recent_activity: mockData.slice(0, 10)
      })
    })

    it('should apply date filters', async () => {
      const mockData: any[] = []
      const mockQuery = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const mockLte = vi.fn().mockReturnValue(mockQuery)
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte })
      const mockSelect = vi.fn().mockReturnValue({ gte: mockGte })

      ;(supabase.from as Mock).mockReturnValue({
        select: mockSelect
      })

      await auditService.getAuditStats('2024-01-01', '2024-01-31')

      expect(mockGte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(mockLte).toHaveBeenCalledWith('created_at', '2024-01-31')
    })
  })

  describe('cleanupOldLogs', () => {
    it('should clean up old logs', async () => {
      const mockLt = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ lt: mockLt })

      ;(supabase.from as Mock).mockReturnValue({
        delete: mockDelete
      })

      const result = await auditService.cleanupOldLogs(30)

      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockLt).toHaveBeenCalledWith('created_at', expect.any(String))
      expect(result).toBe(true)
    })

    it('should handle cleanup errors', async () => {
      const mockLt = vi.fn().mockResolvedValue({ error: { message: 'Cleanup failed' } })
      const mockDelete = vi.fn().mockReturnValue({ lt: mockLt })

      ;(supabase.from as Mock).mockReturnValue({
        delete: mockDelete
      })

      const result = await auditService.cleanupOldLogs(30)

      expect(result).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Network error'))
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      const operationData = {
        operation: 'INSERT' as const,
        table_name: 'inventory',
        record_id: '456'
      }

      const result = await auditService.logOperation(operationData)
      expect(result).toBeNull()
    })
  })

  describe('Performance', () => {
    it('should handle large data objects efficiently', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123' },
            error: null
          })
        })
      })

      ;(supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      })

      // Create a large data object
      const largeData = {
        id: '456',
        ...Array.from({ length: 100 }, (_, i) => ({ [`field_${i}`]: `value_${i}` })).reduce((acc, obj) => ({ ...acc, ...obj }), {})
      }

      const startTime = Date.now()
      await auditService.logCreate('inventory', '456', largeData)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          new_values: largeData
        })
      ])
    })
  })
})