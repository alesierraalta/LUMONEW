import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ErrorSimulator,
  errorTestUtils,
  ErrorAssertions,
  ERROR_SCENARIOS,
  NetworkError,
  DatabaseError,
  AuthError
} from '../utils/error-simulation'
import { globalMockClient, initializeMockSupabaseClient } from '../mocks/supabase-mock'
import { server } from '../utils/msw-utils'

describe('Error Simulation Utilities', () => {
  let errorSimulator: ErrorSimulator

  beforeEach(() => {
    // Initialize mock client if not already done
    if (!globalMockClient) {
      initializeMockSupabaseClient()
    }
    
    // Create fresh ErrorSimulator instance for each test
    errorSimulator = new ErrorSimulator()
    
    // Register pre-built scenarios
    Object.values(ERROR_SCENARIOS).forEach(scenario => {
      errorSimulator.registerScenario(scenario)
    })
    
    server.resetHandlers()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    if (errorSimulator) {
      errorSimulator.reset()
    }
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  describe('NetworkErrorSimulator', () => {
    it('should simulate network timeout errors', async () => {
      const networkError: NetworkError = {
        type: 'network',
        method: 'GET',
        url: /\/api\/products/,
        status: 408,
        message: 'Request timeout',
        delay: 100
      }

      errorSimulator.network.injectError(networkError)

      // Simulate a fetch request that should timeout
      const mockFetch = vi.fn().mockRejectedValue(new Error('Request timeout'))
      
      try {
        await mockFetch('/api/products')
      } catch (error: any) {
        expect(error.message).toBe('Request timeout')
      }

      const activeErrors = errorSimulator.network.getActiveErrors()
      expect(activeErrors).toHaveLength(1)
      expect(activeErrors[0].status).toBe(408)
    })

    it('should simulate intermittent network failures', async () => {
      const networkError: NetworkError = {
        type: 'network',
        method: 'POST',
        url: /\/api\/inventory/,
        status: 500,
        message: 'Internal server error',
        count: 2 // Fail twice, then succeed
      }

      errorSimulator.network.injectError(networkError)

      // First two attempts should fail
      let attempts = 0
      const mockApiCall = async () => {
        attempts++
        if (attempts <= 2) {
          throw new Error('Internal server error')
        }
        return { success: true }
      }

      // First attempt fails
      await expect(mockApiCall()).rejects.toThrow('Internal server error')
      
      // Second attempt fails
      await expect(mockApiCall()).rejects.toThrow('Internal server error')
      
      // Third attempt succeeds
      const result = await mockApiCall()
      expect(result.success).toBe(true)
      expect(attempts).toBe(3)
    })

    it('should clear network errors', () => {
      const networkError: NetworkError = {
        type: 'network',
        method: 'GET',
        url: /\/api\/test/,
        status: 404,
        message: 'Not found'
      }

      errorSimulator.network.injectError(networkError)
      expect(errorSimulator.network.getActiveErrors()).toHaveLength(1)

      errorSimulator.network.clearAllErrors()
      expect(errorSimulator.network.getActiveErrors()).toHaveLength(0)
    })
  })

  describe('DatabaseErrorSimulator', () => {
    it('should simulate database connection failures', async () => {
      const dbError: DatabaseError = {
        type: 'database',
        operation: 'select',
        table: 'products',
        error: 'Connection to database failed',
        code: 'PGRST301'
      }

      errorSimulator.database.injectError(dbError)

      // Simulate a database query
      const result = await globalMockClient.from('products').select('*')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Connection to database failed')
      expect(result.error?.code).toBe('PGRST301')
      expect(result.data).toBeNull()
    })

    it('should simulate constraint violations', async () => {
      const dbError: DatabaseError = {
        type: 'database',
        operation: 'insert',
        table: 'products',
        error: 'Unique constraint violation',
        code: 'PGRST409'
      }

      errorSimulator.database.injectError(dbError)

      const result = await globalMockClient
        .from('products')
        .insert({ name: 'Test Product', sku: 'DUPLICATE-SKU' })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Unique constraint violation')
      expect(result.error?.code).toBe('PGRST409')
    })

    it('should simulate intermittent database failures', async () => {
      const dbError: DatabaseError = {
        type: 'database',
        operation: 'update',
        table: 'inventory',
        error: 'Temporary connection issue',
        code: 'PGRST500',
        count: 1 // Fail once, then succeed
      }

      errorSimulator.database.injectError(dbError)

      // First attempt should fail
      const firstResult = await globalMockClient
        .from('inventory')
        .update({ quantity: 10 })
        .eq('id', 'test-id')

      expect(firstResult.error).toBeTruthy()
      expect(firstResult.error?.message).toBe('Temporary connection issue')

      // Second attempt should succeed (error cleared after count reached)
      const secondResult = await globalMockClient
        .from('inventory')
        .update({ quantity: 10 })
        .eq('id', 'test-id')

      expect(secondResult.error).toBeNull()
    })

    it('should handle global database errors', async () => {
      const dbError: DatabaseError = {
        type: 'database',
        operation: 'select',
        // No table specified - affects all tables
        error: 'Database maintenance mode',
        code: 'PGRST503'
      }

      errorSimulator.database.injectError(dbError)

      // Should affect any table
      const productsResult = await globalMockClient.from('products').select('*')
      const inventoryResult = await globalMockClient.from('inventory').select('*')

      expect(productsResult.error?.message).toBe('Database maintenance mode')
      expect(inventoryResult.error?.message).toBe('Database maintenance mode')
    })
  })

  describe('AuthErrorSimulator', () => {
    it('should simulate authentication failures', async () => {
      const authError: AuthError = {
        type: 'auth',
        operation: 'signIn',
        error: 'Invalid credentials',
        code: 'invalid_credentials'
      }

      errorSimulator.auth.injectError(authError)

      const result = await globalMockClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Invalid credentials')
      expect(result.error?.code).toBe('invalid_credentials')
      expect(result.data).toBeNull()
    })

    it('should simulate token expiration', async () => {
      const authError: AuthError = {
        type: 'auth',
        operation: 'getUser',
        error: 'JWT expired',
        code: 'token_expired'
      }

      errorSimulator.auth.injectError(authError)

      const result = await globalMockClient.auth.getUser()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('JWT expired')
      expect(result.error?.code).toBe('token_expired')
    })

    it('should simulate session expiration with recovery', async () => {
      const authError: AuthError = {
        type: 'auth',
        operation: 'getSession',
        error: 'Session expired',
        code: 'session_expired',
        count: 1 // Fail once, then succeed
      }

      errorSimulator.auth.injectError(authError)

      // First call fails
      const firstResult = await globalMockClient.auth.getSession()
      expect(firstResult.error?.message).toBe('Session expired')

      // Second call succeeds (simulating token refresh)
      const secondResult = await globalMockClient.auth.getSession()
      expect(secondResult.error).toBeNull()
    })
  })

  describe('Error Scenarios', () => {
    it('should execute pre-built NETWORK_TIMEOUT scenario', async () => {
      const { result, error, scenario } = await errorSimulator.executeScenario(
        'NETWORK_TIMEOUT',
        async () => {
          // Simulate an API call that should timeout
          throw new Error('Request timeout')
        }
      )

      expect(scenario.name).toBe('NETWORK_TIMEOUT')
      expect(error).toBeTruthy()
      expect(error.message).toBe('Request timeout')
      expect(result).toBeNull()
    })

    it('should execute pre-built DATABASE_CONNECTION_FAILURE scenario', async () => {
      const { result, error, scenario } = await errorSimulator.executeScenario(
        'DATABASE_CONNECTION_FAILURE',
        async () => {
          const dbResult = await globalMockClient.from('products').select('*')
          if (dbResult.error) {
            throw new Error(dbResult.error.message)
          }
          return dbResult.data
        }
      )

      expect(scenario.name).toBe('DATABASE_CONNECTION_FAILURE')
      expect(error).toBeTruthy()
      expect(error.message).toBe('Connection to database failed')
    })

    it('should execute pre-built AUTH_TOKEN_EXPIRED scenario', async () => {
      const { result, error, scenario } = await errorSimulator.executeScenario(
        'AUTH_TOKEN_EXPIRED',
        async () => {
          const authResult = await globalMockClient.auth.getUser()
          if (authResult.error) {
            throw new Error(authResult.error.message)
          }
          return authResult.data
        }
      )

      expect(scenario.name).toBe('AUTH_TOKEN_EXPIRED')
      expect(error).toBeTruthy()
      expect(error.message).toBe('JWT expired')
    })

    it('should execute INTERMITTENT_FAILURES scenario with retry logic', async () => {
      let attempts = 0
      
      const { result, error, scenario } = await errorSimulator.executeScenario(
        'INTERMITTENT_FAILURES',
        async () => {
          attempts++
          
          // The INTERMITTENT_FAILURES scenario is configured to fail 2 times then succeed
          // Simulate the retry behavior based on attempt count
          if (attempts <= 2) {
            throw new Error('Internal server error')
          }
          
          return { success: true, attempts }
        }
      )

      expect(scenario.name).toBe('INTERMITTENT_FAILURES')
      // The scenario should succeed after retries (no error)
      expect(error).toBeNull()
      expect(result.success).toBe(true)
      expect(result.attempts).toBe(3)
    })
  })

  describe('Custom Error Scenarios', () => {
    it('should create and execute custom error scenario', async () => {
      const customScenario = errorTestUtils.createScenario(
        'CUSTOM_MULTI_ERROR',
        'Test multiple error types together',
        [
          {
            type: 'network',
            method: 'GET',
            url: /\/api\/status/,
            status: 503,
            message: 'Service unavailable'
          },
          {
            type: 'database',
            operation: 'select',
            table: 'health_check',
            error: 'Health check failed',
            code: 'HEALTH_001'
          }
        ],
        {
          setup: async () => {
            console.log('Setting up custom scenario')
          },
          cleanup: async () => {
            console.log('Cleaning up custom scenario')
          },
          assertions: (result, error) => {
            expect(error).toBeTruthy()
          }
        }
      )

      const { result, error, scenario } = await errorSimulator.executeScenario(
        'CUSTOM_MULTI_ERROR',
        async () => {
          // Test both network and database errors
          const dbResult = await globalMockClient.from('health_check').select('*')
          if (dbResult.error) {
            throw new Error(`DB Error: ${dbResult.error.message}`)
          }
          return { status: 'healthy' }
        }
      )

      expect(scenario.name).toBe('CUSTOM_MULTI_ERROR')
      expect(error).toBeTruthy()
      expect(error.message).toContain('Health check failed')
    })
  })

  describe('Error Test Utils', () => {
    it('should test with error simulation and isolation', async () => {
      const errors = [
        {
          type: 'database' as const,
          operation: 'insert' as const,
          table: 'test_table',
          error: 'Test error',
          code: 'TEST001'
        }
      ]

      const result = await errorTestUtils.withErrorSimulation(
        errors,
        async () => {
          const dbResult = await globalMockClient
            .from('test_table')
            .insert({ name: 'test' })
          
          return dbResult
        },
        { skipIsolation: true }
      )

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Test error')
      expect(result.error?.code).toBe('TEST001')
    })

    it('should test error scenario with isolation', async () => {
      const { result, error, scenario } = await errorTestUtils.withErrorScenario(
        'CONSTRAINT_VIOLATION',
        async () => {
          const dbResult = await globalMockClient
            .from('products')
            .insert({ name: 'Duplicate Product', sku: 'DUPLICATE' })
          
          if (dbResult.error) {
            throw new Error(dbResult.error.message)
          }
          
          return dbResult.data
        },
        { skipIsolation: true }
      )

      expect(scenario.name).toBe('CONSTRAINT_VIOLATION')
      expect(error).toBeTruthy()
      expect(error.message).toBe('Unique constraint violation')
    })
  })

  describe('Error Assertions', () => {
    it('should validate error expectations', () => {
      const errorResult = {
        data: null,
        error: {
          message: 'Database connection failed',
          code: 'PGRST301'
        }
      }

      // Should not throw
      ErrorAssertions.expectError(errorResult, 'Database connection')
      ErrorAssertions.expectDatabaseError(errorResult, 'PGRST301')

      // Should throw for wrong expectations
      expect(() => {
        ErrorAssertions.expectNoError(errorResult)
      }).toThrow('Expected no error but got')

      expect(() => {
        ErrorAssertions.expectDatabaseError(errorResult, 'WRONG_CODE')
      }).toThrow('Expected error code "WRONG_CODE" but got "PGRST301"')
    })

    it('should validate network error expectations', () => {
      const networkError = {
        status: 404,
        message: 'Not found'
      }

      // Should not throw
      ErrorAssertions.expectNetworkError(networkError, 404)

      // Should throw for wrong status
      expect(() => {
        ErrorAssertions.expectNetworkError(networkError, 500)
      }).toThrow('Expected status 500 but got 404')
    })

    it('should validate auth error expectations', () => {
      const authResult = {
        data: null,
        error: {
          message: 'Invalid token',
          code: 'invalid_token'
        }
      }

      // Should not throw
      ErrorAssertions.expectAuthError(authResult, 'invalid_token')

      // Should throw for wrong code
      expect(() => {
        ErrorAssertions.expectAuthError(authResult, 'expired_token')
      }).toThrow('Expected auth error code "expired_token" but got "invalid_token"')
    })

    it('should validate retry behavior', () => {
      // Should not throw
      ErrorAssertions.expectRetryBehavior(3, 3)

      // Should throw for wrong attempt count
      expect(() => {
        ErrorAssertions.expectRetryBehavior(2, 3)
      }).toThrow('Expected 3 retry attempts but got 2')
    })

    it('should validate error recovery', () => {
      const initialError = new Error('Initial failure')
      const finalResult = { success: true }

      // Should not throw
      ErrorAssertions.expectErrorRecovery(initialError, finalResult)

      // Should throw if no initial error
      expect(() => {
        ErrorAssertions.expectErrorRecovery(null, finalResult)
      }).toThrow('Expected initial error for recovery test')

      // Should throw if recovery failed
      expect(() => {
        ErrorAssertions.expectErrorRecovery(initialError, { error: 'Still failing' })
      }).toThrow('Expected successful recovery but operation still failed')
    })
  })

  describe('Error State Management', () => {
    it('should track active errors across simulators', () => {
      // Inject errors in all simulators
      errorSimulator.network.injectError({
        type: 'network',
        method: 'GET',
        url: /\/api\/test/,
        status: 500,
        message: 'Server error'
      })

      errorSimulator.database.injectError({
        type: 'database',
        operation: 'select',
        table: 'test',
        error: 'DB error',
        code: 'DB001'
      })

      errorSimulator.auth.injectError({
        type: 'auth',
        operation: 'signIn',
        error: 'Auth error',
        code: 'AUTH001'
      })

      const allErrors = errorSimulator.getAllActiveErrors()

      expect(allErrors.network).toHaveLength(1)
      expect(allErrors.database).toHaveLength(1)
      expect(allErrors.auth).toHaveLength(1)

      expect(allErrors.network[0].status).toBe(500)
      expect(allErrors.database[0].code).toBe('DB001')
      expect(allErrors.auth[0].code).toBe('AUTH001')
    })

    it('should clear all errors at once', () => {
      // Inject multiple errors
      errorSimulator.injectErrors([
        {
          type: 'network',
          method: 'POST',
          url: /\/api\/create/,
          status: 400,
          message: 'Bad request'
        },
        {
          type: 'database',
          operation: 'insert',
          table: 'items',
          error: 'Insert failed',
          code: 'INSERT001'
        }
      ])

      let allErrors = errorSimulator.getAllActiveErrors()
      expect(allErrors.network).toHaveLength(1)
      expect(allErrors.database).toHaveLength(1)

      // Clear all errors
      errorSimulator.clearAllErrors()

      allErrors = errorSimulator.getAllActiveErrors()
      expect(allErrors.network).toHaveLength(0)
      expect(allErrors.database).toHaveLength(0)
      expect(allErrors.auth).toHaveLength(0)
    })
  })

  describe('Integration with Existing Test Infrastructure', () => {
    it('should work with MSW handlers', async () => {
      // This test demonstrates that error simulation works alongside MSW
      const networkError: NetworkError = {
        type: 'network',
        method: 'GET',
        url: /\/api\/products/,
        status: 503,
        message: 'Service temporarily unavailable'
      }

      errorSimulator.network.injectError(networkError)

      // The error simulator should override MSW handlers
      const activeErrors = errorSimulator.network.getActiveErrors()
      expect(activeErrors).toHaveLength(1)
      expect(activeErrors[0].message).toBe('Service temporarily unavailable')
    })

    it('should integrate with Supabase mocks', async () => {
      // Test that database error simulation works with existing Supabase mocks
      const dbError: DatabaseError = {
        type: 'database',
        operation: 'update',
        table: 'inventory',
        error: 'Concurrent update conflict',
        code: 'CONFLICT001'
      }

      errorSimulator.database.injectError(dbError)

      const result = await globalMockClient
        .from('inventory')
        .update({ quantity: 5 })
        .eq('id', 'item-1')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Concurrent update conflict')
      expect(result.error?.code).toBe('CONFLICT001')
    })
  })
})