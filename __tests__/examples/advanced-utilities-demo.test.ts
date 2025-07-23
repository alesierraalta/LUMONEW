import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  advancedFactory, 
  createRealisticInventoryItem, 
  createRealisticUser, 
  createRelatedDataSet,
  createLowStockScenario 
} from '../utils/advanced-test-factories'
import {
  TestScenarioBuilder,
  ScenarioTemplates,
  benchmark,
  measurePerformance,
  PerformanceBenchmark
} from '../utils/test-scenario-builder'
import { 
  assertDatabaseConsistency, 
  assertRelationshipIntegrity, 
  assertPerformance, 
  assertDataIntegrity,
  assertAll,
  assertWithRetry 
} from '../utils/advanced-assertions'
import { testDbManager } from '../helpers/test-cleanup'

describe('Advanced Test Utilities Demo', () => {
  beforeEach(() => {
    testDbManager.resetState()
    advancedFactory.resetSequences()
    benchmark.reset()
  })

  afterEach(() => {
    testDbManager.resetState()
  })

  describe('Advanced Data Factories', () => {
    it('should create realistic inventory items with proper constraints', () => {
      const item = createRealisticInventoryItem({
        category: 'Electronics'
        // Don't override price to let the factory calculate cost properly
      })

      expect(item).toMatchObject({
        category: 'Electronics',
        status: expect.any(String),
        sku: expect.stringMatching(/^ELE-\d{4}-[A-Z0-9]{4}$/),
        currentStock: expect.any(Number),
        minimumLevel: expect.any(Number),
        price: expect.any(Number),
        cost: expect.any(Number)
      })

      expect(item.currentStock).toBeGreaterThan(0)
      expect(item.minimumLevel).toBeGreaterThan(0)
      expect(item.minimumLevel).toBeLessThan(item.currentStock)
      expect(item.cost).toBeLessThan(item.price)
      expect(item.price).toBeGreaterThan(0)
      expect(item.cost).toBeGreaterThan(0)
    })

    it('should create realistic users with role-based permissions', () => {
      const adminUser = createRealisticUser({ role: 'admin' })
      const staffUser = createRealisticUser({ role: 'staff' })

      expect(adminUser.role).toBe('admin')
      expect(adminUser.permissions).toContain('inventory:delete')
      expect(adminUser.permissions).toContain('users:write')

      expect(staffUser.role).toBe('staff')
      expect(staffUser.permissions).toContain('inventory:read')
      expect(staffUser.permissions).not.toContain('users:write')
    })

    it('should create related datasets with proper relationships', () => {
      const dataset = createRelatedDataSet({
        userCount: 3,
        categoryCount: 5,
        locationCount: 2,
        itemCount: 20,
        transactionCount: 50
      })

      expect(dataset.users).toHaveLength(3)
      expect(dataset.categories).toHaveLength(5)
      expect(dataset.locations).toHaveLength(2)
      expect(dataset.items).toHaveLength(20)
      expect(dataset.transactions).toHaveLength(50)

      // Verify relationships
      const categoryIds = new Set(dataset.categories.map((c: any) => c.id))
      const locationIds = new Set(dataset.locations.map((l: any) => l.id))
      const itemIds = new Set(dataset.items.map((i: any) => i.id))
      const userIds = new Set(dataset.users.map((u: any) => u.id))

      dataset.items.forEach((item: any) => {
        expect(categoryIds.has(item.categoryId)).toBe(true)
        expect(locationIds.has(item.locationId)).toBe(true)
        expect(userIds.has(item.createdBy)).toBe(true)
      })

      dataset.transactions.forEach((transaction: any) => {
        expect(itemIds.has(transaction.itemId)).toBe(true)
        expect(userIds.has(transaction.userId)).toBe(true)
      })
    })

    it('should create specialized scenarios', () => {
      const lowStockItems = createLowStockScenario(5)

      expect(lowStockItems).toHaveLength(5)
      lowStockItems.forEach(item => {
        expect(item.currentStock).toBeLessThanOrEqual(item.minimumLevel)
        expect(item.status).toBe('active')
      })
    })
  })

  describe('Test Scenario Builder', () => {
    it('should execute inventory management workflow', async () => {
      const scenario = ScenarioTemplates.inventoryManagementWorkflow()
      const result = await scenario.execute()

      expect(result.success).toBe(true)
      expect(result.steps).toHaveLength(6)
      expect(result.totalDuration).toBeGreaterThan(0)

      // Verify each step completed successfully
      result.steps.forEach(step => {
        expect(step.success).toBe(true)
        expect(step.duration).toBeGreaterThan(0)
      })

      // Verify final context
      expect(result.context.get('users')).toHaveLength(3)
      expect(result.context.get('items')).toHaveLength(20)
      expect(result.context.get('transactions')).toHaveLength(15)
      expect(result.context.get('lowStockItems')).toHaveLength(5)
    })

    it('should execute authentication workflow', async () => {
      const scenario = ScenarioTemplates.authenticationWorkflow()
      const result = await scenario.execute()

      expect(result.success).toBe(true)
      expect(result.steps).toHaveLength(4)

      const users = result.context.get('users')
      const permissionTests = result.context.get('permissionTests')
      const sessions = result.context.get('sessions')

      expect(users).toHaveLength(4)
      expect(permissionTests).toHaveLength(4)
      expect(sessions).toHaveLength(4)

      // Verify role-based permissions
      const adminUser = users.find((u: any) => u.role === 'admin')
      const staffUser = users.find((u: any) => u.role === 'staff')
      
      expect(adminUser.permissions).toContain('users:write')
      expect(staffUser.permissions).not.toContain('users:write')
    })

    it('should handle custom scenarios', async () => {
      const customScenario = new TestScenarioBuilder()
        .withContext('testName', 'Custom Test')
        .step('Create Test Data', async (context) => {
          const items = Array.from({ length: 5 }, () => createRealisticInventoryItem())
          testDbManager.setTableData('inventory', items)
          return { items, count: items.length }
        })
        .step('Validate Data', async (context) => {
          const items = testDbManager.getTableData('inventory')
          expect(items).toHaveLength(5)
          return { validated: true }
        })

      const result = await customScenario.execute()

      expect(result.success).toBe(true)
      expect(result.steps).toHaveLength(2)
      expect(result.context.get('testName')).toBe('Custom Test')
    })
  })

  describe('Performance Benchmarking', () => {
    let localBenchmark: PerformanceBenchmark

    beforeEach(() => {
      // Create a new benchmark instance for each test to ensure complete isolation
      localBenchmark = new PerformanceBenchmark()
    })

    it('should measure operation performance', async () => {
      const result = await localBenchmark.measure('data-generation', () => {
        return createRelatedDataSet({
          userCount: 10,
          itemCount: 100,
          transactionCount: 200
        })
      })

      expect(result.users).toHaveLength(10)
      expect(result.items).toHaveLength(100)
      expect(result.transactions).toHaveLength(200)

      const stats = localBenchmark.getStats('data-generation')
      expect(stats).toBeDefined()
      expect(stats!.count).toBe(1)
      expect(stats!.mean).toBeGreaterThan(0)
    })

    it('should track multiple performance measurements', async () => {
      // Create a fresh benchmark instance to ensure isolation
      const freshBenchmark = new PerformanceBenchmark()
      
      // Run multiple measurements with simpler operation
      const results = []
      for (let i = 0; i < 5; i++) {
        const result = await freshBenchmark.measure('simple-operation', () => {
          // Use a simple operation that won't fail
          return { id: `test-${i}`, value: Math.random() * 100 }
        })
        results.push(result)
        
        // Check measurements after each iteration
        const currentStats = freshBenchmark.getStats('simple-operation')
        console.log(`After measurement ${i + 1}: count = ${currentStats?.count || 0}`)
      }

      const stats = freshBenchmark.getStats('simple-operation')
      console.log('Final stats:', stats)
      console.log('Results array length:', results.length)
      
      expect(stats).toBeDefined()
      expect(stats!.count).toBe(5)
      expect(stats!.mean).toBeGreaterThan(0)
      expect(stats!.min).toBeGreaterThan(0)
      expect(stats!.max).toBeGreaterThanOrEqual(stats!.min)
    })

    it('should run performance test scenario', async () => {
      const scenario = ScenarioTemplates.performanceTestScenario({
        userCount: 20,
        itemCount: 100,
        transactionCount: 500
      })

      const result = await scenario.execute()

      expect(result.success).toBe(true)
      
      // Verify performance metrics were collected
      const memoryStep = result.steps.find(s => s.name === 'Memory Usage Analysis')
      expect(memoryStep).toBeDefined()
      expect(memoryStep!.result.memoryUsage).toBeDefined()
      expect(memoryStep!.result.memoryUsage.heapUsed).toBeGreaterThan(0)
    })
  })

  describe('Advanced Assertions', () => {
    it('should validate database consistency', async () => {
      const dataset = createRelatedDataSet({
        userCount: 5,
        itemCount: 20,
        transactionCount: 30
      })

      testDbManager.setTableData('users', dataset.users)
      testDbManager.setTableData('inventory', dataset.items)
      testDbManager.setTableData('transactions', dataset.transactions)

      await assertDatabaseConsistency({
        users: dataset.users,
        inventory: dataset.items,
        transactions: dataset.transactions
      })
    })

    it('should validate relationship integrity', () => {
      const users = Array.from({ length: 3 }, () => createRealisticUser())
      const items = Array.from({ length: 10 }, () => {
        const item = createRealisticInventoryItem()
        item.createdBy = users[Math.floor(Math.random() * users.length)].id
        return item
      })

      assertRelationshipIntegrity(users, items, 'id', 'createdBy')
    })

    it('should validate data integrity with schema', () => {
      const items = Array.from({ length: 5 }, () => createRealisticInventoryItem())

      const schema = {
        id: { required: true, type: 'string' as const },
        name: { required: true, type: 'string' as const, minLength: 1 },
        price: { required: true, type: 'number' as const, min: 0 },
        currentStock: { required: true, type: 'number' as const, min: 0 },
        status: { required: true, enum: ['active', 'inactive', 'discontinued'] }
      }

      assertDataIntegrity(items, schema)
    })

    it('should validate performance requirements', async () => {
      const startTime = performance.now()
      
      // Simulate some operation
      createRelatedDataSet({ itemCount: 50 })
      
      const duration = performance.now() - startTime
      
      assertPerformance(duration, 1000, 'Data generation')
    })

    it('should handle multiple assertions', () => {
      const item = createRealisticInventoryItem()

      assertAll([
        () => expect(item.id).toBeDefined(),
        () => expect(item.name).toBeTruthy(),
        () => expect(item.price).toBeGreaterThan(0),
        () => expect(item.currentStock).toBeGreaterThanOrEqual(0),
        () => expect(['active', 'inactive', 'discontinued']).toContain(item.status)
      ])
    })

    it('should retry flaky assertions', async () => {
      let attempts = 0
      
      await assertWithRetry(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Simulated flaky test failure')
        }
        expect(attempts).toBe(3)
      }, 5, 10)

      expect(attempts).toBe(3)
    })
  })

  describe('Integration Example', () => {
    it('should demonstrate complete workflow with all utilities', async () => {
      // Step 1: Create realistic test data
      const dataset = await measurePerformance('dataset-creation', () => {
        return createRelatedDataSet({
          userCount: 5,
          categoryCount: 3,
          locationCount: 2,
          itemCount: 25,
          transactionCount: 50
        })
      })

      // Step 2: Load data into test database
      testDbManager.setTableData('users', dataset.users)
      testDbManager.setTableData('categories', dataset.categories)
      testDbManager.setTableData('locations', dataset.locations)
      testDbManager.setTableData('inventory', dataset.items)
      testDbManager.setTableData('transactions', dataset.transactions)

      // Step 3: Validate data consistency and relationships
      await assertDatabaseConsistency({
        users: dataset.users,
        categories: dataset.categories,
        locations: dataset.locations,
        inventory: dataset.items,
        transactions: dataset.transactions
      })

      assertRelationshipIntegrity(dataset.categories, dataset.items, 'id', 'categoryId')
      assertRelationshipIntegrity(dataset.locations, dataset.items, 'id', 'locationId')
      assertRelationshipIntegrity(dataset.users, dataset.items, 'id', 'createdBy')

      // Step 4: Run complex scenario
      const scenario = new TestScenarioBuilder()
        .withContext('dataset', dataset)
        .step('Simulate Low Stock Alert', async (context) => {
          const items = context.get('dataset').items
          const lowStockItems = items.filter((item: any) => 
            item.currentStock <= item.minimumLevel
          )
          return { lowStockCount: lowStockItems.length }
        })
        .step('Simulate Bulk Operations', async (context) => {
          const items = context.get('dataset').items
          const bulkUpdateCount = Math.min(10, items.length)
          
          // Simulate bulk price update
          const updatedItems = items.slice(0, bulkUpdateCount).map((item: any) => ({
            ...item,
            price: item.price * 1.1 // 10% price increase
          }))
          
          return { bulkUpdateCount, updatedItems }
        })

      const result = await scenario.execute()

      // Step 5: Validate scenario results
      expect(result.success).toBe(true)
      expect(result.steps).toHaveLength(2)

      // Step 6: Check performance metrics
      const creationStats = benchmark.getStats('dataset-creation')
      expect(creationStats).toBeDefined()
      assertPerformance(creationStats!.mean, 2000, 'Dataset creation')

      // Step 7: Verify memory usage
      const memoryUsage = process.memoryUsage()
      expect(memoryUsage.heapUsed).toBeGreaterThan(0)

      console.log('🎉 Complete workflow test passed!')
      console.log(`📊 Dataset: ${dataset.summary.totalItems} items, ${dataset.summary.totalTransactions} transactions`)
      console.log(`⚡ Performance: ${creationStats!.mean.toFixed(2)}ms average`)
      console.log(`💾 Memory: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    })
  })
})