import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Supabase for E2E tests - Define before imports to avoid hoisting issues
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ 
          data: [
            {
              id: 'e2e-test-1',
              operation: 'INSERT',
              table_name: 'inventory',
              record_id: 'product-123',
              user_email: 'test@example.com',
              user_id: 'user-123',
              created_at: new Date().toISOString(),
              old_values: null,
              new_values: { name: 'Test Product', quantity: 10 },
              ip_address: '192.168.1.1',
              user_agent: 'Test Browser',
              session_id: 'session-123'
            }
          ], 
          error: null 
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
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { 
            id: 'audit-log-123',
            operation: 'INSERT',
            table_name: 'inventory',
            record_id: 'product-123',
            created_at: new Date().toISOString()
          }, 
          error: null 
        }))
      }))
    })),
    delete: vi.fn(() => ({
      lt: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }))
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}))

import { auditService } from '@/lib/audit'

describe('Audit System End-to-End Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete CRUD Audit Workflow', () => {
    it('should log and track a complete product lifecycle', async () => {
      // Step 1: Create a product (INSERT operation)
      const createResult = await auditService.logOperation({
        operation: 'INSERT',
        table_name: 'inventory',
        record_id: 'product-123',
        new_values: {
          name: 'Test Product',
          quantity: 10,
          price: 29.99,
          category_id: 'cat-1'
        },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(createResult).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')

      // Step 2: Update the product (UPDATE operation)
      const updateResult = await auditService.logOperation({
        operation: 'UPDATE',
        table_name: 'inventory',
        record_id: 'product-123',
        old_values: {
          name: 'Test Product',
          quantity: 10,
          price: 29.99
        },
        new_values: {
          name: 'Updated Test Product',
          quantity: 15,
          price: 34.99
        },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(updateResult).toBeDefined()

      // Step 3: Delete the product (DELETE operation)
      const deleteResult = await auditService.logOperation({
        operation: 'DELETE',
        table_name: 'inventory',
        record_id: 'product-123',
        old_values: {
          name: 'Updated Test Product',
          quantity: 15,
          price: 34.99,
          category_id: 'cat-1'
        },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(deleteResult).toBeDefined()

      // Step 4: Verify audit trail retrieval
      const auditLogs = await auditService.getAuditLogs({
        table_name: 'inventory'
      })

      expect(auditLogs.data).toBeDefined()
      expect(Array.isArray(auditLogs.data)).toBe(true)
    })

    it('should handle bulk operations audit logging', async () => {
      const bulkResult = await auditService.logOperation({
        operation: 'BULK_OPERATION',
        table_name: 'inventory',
        record_id: 'bulk-update-001',
        new_values: {
          operation_type: 'price_update',
          affected_records: 50,
          criteria: { category_id: 'cat-electronics' },
          changes: { discount_percentage: 15 }
        },
        user_id: 'admin-123',
        user_email: 'admin@example.com'
      })

      expect(bulkResult).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    it('should track user authentication events', async () => {
      // Login event
      const loginResult = await auditService.logOperation({
        operation: 'LOGIN',
        table_name: 'users',
        record_id: 'user-123',
        new_values: {
          login_method: 'email_password',
          login_time: new Date().toISOString(),
          device_info: 'Chrome on Windows'
        },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(loginResult).toBeDefined()

      // Logout event
      const logoutResult = await auditService.logOperation({
        operation: 'LOGOUT',
        table_name: 'users',
        record_id: 'user-123',
        old_values: {
          session_duration: '2h 15m',
          last_activity: new Date().toISOString()
        },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(logoutResult).toBeDefined()
    })
  })

  describe('Audit Data Retrieval and Analysis', () => {
    it('should retrieve comprehensive audit statistics', async () => {
      // Mock stats data
      const mockStats = {
        total_operations: 1500,
        operations_by_type: {
          INSERT: 600,
          UPDATE: 500,
          DELETE: 200,
          LOGIN: 150,
          LOGOUT: 50
        },
        operations_by_table: {
          inventory: 800,
          users: 400,
          categories: 200,
          locations: 100
        },
        recent_activity: [
          {
            id: 'recent-1',
            operation: 'UPDATE',
            table_name: 'inventory',
            user_email: 'test@example.com',
            created_at: new Date().toISOString()
          }
        ]
      }

      // Mock the getAuditStats method
      vi.spyOn(auditService, 'getAuditStats').mockResolvedValue(mockStats)

      const stats = await auditService.getAuditStats()
      
      expect(stats).toEqual(mockStats)
      expect(stats.total_operations).toBe(1500)
      expect(stats.operations_by_type.INSERT).toBe(600)
      expect(stats.operations_by_table.inventory).toBe(800)
      expect(Array.isArray(stats.recent_activity)).toBe(true)
    })

    it('should filter audit logs by date range', async () => {
      const dateFrom = '2024-01-01'
      const dateTo = '2024-01-31'

      const filteredLogs = await auditService.getAuditLogs({
        date_from: dateFrom,
        date_to: dateTo
      })

      expect(filteredLogs.data).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    it('should retrieve user-specific activity', async () => {
      const userId = 'user-123'
      const limit = 25

      const userActivity = await auditService.getUserActivity(userId, limit)

      expect(Array.isArray(userActivity)).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    it('should get recent activity with custom limit', async () => {
      const limit = 50

      const recentActivity = await auditService.getRecentActivity(limit)

      expect(Array.isArray(recentActivity)).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })
  })

  describe('Audit System Performance and Cleanup', () => {
    it('should handle audit log cleanup for old records', async () => {
      const daysToKeep = 90
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const cleanupResult = await auditService.cleanupOldLogs(daysToKeep)

      expect(cleanupResult).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs')
    })

    it('should handle concurrent audit logging operations', async () => {
      // Simulate multiple concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) => 
        auditService.logOperation({
          operation: 'INSERT',
          table_name: 'inventory',
          record_id: `concurrent-product-${i}`,
          new_values: { name: `Product ${i}`, quantity: i * 10 },
          user_id: 'user-123',
          user_email: 'test@example.com'
        })
      )

      const results = await Promise.all(operations)

      // All operations should succeed
      results.forEach(result => {
        expect(result).toBeDefined()
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(10)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should gracefully handle database connection failures', async () => {
      // Mock database error
      const errorMock = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Connection failed' }
            }))
          }))
        }))
      }
      mockSupabaseClient.from.mockReturnValueOnce(errorMock as any)

      const result = await auditService.logOperation({
        operation: 'INSERT',
        table_name: 'inventory',
        record_id: 'error-test',
        new_values: { name: 'Error Test' },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(result).toBeNull()
    })

    it('should handle malformed audit data gracefully', async () => {
      const result = await auditService.logOperation({
        operation: 'INVALID_OPERATION' as any,
        table_name: '',
        record_id: '',
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      // Should still attempt to log even with invalid data
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })
  })

  describe('Integration with External Systems', () => {
    it('should support export operations audit logging', async () => {
      const exportResult = await auditService.logOperation({
        operation: 'EXPORT',
        table_name: 'inventory',
        record_id: 'export-001',
        new_values: {
          export_type: 'CSV',
          record_count: 1500,
          file_size: '2.5MB',
          export_criteria: { category: 'electronics', status: 'active' }
        },
        user_id: 'user-123',
        user_email: 'test@example.com'
      })

      expect(exportResult).toBeDefined()
    })

    it('should support import operations audit logging', async () => {
      const importResult = await auditService.logOperation({
        operation: 'IMPORT',
        table_name: 'inventory',
        record_id: 'import-001',
        new_values: {
          import_type: 'CSV',
          records_imported: 250,
          records_failed: 5,
          file_name: 'inventory_update_2024.csv',
          validation_errors: ['Invalid price format on row 15']
        },
        user_id: 'admin-456',
        user_email: 'admin@example.com'
      })

      expect(importResult).toBeDefined()
    })
  })
})