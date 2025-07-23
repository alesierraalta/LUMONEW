import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  TestIsolationManager,
  TestTransaction,
  ConcurrentTestManager,
  testIsolation,
  concurrentTests,
  withTestTransaction,
  withTestIsolation,
  detectMemoryLeaks,
  MemoryLeakDetector,
  resetTestState,
  registerCleanup,
  validateTestEnvironment
} from '../utils/test-isolation'
import { testDbManager } from '../helpers/test-cleanup'
import { advancedFactory } from '../utils/advanced-test-factories'

describe('Test Isolation and Cleanup Utilities Demo', () => {
  beforeEach(async () => {
    await resetTestState()
  })

  afterEach(async () => {
    await resetTestState()
  })

  describe('Test Isolation Manager', () => {
    it('should create and manage test transactions', async () => {
      const testId = 'test-transaction-demo'
      
      // Start a transaction
      const transaction = await testIsolation.startTransaction(testId)
      
      expect(transaction).toBeInstanceOf(TestTransaction)
      expect(transaction.testId).toBe(testId)
      expect(testIsolation.hasActiveTransaction(testId)).toBe(true)
      
      // Add some test data
      const testUser = advancedFactory.createRealisticUser({ role: 'admin' })
      testDbManager.mockInsert('users', testUser)
      
      // Verify data exists
      const users = testDbManager.getTableData('users')
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(testUser.id)
      
      // End transaction with rollback
      await testIsolation.endTransaction(testId, true)
      
      expect(testIsolation.hasActiveTransaction(testId)).toBe(false)
    })

    it('should handle multiple concurrent transactions', async () => {
      const testId1 = 'concurrent-test-1'
      const testId2 = 'concurrent-test-2'
      
      // Start multiple transactions
      const transaction1 = await testIsolation.startTransaction(testId1)
      const transaction2 = await testIsolation.startTransaction(testId2)
      
      expect(testIsolation.hasActiveTransaction(testId1)).toBe(true)
      expect(testIsolation.hasActiveTransaction(testId2)).toBe(true)
      
      // Add different data in each transaction context
      testDbManager.mockInsert('users', advancedFactory.createRealisticUser({ name: 'User 1' }))
      testDbManager.mockInsert('users', advancedFactory.createRealisticUser({ name: 'User 2' }))
      
      // End both transactions
      await testIsolation.endTransaction(testId1, true)
      await testIsolation.endTransaction(testId2, true)
      
      expect(testIsolation.hasActiveTransaction(testId1)).toBe(false)
      expect(testIsolation.hasActiveTransaction(testId2)).toBe(false)
    })

    it('should register and execute cleanup callbacks', async () => {
      const testId = 'cleanup-demo'
      let cleanupExecuted = false
      
      await testIsolation.startTransaction(testId)
      
      // Register cleanup callback
      testIsolation.addCleanup(testId, () => {
        cleanupExecuted = true
      })
      
      // End transaction
      await testIsolation.endTransaction(testId, true)
      
      expect(cleanupExecuted).toBe(true)
    })

    it('should reset all state properly', async () => {
      // Create multiple transactions
      await testIsolation.startTransaction('test-1')
      await testIsolation.startTransaction('test-2')
      
      // Add some data
      testDbManager.mockInsert('users', advancedFactory.createRealisticUser())
      testDbManager.mockInsert('inventory', advancedFactory.createRealisticInventoryItem())
      
      // Reset all state
      await testIsolation.resetAllState()
      
      // Verify everything is clean
      expect(testIsolation.hasActiveTransaction('test-1')).toBe(false)
      expect(testIsolation.hasActiveTransaction('test-2')).toBe(false)
    })
  })

  describe('Test Transaction', () => {
    it('should track and rollback database operations', async () => {
      const testId = 'transaction-rollback-demo'
      const transaction = await testIsolation.startTransaction(testId)
      
      // Record some operations
      const testUser = advancedFactory.createRealisticUser()
      const testItem = advancedFactory.createRealisticInventoryItem()
      
      transaction.recordOperation({
        type: 'insert',
        table: 'users',
        data: testUser,
        timestamp: Date.now()
      })
      
      transaction.recordOperation({
        type: 'insert',
        table: 'inventory',
        data: testItem,
        timestamp: Date.now()
      })
      
      // Rollback transaction
      await transaction.rollback()
      
      expect(transaction.isCompleted).toBe(true)
    })

    it('should commit operations successfully', async () => {
      const testId = 'transaction-commit-demo'
      const transaction = await testIsolation.startTransaction(testId)
      
      // Record operation
      const testUser = advancedFactory.createRealisticUser()
      transaction.recordOperation({
        type: 'insert',
        table: 'users',
        data: testUser,
        timestamp: Date.now()
      })
      
      // Commit transaction
      await transaction.commit()
      
      expect(transaction.isCompleted).toBe(true)
    })
  })

  describe('Concurrent Test Manager', () => {
    it('should manage concurrent test execution', async () => {
      const results: string[] = []
      
      // Execute multiple tests concurrently
      const promises = [
        concurrentTests.executeTest('test-1', async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
          results.push('test-1')
          return 'result-1'
        }),
        concurrentTests.executeTest('test-2', async () => {
          await new Promise(resolve => setTimeout(resolve, 30))
          results.push('test-2')
          return 'result-2'
        }),
        concurrentTests.executeTest('test-3', async () => {
          await new Promise(resolve => setTimeout(resolve, 20))
          results.push('test-3')
          return 'result-3'
        })
      ]
      
      const testResults = await Promise.all(promises)
      
      expect(testResults).toEqual(['result-1', 'result-2', 'result-3'])
      expect(results).toHaveLength(3)
      expect(results).toContain('test-1')
      expect(results).toContain('test-2')
      expect(results).toContain('test-3')
    })

    it('should respect concurrency limits', async () => {
      // Set low concurrency limit
      concurrentTests.setMaxConcurrency(2)
      
      const startTimes: number[] = []
      const endTimes: number[] = []
      
      const promises = Array.from({ length: 4 }, (_, i) =>
        concurrentTests.executeTest(`test-${i}`, async () => {
          startTimes.push(Date.now())
          await new Promise(resolve => setTimeout(resolve, 100))
          endTimes.push(Date.now())
          return `result-${i}`
        })
      )
      
      await Promise.all(promises)
      
      // Verify that not all tests started at the same time
      const stats = concurrentTests.getStats()
      expect(stats.maxConcurrency).toBe(2)
    })

    it('should provide execution statistics', () => {
      const stats = concurrentTests.getStats()
      
      expect(stats).toHaveProperty('running')
      expect(stats).toHaveProperty('queued')
      expect(stats).toHaveProperty('maxConcurrency')
      expect(typeof stats.running).toBe('number')
      expect(typeof stats.queued).toBe('number')
      expect(typeof stats.maxConcurrency).toBe('number')
      expect(stats.running).toBeGreaterThanOrEqual(0)
      expect(stats.queued).toBeGreaterThanOrEqual(0)
      expect(stats.maxConcurrency).toBeGreaterThan(0)
    })
  })

  describe('Utility Functions', () => {
    it('should work with withTestTransaction', async () => {
      const testId = 'with-transaction-demo'
      let transactionReceived: TestTransaction | null = null
      
      const result = await withTestTransaction(testId, async (transaction) => {
        transactionReceived = transaction
        
        // Add some test data
        testDbManager.mockInsert('users', advancedFactory.createRealisticUser())
        
        return 'success'
      })
      
      expect(result).toBe('success')
      expect(transactionReceived).toBeInstanceOf(TestTransaction)
      expect(transactionReceived!.testId).toBe(testId)
    })

    it('should work with withTestIsolation', async () => {
      const testId = 'with-isolation-demo'
      
      const result = await withTestIsolation(testId, async () => {
        // Add some test data
        const user = advancedFactory.createRealisticUser()
        testDbManager.mockInsert('users', user)
        
        // Verify data exists during test
        const users = testDbManager.getTableData('users')
        expect(users).toHaveLength(1)
        
        return 'isolated-success'
      })
      
      expect(result).toBe('isolated-success')
    })

    it('should handle errors in withTestTransaction', async () => {
      const testId = 'error-handling-demo'
      
      await expect(
        withTestTransaction(testId, async () => {
          testDbManager.mockInsert('users', advancedFactory.createRealisticUser())
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')
      
      // Transaction should be rolled back
      expect(testIsolation.hasActiveTransaction(testId)).toBe(false)
    })
  })

  describe('Memory Leak Detection', () => {
    it('should detect memory usage patterns', () => {
      const detector = detectMemoryLeaks('memory-test')
      
      // Take initial snapshot
      detector.takeSnapshot('start')
      
      // Simulate memory usage
      const largeArray = new Array(1000).fill('test-data')
      
      // Take another snapshot
      detector.takeSnapshot('after-allocation')
      
      // Check for leaks
      const report = detector.checkForLeaks(1024) // 1KB threshold
      
      expect(report.testName).toBe('memory-test')
      expect(report.snapshots).toHaveLength(2)
      expect(report.snapshots[0].label).toBe('start')
      expect(report.snapshots[1].label).toBe('after-allocation')
      
      // Clean up
      largeArray.length = 0
    })

    it('should reset memory detector state', () => {
      const detector = new MemoryLeakDetector('reset-test')
      
      detector.takeSnapshot('before-reset')
      detector.reset()
      
      const report = detector.checkForLeaks()
      expect(report.snapshots).toHaveLength(0)
    })
  })

  describe('Global Utilities', () => {
    it('should register and execute global cleanup', async () => {
      let globalCleanupExecuted = false
      
      registerCleanup(() => {
        globalCleanupExecuted = true
      })
      
      await resetTestState()
      
      expect(globalCleanupExecuted).toBe(true)
    })

    it('should validate test environment', () => {
      const report = validateTestEnvironment()
      
      expect(report).toHaveProperty('memory')
      expect(report).toHaveProperty('activeTransactions')
      expect(report).toHaveProperty('concurrentTests')
      expect(report).toHaveProperty('timestamp')
      
      expect(typeof report.memory.heapUsed).toBe('number')
      expect(typeof report.memory.heapTotal).toBe('number')
      expect(typeof report.memory.rss).toBe('number')
      expect(typeof report.activeTransactions).toBe('number')
      expect(typeof report.timestamp).toBe('string')
    })

    it('should reset test state completely', async () => {
      // Create some state
      const transaction = await testIsolation.startTransaction('test-state')
      testDbManager.mockInsert('users', advancedFactory.createRealisticUser())
      
      // Verify transaction exists
      expect(testIsolation.hasActiveTransaction('test-state')).toBe(true)
      
      // Reset everything
      await resetTestState()
      
      // Small delay to ensure async cleanup completes
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Verify clean state
      expect(testIsolation.hasActiveTransaction('test-state')).toBe(false)
      
      const report = validateTestEnvironment()
      expect(report.activeTransactions).toBe(0)
    })
  })

  describe('Integration Example', () => {
    it('should demonstrate complete isolation workflow', async () => {
      const testId = 'integration-demo'
      const memoryDetector = detectMemoryLeaks(testId)
      
      // Start memory monitoring
      memoryDetector.takeSnapshot('start')
      
      // Execute test with full isolation
      const result = await withTestIsolation(testId, async () => {
        // Create test data
        const users = Array.from({ length: 5 }, () => 
          advancedFactory.createRealisticUser()
        )
        const items = Array.from({ length: 10 }, () => 
          advancedFactory.createRealisticInventoryItem()
        )
        
        // Insert data
        testDbManager.mockInsert('users', users)
        testDbManager.mockInsert('inventory', items)
        
        // Take memory snapshot
        memoryDetector.takeSnapshot('after-data-creation')
        
        // Verify data
        expect(testDbManager.getTableData('users')).toHaveLength(5)
        expect(testDbManager.getTableData('inventory')).toHaveLength(10)
        
        // Register cleanup
        testIsolation.addCleanup(testId, () => {
          console.log('🧹 Custom cleanup executed')
        })
        
        return {
          usersCreated: users.length,
          itemsCreated: items.length,
          testCompleted: true
        }
      })
      
      // Check memory usage
      const memoryReport = memoryDetector.checkForLeaks()
      
      // Validate results
      expect(result.usersCreated).toBe(5)
      expect(result.itemsCreated).toBe(10)
      expect(result.testCompleted).toBe(true)
      
      // Verify isolation worked
      expect(testIsolation.hasActiveTransaction(testId)).toBe(false)
      
      // Validate environment
      const envReport = validateTestEnvironment()
      expect(envReport.activeTransactions).toBe(0)
      
      console.log('🎉 Integration test completed successfully!')
      console.log(`📊 Memory report: ${memoryReport.hasLeak ? 'Leak detected' : 'No leaks'}`)
      console.log(`💾 Memory usage: ${envReport.memory.heapUsed}MB heap, ${envReport.memory.rss}MB RSS`)
    })
  })
})