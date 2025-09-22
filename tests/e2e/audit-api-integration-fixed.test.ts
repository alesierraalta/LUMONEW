/**
 * Audit System API Integration Tests - Fixed Version
 * Tests the audit system APIs and database integration
 */

import { test, expect } from '@playwright/test'

test.describe('Audit System API Integration', () => {
  test('should retrieve audit logs via API', async ({ request }) => {
    // Test GET /api/audit/recent endpoint
    const response = await request.get('http://localhost:3000/api/audit/recent')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    expect(result).toHaveProperty('success')
    expect(result.success).toBe(true)
    
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      
      // Verify audit log structure
      if (data.length > 0) {
        const firstLog = data[0]
        expect(firstLog).toHaveProperty('id')
        expect(firstLog).toHaveProperty('operation')
        expect(firstLog).toHaveProperty('table_name')
        expect(firstLog).toHaveProperty('record_id')
        expect(firstLog).toHaveProperty('user_id')
        expect(firstLog).toHaveProperty('created_at')
        
        // Verify operation types
        expect(['INSERT', 'UPDATE', 'DELETE']).toContain(firstLog.operation)
        
        // Verify table names
        expect(['inventory', 'users', 'categories', 'locations']).toContain(firstLog.table_name)
      }
    }
  })

  test('should retrieve audit logs with pagination', async ({ request }) => {
    // Test pagination parameters
    const response = await request.get('http://localhost:3000/api/audit/recent?limit=10&offset=0')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    expect(result).toHaveProperty('success')
    
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeLessThanOrEqual(10)
    }
  })

  test('should retrieve audit logs with filters', async ({ request }) => {
    // Test filtering by operation type
    const response = await request.get('http://localhost:3000/api/audit/recent?operation=DELETE')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    expect(result).toHaveProperty('success')
    
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      
      // Verify all returned logs are DELETE operations
      data.forEach((log: any) => {
        expect(log.operation).toBe('DELETE')
      })
    }
  })

  test('should retrieve audit logs by table name', async ({ request }) => {
    // Test filtering by table name
    const response = await request.get('http://localhost:3000/api/audit/recent?table_name=inventory')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    expect(result).toHaveProperty('success')
    
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      
      // Verify all returned logs are for inventory table
      data.forEach((log: any) => {
        expect(log.table_name).toBe('inventory')
      })
    }
  })

  test('should retrieve audit logs by user', async ({ request }) => {
    // Test filtering by user
    const response = await request.get('http://localhost:3000/api/audit/recent?user_id=system')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    expect(result).toHaveProperty('success')
    
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      
      // Verify all returned logs are from system user
      data.forEach((log: any) => {
        expect(log.user_id).toContain('system')
      })
    }
  })

  test('should retrieve audit statistics', async ({ request }) => {
    // Test audit statistics endpoint
    const response = await request.get('http://localhost:3000/api/audit/stats')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    expect(result).toHaveProperty('success')
    expect(result.success).toBe(true)
    
    if (result.success && result.data) {
      const data = result.data
      
      // Verify statistics structure
      expect(data).toHaveProperty('total_operations')
      expect(data).toHaveProperty('operations_today')
      expect(data).toHaveProperty('active_users')
      expect(data).toHaveProperty('deletions')
      
      // Verify statistics are numbers
      expect(typeof data.total_operations).toBe('number')
      expect(typeof data.operations_today).toBe('number')
      expect(typeof data.active_users).toBe('number')
      expect(typeof data.deletions).toBe('number')
      
      // Verify statistics are non-negative
      expect(data.total_operations).toBeGreaterThanOrEqual(0)
      expect(data.operations_today).toBeGreaterThanOrEqual(0)
      expect(data.active_users).toBeGreaterThanOrEqual(0)
      expect(data.deletions).toBeGreaterThanOrEqual(0)
    }
  })

  test('should handle invalid filter parameters gracefully', async ({ request }) => {
    // Test with invalid operation type
    const response = await request.get('http://localhost:3000/api/audit/recent?operation=INVALID')
    
    // Should either return 400 (Bad Request) or empty array
    expect([200, 400]).toContain(response.status())
    
    if (response.status() === 200) {
      const result = await response.json()
      if (result.success && result.data) {
        const data = result.data
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(0)
      }
    }
  })

  test('should handle large limit parameter', async ({ request }) => {
    // Test with large limit
    const response = await request.get('http://localhost:3000/api/audit/recent?limit=1000')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeLessThanOrEqual(1000)
    }
  })

  test('should handle negative offset parameter', async ({ request }) => {
    // Test with negative offset
    const response = await request.get('http://localhost:3000/api/audit/recent?offset=-10')
    
    // Should handle gracefully (either return 400 or treat as 0)
    expect([200, 400]).toContain(response.status())
  })

  test('should return audit logs in chronological order', async ({ request }) => {
    // Test that logs are returned in chronological order (newest first)
    const response = await request.get('http://localhost:3000/api/audit/recent?limit=5')
    
    expect(response.status()).toBe(200)
    
    const result = await response.json()
    if (result.success && result.data) {
      const data = result.data
      expect(Array.isArray(data)).toBe(true)
      
      if (data.length > 1) {
        // Verify logs are in descending chronological order
        for (let i = 0; i < data.length - 1; i++) {
          const currentLog = new Date(data[i].created_at)
          const nextLog = new Date(data[i + 1].created_at)
          expect(currentLog.getTime()).toBeGreaterThanOrEqual(nextLog.getTime())
        }
      }
    }
  })
})
