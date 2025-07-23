import { vi } from 'vitest'
import { testDbManager } from '../helpers/test-cleanup'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/msw-handlers'

// Create MSW server instance for test isolation
const server = setupServer(...handlers)

// Test isolation and cleanup utilities for ensuring clean test state
export class TestIsolationManager {
  private static instance: TestIsolationManager
  private activeTransactions: Map<string, TestTransaction> = new Map()
  private cleanupCallbacks: (() => void | Promise<void>)[] = []
  private memorySnapshots: Map<string, NodeJS.MemoryUsage> = new Map()
  private testStates: Map<string, TestState> = new Map()

  static getInstance(): TestIsolationManager {
    if (!TestIsolationManager.instance) {
      TestIsolationManager.instance = new TestIsolationManager()
    }
    return TestIsolationManager.instance
  }

  // Start a new test transaction for database isolation
  async startTransaction(testId: string): Promise<TestTransaction> {
    const transaction = new TestTransaction(testId)
    this.activeTransactions.set(testId, transaction)
    
    // Take memory snapshot
    this.memorySnapshots.set(`${testId}_start`, process.memoryUsage())
    
    // Initialize test state
    this.testStates.set(testId, {
      id: testId,
      startTime: Date.now(),
      dbSnapshot: testDbManager.captureState(),
      mswHandlers: handlers,
      cleanupFunctions: []
    })

    return transaction
  }

  // Commit or rollback transaction
  async endTransaction(testId: string, rollback: boolean = true): Promise<void> {
    const transaction = this.activeTransactions.get(testId)
    const testState = this.testStates.get(testId)
    
    if (!transaction || !testState) {
      console.warn(`No active transaction found for test: ${testId}`)
      return
    }

    try {
      if (rollback) {
        await transaction.rollback()
        // Restore database state
        testDbManager.restoreState(testState.dbSnapshot)
        // Reset MSW handlers
        server.resetHandlers(...testState.mswHandlers)
      } else {
        await transaction.commit()
      }

      // Execute cleanup functions
      for (const cleanup of testState.cleanupFunctions) {
        try {
          await cleanup()
        } catch (error) {
          console.error(`Cleanup error for test ${testId}:`, error)
        }
      }

      // Check for memory leaks
      const endMemory = process.memoryUsage()
      const startMemory = this.memorySnapshots.get(`${testId}_start`)
      if (startMemory) {
        this.detectMemoryLeaks(testId, startMemory, endMemory)
      }

    } finally {
      // Clean up tracking data
      this.activeTransactions.delete(testId)
      this.testStates.delete(testId)
      this.memorySnapshots.delete(`${testId}_start`)
    }
  }

  // Add cleanup callback for test
  addCleanup(testId: string, cleanup: () => void | Promise<void>): void {
    const testState = this.testStates.get(testId)
    if (testState) {
      testState.cleanupFunctions.push(cleanup)
    } else {
      // Global cleanup if no specific test
      this.cleanupCallbacks.push(cleanup)
    }
  }

  // Reset all test state
  async resetAllState(): Promise<void> {
    // Rollback all active transactions
    const transactionIds = Array.from(this.activeTransactions.keys())
    for (const testId of transactionIds) {
      try {
        await this.endTransaction(testId, true)
      } catch (error) {
        // Ignore errors for already completed transactions
        if (error instanceof Error && error.message === 'Transaction already completed') {
          this.activeTransactions.delete(testId)
          const testState = this.testStates.get(testId)
          if (testState) {
            this.testStates.delete(testId)
          }
        } else {
          throw error
        }
      }
    }

    // Execute global cleanup callbacks
    for (const cleanup of this.cleanupCallbacks) {
      try {
        await cleanup()
      } catch (error) {
        console.error('Global cleanup error:', error)
      }
    }

    // Reset database to initial state
    testDbManager.resetState()
    
    // Reset MSW handlers
    server.resetHandlers()
    
    // Clear all tracking data
    this.activeTransactions.clear()
    this.testStates.clear()
    this.memorySnapshots.clear()
    this.cleanupCallbacks = []

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }

  // Detect memory leaks between test runs
  private detectMemoryLeaks(testId: string, startMemory: NodeJS.MemoryUsage, endMemory: NodeJS.MemoryUsage): void {
    const heapGrowth = endMemory.heapUsed - startMemory.heapUsed
    const rssGrowth = endMemory.rss - startMemory.rss
    
    // Threshold for memory leak detection (10MB)
    const LEAK_THRESHOLD = 10 * 1024 * 1024
    
    if (heapGrowth > LEAK_THRESHOLD || rssGrowth > LEAK_THRESHOLD) {
      console.warn(`⚠️  Potential memory leak detected in test ${testId}:`)
      console.warn(`   Heap growth: ${Math.round(heapGrowth / 1024 / 1024)}MB`)
      console.warn(`   RSS growth: ${Math.round(rssGrowth / 1024 / 1024)}MB`)
    }
  }

  // Get current test state
  getTestState(testId: string): TestState | undefined {
    return this.testStates.get(testId)
  }

  // Check if test has active transaction
  hasActiveTransaction(testId: string): boolean {
    return this.activeTransactions.has(testId)
  }
}

// Test transaction for database operations
export class TestTransaction {
  private operations: DatabaseOperation[] = []
  private committed: boolean = false
  private rolledBack: boolean = false

  constructor(public readonly testId: string) {}

  // Record database operation for potential rollback
  recordOperation(operation: DatabaseOperation): void {
    if (this.committed || this.rolledBack) {
      throw new Error('Cannot record operation on completed transaction')
    }
    this.operations.push(operation)
  }

  // Commit transaction (make changes permanent)
  async commit(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction already completed')
    }
    this.committed = true
    console.log(`🔄 Transaction committed for test: ${this.testId}`)
  }

  // Rollback transaction (undo all changes)
  async rollback(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction already completed')
    }

    // Reverse operations in LIFO order
    for (let i = this.operations.length - 1; i >= 0; i--) {
      const operation = this.operations[i]
      try {
        await this.reverseOperation(operation)
      } catch (error) {
        console.error(`Failed to reverse operation:`, error)
      }
    }

    this.rolledBack = true
    console.log(`🔄 Transaction rolled back for test: ${this.testId}`)
  }

  private async reverseOperation(operation: DatabaseOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        // Remove inserted record
        testDbManager.mockDelete(operation.table, { id: operation.data.id })
        break
      case 'update':
        // Restore original data
        if (operation.originalData) {
          testDbManager.mockUpdate(operation.table, operation.originalData, { id: operation.data.id })
        }
        break
      case 'delete':
        // Restore deleted record
        if (operation.originalData) {
          testDbManager.mockInsert(operation.table, operation.originalData)
        }
        break
    }
  }

  get isCompleted(): boolean {
    return this.committed || this.rolledBack
  }
}

// Database operation tracking
interface DatabaseOperation {
  type: 'insert' | 'update' | 'delete'
  table: string
  data: any
  originalData?: any
  timestamp: number
}

// Test state tracking
interface TestState {
  id: string
  startTime: number
  dbSnapshot: any
  mswHandlers: any[]
  cleanupFunctions: (() => void | Promise<void>)[]
}

// Concurrent test execution manager
export class ConcurrentTestManager {
  private static instance: ConcurrentTestManager
  private runningTests: Set<string> = new Set()
  private testQueue: TestExecution[] = []
  private maxConcurrency: number = 4

  static getInstance(): ConcurrentTestManager {
    if (!ConcurrentTestManager.instance) {
      ConcurrentTestManager.instance = new ConcurrentTestManager()
    }
    return ConcurrentTestManager.instance
  }

  // Execute test with concurrency control
  async executeTest<T>(testId: string, testFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execution: TestExecution = {
        testId,
        testFn,
        resolve,
        reject,
        startTime: Date.now()
      }

      if (this.runningTests.size < this.maxConcurrency) {
        this.runTest(execution)
      } else {
        this.testQueue.push(execution)
      }
    })
  }

  private async runTest(execution: TestExecution): Promise<void> {
    const { testId, testFn, resolve, reject } = execution
    
    this.runningTests.add(testId)
    
    try {
      const result = await testFn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.runningTests.delete(testId)
      
      // Start next test in queue
      if (this.testQueue.length > 0) {
        const nextExecution = this.testQueue.shift()!
        this.runTest(nextExecution)
      }
    }
  }

  // Set maximum concurrent tests
  setMaxConcurrency(max: number): void {
    this.maxConcurrency = Math.max(1, max)
  }

  // Get current test execution stats
  getStats(): ConcurrentTestStats {
    return {
      running: this.runningTests.size,
      queued: this.testQueue.length,
      maxConcurrency: this.maxConcurrency
    }
  }
}

interface TestExecution {
  testId: string
  testFn: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  startTime: number
}

interface ConcurrentTestStats {
  running: number
  queued: number
  maxConcurrency: number
}

// Global instances
export const testIsolation = TestIsolationManager.getInstance()
export const concurrentTests = ConcurrentTestManager.getInstance()

// Utility functions for easy test setup
export const withTestTransaction = async <T>(
  testId: string,
  testFn: (transaction: TestTransaction) => Promise<T>
): Promise<T> => {
  const transaction = await testIsolation.startTransaction(testId)
  
  try {
    const result = await testFn(transaction)
    await testIsolation.endTransaction(testId, false) // commit
    return result
  } catch (error) {
    await testIsolation.endTransaction(testId, true) // rollback
    throw error
  }
}

export const withTestIsolation = async <T>(
  testId: string,
  testFn: () => Promise<T>
): Promise<T> => {
  await testIsolation.startTransaction(testId)
  
  try {
    const result = await testFn()
    return result
  } finally {
    await testIsolation.endTransaction(testId, true) // always rollback for isolation
  }
}

// Memory leak detection utilities
export const detectMemoryLeaks = (testName: string): MemoryLeakDetector => {
  return new MemoryLeakDetector(testName)
}

export class MemoryLeakDetector {
  private initialMemory: NodeJS.MemoryUsage
  private snapshots: Map<string, NodeJS.MemoryUsage> = new Map()

  constructor(private testName: string) {
    this.initialMemory = process.memoryUsage()
  }

  takeSnapshot(label: string): void {
    this.snapshots.set(label, process.memoryUsage())
  }

  checkForLeaks(threshold: number = 10 * 1024 * 1024): MemoryLeakReport {
    const currentMemory = process.memoryUsage()
    const heapGrowth = currentMemory.heapUsed - this.initialMemory.heapUsed
    const rssGrowth = currentMemory.rss - this.initialMemory.rss
    
    const hasLeak = heapGrowth > threshold || rssGrowth > threshold
    
    return {
      testName: this.testName,
      hasLeak,
      heapGrowth,
      rssGrowth,
      threshold,
      snapshots: Array.from(this.snapshots.entries()).map(([label, memory]) => ({
        label,
        heapUsed: memory.heapUsed,
        rss: memory.rss
      }))
    }
  }

  reset(): void {
    this.initialMemory = process.memoryUsage()
    this.snapshots.clear()
  }
}

interface MemoryLeakReport {
  testName: string
  hasLeak: boolean
  heapGrowth: number
  rssGrowth: number
  threshold: number
  snapshots: Array<{
    label: string
    heapUsed: number
    rss: number
  }>
}

// Test state reset utilities
export const resetTestState = async (): Promise<void> => {
  console.log('🔄 Resetting test state...')
  
  // Reset isolation manager
  await testIsolation.resetAllState()
  
  // Clear all mocks
  vi.clearAllMocks()
  vi.clearAllTimers()
  
  // Reset MSW server
  server.resetHandlers()
  
  // Force garbage collection
  if (global.gc) {
    global.gc()
  }
  
  console.log('✅ Test state reset complete')
}

// Cleanup registration for automatic cleanup
export const registerCleanup = (cleanup: () => void | Promise<void>): void => {
  testIsolation.addCleanup('global', cleanup)
}

// Test environment validation
export const validateTestEnvironment = (): TestEnvironmentReport => {
  const memoryUsage = process.memoryUsage()
  const activeTransactions = testIsolation['activeTransactions'].size
  const concurrentStats = concurrentTests.getStats()
  
  return {
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    activeTransactions,
    concurrentTests: concurrentStats,
    timestamp: new Date().toISOString()
  }
}

interface TestEnvironmentReport {
  memory: {
    heapUsed: number
    heapTotal: number
    rss: number
  }
  activeTransactions: number
  concurrentTests: ConcurrentTestStats
  timestamp: string
}