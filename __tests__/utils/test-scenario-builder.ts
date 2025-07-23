import { vi } from 'vitest'
import { advancedFactory } from './advanced-test-factories'
import { testDbManager } from '../helpers/test-cleanup'
import { dbSeeder } from '../helpers/database-seeder'

// Advanced test scenario builder for complex multi-step testing
export class TestScenarioBuilder {
  private steps: TestStep[] = []
  private context: Map<string, any> = new Map()
  private cleanup: (() => void)[] = []

  // Add a step to the scenario
  step(name: string, action: TestStepAction): TestScenarioBuilder {
    this.steps.push({ name, action, context: new Map(this.context) })
    return this
  }

  // Set context data that persists across steps
  withContext(key: string, value: any): TestScenarioBuilder {
    this.context.set(key, value)
    return this
  }

  // Add cleanup function
  onCleanup(cleanupFn: () => void): TestScenarioBuilder {
    this.cleanup.push(cleanupFn)
    return this
  }

  // Execute all steps in sequence
  async execute(): Promise<TestScenarioResult> {
    const results: StepResult[] = []
    let currentContext = new Map(this.context)

    try {
      for (const step of this.steps) {
        const startTime = performance.now()
        
        try {
          console.log(`🎬 Executing step: ${step.name}`)
          const result = await step.action(currentContext)
          const endTime = performance.now()
          
          // Update context with step results
          if (result && typeof result === 'object') {
            Object.entries(result).forEach(([key, value]) => {
              currentContext.set(key, value)
            })
          }

          results.push({
            name: step.name,
            success: true,
            duration: endTime - startTime,
            result,
            error: null
          })

          console.log(`✅ Step completed: ${step.name} (${(endTime - startTime).toFixed(2)}ms)`)
        } catch (error) {
          const endTime = performance.now()
          
          results.push({
            name: step.name,
            success: false,
            duration: endTime - startTime,
            result: null,
            error: error as Error
          })

          console.error(`❌ Step failed: ${step.name}`, error)
          throw error
        }
      }

      return {
        success: true,
        steps: results,
        totalDuration: results.reduce((sum, step) => sum + step.duration, 0),
        context: currentContext
      }
    } finally {
      // Execute cleanup functions
      for (const cleanupFn of this.cleanup) {
        try {
          cleanupFn()
        } catch (error) {
          console.error('Cleanup error:', error)
        }
      }
    }
  }
}

interface TestStep {
  name: string
  action: TestStepAction
  context: Map<string, any>
}

type TestStepAction = (context: Map<string, any>) => Promise<any> | any

interface StepResult {
  name: string
  success: boolean
  duration: number
  result: any
  error: Error | null
}

interface TestScenarioResult {
  success: boolean
  steps: StepResult[]
  totalDuration: number
  context: Map<string, any>
}

// Pre-built scenario templates
export class ScenarioTemplates {
  // E-commerce inventory management scenario
  static inventoryManagementWorkflow(): TestScenarioBuilder {
    return new TestScenarioBuilder()
      .step('Setup Users', async (context) => {
        const users = [
          advancedFactory.createRealisticUser({ role: 'admin', name: 'Admin User' }),
          advancedFactory.createRealisticUser({ role: 'manager', name: 'Manager User' }),
          advancedFactory.createRealisticUser({ role: 'staff', name: 'Staff User' })
        ]
        
        testDbManager.setTableData('users', users)
        context.set('users', users)
        return { users }
      })
      .step('Setup Categories and Locations', async (context) => {
        const categories = [
          { id: 'cat-1', name: 'Electronics', status: 'active' },
          { id: 'cat-2', name: 'Clothing', status: 'active' },
          { id: 'cat-3', name: 'Books', status: 'active' }
        ]
        
        const locations = [
          { id: 'loc-1', name: 'Main Warehouse', status: 'active' },
          { id: 'loc-2', name: 'Store Front', status: 'active' }
        ]
        
        testDbManager.setTableData('categories', categories)
        testDbManager.setTableData('locations', locations)
        context.set('categories', categories)
        context.set('locations', locations)
        return { categories, locations }
      })
      .step('Create Initial Inventory', async (context) => {
        const categories = context.get('categories')
        const locations = context.get('locations')
        
        const items = Array.from({ length: 20 }, () => {
          const item = advancedFactory.createRealisticInventoryItem()
          item.categoryId = categories[Math.floor(Math.random() * categories.length)].id
          item.locationId = locations[Math.floor(Math.random() * locations.length)].id
          return item
        })
        
        testDbManager.setTableData('inventory', items)
        context.set('items', items)
        return { items, totalItems: items.length }
      })
      .step('Simulate Sales Transactions', async (context) => {
        const items = context.get('items')
        const users = context.get('users')
        
        const transactions = Array.from({ length: 15 }, () => {
          const transaction = advancedFactory.createRealisticTransaction({ type: 'sale' })
          transaction.itemId = items[Math.floor(Math.random() * items.length)].id
          transaction.userId = users[Math.floor(Math.random() * users.length)].id
          return transaction
        })
        
        testDbManager.setTableData('transactions', transactions)
        context.set('transactions', transactions)
        return { transactions, salesCount: transactions.length }
      })
      .step('Generate Low Stock Alerts', async (context) => {
        const items = context.get('items')
        
        // Simulate some items going low on stock
        const lowStockItems = items.slice(0, 5).map((item: any) => ({
          ...item,
          currentStock: Math.floor(item.minimumLevel * 0.5)
        }))
        
        context.set('lowStockItems', lowStockItems)
        return { lowStockItems, alertCount: lowStockItems.length }
      })
      .step('Verify Data Integrity', async (context) => {
        const items = context.get('items')
        const transactions = context.get('transactions')
        const lowStockItems = context.get('lowStockItems')
        
        // Verify all data is properly linked
        const itemIds = new Set(items.map((item: any) => item.id))
        const transactionItemIds = transactions.map((t: any) => t.itemId)
        const validTransactions = transactionItemIds.every((id: string) => itemIds.has(id))
        
        return {
          dataIntegrityCheck: validTransactions,
          totalItems: items.length,
          totalTransactions: transactions.length,
          lowStockAlerts: lowStockItems.length
        }
      })
  }

  // User authentication and authorization workflow
  static authenticationWorkflow(): TestScenarioBuilder {
    return new TestScenarioBuilder()
      .step('Create Test Users with Different Roles', async (context) => {
        const users = [
          advancedFactory.createRealisticUser({ role: 'admin', email: 'admin@test.com' }),
          advancedFactory.createRealisticUser({ role: 'manager', email: 'manager@test.com' }),
          advancedFactory.createRealisticUser({ role: 'staff', email: 'staff@test.com' }),
          advancedFactory.createRealisticUser({ role: 'viewer', email: 'viewer@test.com' })
        ]
        
        testDbManager.setTableData('users', users)
        context.set('users', users)
        return { users }
      })
      .step('Test Permission Matrix', async (context) => {
        const users = context.get('users')
        const permissionTests: any[] = []
        
        users.forEach((user: any) => {
          const permissions = user.permissions || []
          permissionTests.push({
            userId: user.id,
            role: user.role,
            canRead: permissions.includes('inventory:read'),
            canWrite: permissions.includes('inventory:write'),
            canDelete: permissions.includes('inventory:delete'),
            canManageUsers: permissions.includes('users:write')
          })
        })
        
        context.set('permissionTests', permissionTests)
        return { permissionTests }
      })
      .step('Simulate Login Sessions', async (context) => {
        const users = context.get('users')
        const sessions = users.map((user: any) => ({
          userId: user.id,
          sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          loginTime: new Date(),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Test User Agent'
        }))
        
        context.set('sessions', sessions)
        return { sessions, activeSessionCount: sessions.length }
      })
      .step('Test Role-Based Access Control', async (context) => {
        const users = context.get('users')
        const accessTests = []
        
        for (const user of users) {
          const canAccessAdmin = user.role === 'admin'
          const canAccessReports = ['admin', 'manager'].includes(user.role)
          const canModifyInventory = ['admin', 'manager', 'staff'].includes(user.role)
          
          accessTests.push({
            userId: user.id,
            role: user.role,
            adminAccess: canAccessAdmin,
            reportsAccess: canAccessReports,
            inventoryModify: canModifyInventory
          })
        }
        
        return { accessTests, totalTests: accessTests.length }
      })
  }

  // Performance and load testing scenario
  static performanceTestScenario(options: { userCount?: number, itemCount?: number, transactionCount?: number } = {}): TestScenarioBuilder {
    const { userCount = 100, itemCount = 1000, transactionCount = 5000 } = options
    
    return new TestScenarioBuilder()
      .step('Generate Large Dataset', async (context) => {
        const startTime = performance.now()
        
        const dataset = advancedFactory.createRelatedDataSet({
          userCount,
          categoryCount: 20,
          locationCount: 10,
          itemCount,
          transactionCount,
          auditCount: transactionCount * 2
        })
        
        const endTime = performance.now()
        const generationTime = endTime - startTime
        
        context.set('dataset', dataset)
        return {
          dataset,
          generationTime,
          dataSize: {
            users: dataset.users.length,
            items: dataset.items.length,
            transactions: dataset.transactions.length,
            auditEntries: dataset.auditEntries.length
          }
        }
      })
      .step('Load Data into Test Database', async (context) => {
        const dataset = context.get('dataset')
        const startTime = performance.now()
        
        testDbManager.setTableData('users', dataset.users)
        testDbManager.setTableData('categories', dataset.categories)
        testDbManager.setTableData('locations', dataset.locations)
        testDbManager.setTableData('inventory', dataset.items)
        testDbManager.setTableData('transactions', dataset.transactions)
        testDbManager.setTableData('audit_logs', dataset.auditEntries)
        
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        return { loadTime, recordsLoaded: Object.values(dataset).flat().length }
      })
      .step('Simulate Concurrent Operations', async (context) => {
        const dataset = context.get('dataset')
        const startTime = performance.now()
        
        // Simulate concurrent read operations
        const readPromises = Array.from({ length: 50 }, async () => {
          const randomItem = dataset.items[Math.floor(Math.random() * dataset.items.length)]
          return testDbManager.mockSelect('inventory', { id: randomItem.id })
        })
        
        // Simulate concurrent write operations
        const writePromises = Array.from({ length: 20 }, async () => {
          const newTransaction = advancedFactory.createRealisticTransaction()
          return testDbManager.mockInsert('transactions', newTransaction)
        })
        
        await Promise.all([...readPromises, ...writePromises])
        
        const endTime = performance.now()
        const concurrentOperationTime = endTime - startTime
        
        return {
          concurrentOperationTime,
          readOperations: readPromises.length,
          writeOperations: writePromises.length
        }
      })
      .step('Memory Usage Analysis', async (context) => {
        const memoryUsage = process.memoryUsage()
        
        return {
          memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024) // MB
          }
        }
      })
  }

  // Data migration and synchronization scenario
  static dataMigrationScenario(): TestScenarioBuilder {
    return new TestScenarioBuilder()
      .step('Create Legacy Data Format', async (context) => {
        const legacyItems = Array.from({ length: 50 }, (_, i) => ({
          item_id: i + 1,
          item_name: `Legacy Item ${i + 1}`,
          item_sku: `LEG${(i + 1).toString().padStart(4, '0')}`,
          item_price: Math.random() * 100,
          item_stock: Math.floor(Math.random() * 200),
          category_name: ['Electronics', 'Clothing', 'Books'][Math.floor(Math.random() * 3)],
          location_name: ['Warehouse A', 'Warehouse B'][Math.floor(Math.random() * 2)]
        }))
        
        context.set('legacyItems', legacyItems)
        return { legacyItems, count: legacyItems.length }
      })
      .step('Transform to New Format', async (context) => {
        const legacyItems = context.get('legacyItems')
        
        const transformedItems = legacyItems.map((legacy: any) => ({
          id: `item-${legacy.item_id}`,
          name: legacy.item_name,
          sku: legacy.item_sku,
          price: legacy.item_price,
          currentStock: legacy.item_stock,
          category: legacy.category_name,
          location: legacy.location_name,
          status: 'active',
          migrated: true,
          migrationDate: new Date().toISOString()
        }))
        
        context.set('transformedItems', transformedItems)
        return { transformedItems, transformedCount: transformedItems.length }
      })
      .step('Validate Migration', async (context) => {
        const legacyItems = context.get('legacyItems')
        const transformedItems = context.get('transformedItems')
        
        const validationResults = {
          countMatch: legacyItems.length === transformedItems.length,
          dataIntegrity: transformedItems.every((item: any) => 
            item.name && item.sku && item.price >= 0 && item.currentStock >= 0
          ),
          allMigrated: transformedItems.every((item: any) => item.migrated === true)
        }
        
        return { validationResults, isValid: Object.values(validationResults).every(Boolean) }
      })
      .step('Sync with External System', async (context) => {
        const transformedItems = context.get('transformedItems')
        
        // Simulate external API sync
        const syncResults = await Promise.all(
          transformedItems.slice(0, 10).map(async (item: any) => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
            
            return {
              itemId: item.id,
              syncStatus: Math.random() > 0.1 ? 'success' : 'failed',
              syncTime: new Date().toISOString()
            }
          })
        )
        
        const successCount = syncResults.filter(r => r.syncStatus === 'success').length
        const failureCount = syncResults.filter(r => r.syncStatus === 'failed').length
        
        return {
          syncResults,
          successCount,
          failureCount,
          successRate: (successCount / syncResults.length) * 100
        }
      })
  }
}

// Utility functions for scenario execution
export const runScenario = async (scenario: TestScenarioBuilder): Promise<TestScenarioResult> => {
  return await scenario.execute()
}

export const createCustomScenario = (): TestScenarioBuilder => {
  return new TestScenarioBuilder()
}

// Performance benchmarking utilities
export class PerformanceBenchmark {
  private benchmarks: Map<string, number[]> = new Map()

  async measure<T>(name: string, operation: () => Promise<T> | T): Promise<T> {
    const startTime = performance.now()
    const result = await operation()
    const endTime = performance.now()
    const duration = endTime - startTime

    if (!this.benchmarks.has(name)) {
      this.benchmarks.set(name, [])
    }
    this.benchmarks.get(name)!.push(duration)

    return result
  }

  getStats(name: string): BenchmarkStats | null {
    const measurements = this.benchmarks.get(name)
    if (!measurements || measurements.length === 0) {
      return null
    }

    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = measurements.reduce((a, b) => a + b, 0)
    const mean = sum / measurements.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return {
      name,
      count: measurements.length,
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2))
    }
  }

  getAllStats(): BenchmarkStats[] {
    return Array.from(this.benchmarks.keys())
      .map(name => this.getStats(name))
      .filter((stats): stats is BenchmarkStats => stats !== null)
  }

  reset(name?: string): void {
    if (name) {
      this.benchmarks.delete(name)
    } else {
      this.benchmarks.clear()
    }
  }
}

interface BenchmarkStats {
  name: string
  count: number
  mean: number
  median: number
  min: number
  max: number
  p95: number
  p99: number
}

// Global benchmark instance
export const benchmark = new PerformanceBenchmark()

// Convenience functions
export const measurePerformance = async <T>(name: string, operation: () => Promise<T> | T): Promise<T> => {
  return await benchmark.measure(name, operation)
}

export const getBenchmarkStats = (name: string): BenchmarkStats | null => {
  return benchmark.getStats(name)
}

export const getAllBenchmarkStats = (): BenchmarkStats[] => {
  return benchmark.getAllStats()
}