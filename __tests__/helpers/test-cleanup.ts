import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { testDataRegistry, clearAllTestData } from '../fixtures/test-data'

// Database state management for tests
interface DatabaseState {
  tables: Record<string, any[]>
  sequences: Record<string, number>
  constraints: Record<string, any>
}

interface TestTransaction {
  id: string
  operations: DatabaseOperation[]
  rollbackOperations: DatabaseOperation[]
  timestamp: Date
}

interface DatabaseOperation {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE'
  table: string
  data?: any
  conditions?: any
  originalData?: any
}

class TestDatabaseManager {
  private originalState: DatabaseState = {
    tables: {},
    sequences: {},
    constraints: {}
  }
  
  private currentTransaction: TestTransaction | null = null
  private transactions: TestTransaction[] = []
  private mockSupabaseClient: any = null

  constructor() {
    this.setupMockSupabaseClient()
  }

  private setupMockSupabaseClient() {
    // Create a comprehensive mock of Supabase client
    this.mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      then: vi.fn(),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } }
        }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      }
    }
  }

  getMockSupabaseClient() {
    return this.mockSupabaseClient
  }

  // Transaction management
  beginTransaction(testName: string): string {
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.currentTransaction = {
      id: transactionId,
      operations: [],
      rollbackOperations: [],
      timestamp: new Date()
    }

    console.log(`🔄 Starting test transaction: ${transactionId} for test: ${testName}`)
    return transactionId
  }

  commitTransaction(): void {
    if (this.currentTransaction) {
      this.transactions.push(this.currentTransaction)
      console.log(`✅ Committed transaction: ${this.currentTransaction.id}`)
      this.currentTransaction = null
    }
  }

  rollbackTransaction(): void {
    if (this.currentTransaction) {
      console.log(`🔄 Rolling back transaction: ${this.currentTransaction.id}`)
      
      // Execute rollback operations in reverse order
      for (let i = this.currentTransaction.rollbackOperations.length - 1; i >= 0; i--) {
        const operation = this.currentTransaction.rollbackOperations[i]
        this.executeRollbackOperation(operation)
      }
      
      console.log(`✅ Rolled back transaction: ${this.currentTransaction.id}`)
      this.currentTransaction = null
    }
  }

  rollbackAllTransactions(): void {
    console.log(`🔄 Rolling back all ${this.transactions.length} transactions`)
    
    // Rollback all transactions in reverse order
    for (let i = this.transactions.length - 1; i >= 0; i--) {
      const transaction = this.transactions[i]
      
      // Execute rollback operations in reverse order
      for (let j = transaction.rollbackOperations.length - 1; j >= 0; j--) {
        const operation = transaction.rollbackOperations[j]
        this.executeRollbackOperation(operation)
      }
    }
    
    this.transactions = []
    console.log(`✅ All transactions rolled back`)
  }

  private executeRollbackOperation(operation: DatabaseOperation): void {
    switch (operation.type) {
      case 'INSERT':
        // For INSERT rollback, we DELETE the inserted record
        this.mockDelete(operation.table, operation.data)
        break
      case 'UPDATE':
        // For UPDATE rollback, we restore the original data
        if (operation.originalData) {
          this.mockUpdate(operation.table, operation.originalData, operation.conditions)
        }
        break
      case 'DELETE':
        // For DELETE rollback, we INSERT the deleted record back
        if (operation.originalData) {
          this.mockInsert(operation.table, operation.originalData)
        }
        break
      case 'TRUNCATE':
        // For TRUNCATE rollback, we restore all original data
        if (operation.originalData) {
          this.mockBulkInsert(operation.table, operation.originalData)
        }
        break
    }
  }

  // Mock database operations with automatic rollback tracking
  mockInsert(table: string, data: any): any {
    if (!this.originalState.tables[table]) {
      this.originalState.tables[table] = []
    }

    const insertedData = Array.isArray(data) ? data : [data]
    this.originalState.tables[table].push(...insertedData)

    // Track for rollback
    if (this.currentTransaction) {
      this.currentTransaction.operations.push({
        type: 'INSERT',
        table,
        data: insertedData
      })
      
      this.currentTransaction.rollbackOperations.push({
        type: 'INSERT', // Will be converted to DELETE in rollback
        table,
        data: insertedData
      })
    }

    return { data: insertedData, error: null }
  }

  mockUpdate(table: string, newData: any, conditions: any): any {
    if (!this.originalState.tables[table]) {
      this.originalState.tables[table] = []
    }

    const tableData = this.originalState.tables[table]
    const updatedRecords: any[] = []
    const originalRecords: any[] = []

    // Find and update matching records
    for (let i = 0; i < tableData.length; i++) {
      const record = tableData[i]
      if (this.matchesConditions(record, conditions)) {
        originalRecords.push({ ...record })
        Object.assign(record, newData)
        updatedRecords.push(record)
      }
    }

    // Track for rollback
    if (this.currentTransaction) {
      this.currentTransaction.operations.push({
        type: 'UPDATE',
        table,
        data: newData,
        conditions,
        originalData: originalRecords
      })
      
      this.currentTransaction.rollbackOperations.push({
        type: 'UPDATE',
        table,
        data: originalRecords,
        conditions,
        originalData: originalRecords
      })
    }

    return { data: updatedRecords, error: null }
  }

  mockDelete(table: string, conditions: any): any {
    if (!this.originalState.tables[table]) {
      this.originalState.tables[table] = []
    }

    const tableData = this.originalState.tables[table]
    const deletedRecords: any[] = []

    // Find and remove matching records
    for (let i = tableData.length - 1; i >= 0; i--) {
      const record = tableData[i]
      if (this.matchesConditions(record, conditions)) {
        deletedRecords.push(record)
        tableData.splice(i, 1)
      }
    }

    // Track for rollback
    if (this.currentTransaction) {
      this.currentTransaction.operations.push({
        type: 'DELETE',
        table,
        conditions,
        originalData: deletedRecords
      })
      
      this.currentTransaction.rollbackOperations.push({
        type: 'DELETE',
        table,
        originalData: deletedRecords
      })
    }

    return { data: deletedRecords, error: null }
  }

  mockSelect(table: string, conditions?: any): any {
    if (!this.originalState.tables[table]) {
      return { data: [], error: null }
    }

    let results = this.originalState.tables[table]
    
    if (conditions) {
      results = results.filter(record => this.matchesConditions(record, conditions))
    }

    return { data: results, error: null }
  }

  mockTruncate(table: string): any {
    const originalData = this.originalState.tables[table] || []
    this.originalState.tables[table] = []

    // Track for rollback
    if (this.currentTransaction) {
      this.currentTransaction.operations.push({
        type: 'TRUNCATE',
        table,
        originalData
      })
      
      this.currentTransaction.rollbackOperations.push({
        type: 'TRUNCATE',
        table,
        originalData
      })
    }

    return { data: [], error: null }
  }

  mockBulkInsert(table: string, data: any[]): any {
    if (!this.originalState.tables[table]) {
      this.originalState.tables[table] = []
    }

    this.originalState.tables[table].push(...data)
    return { data, error: null }
  }

  private matchesConditions(record: any, conditions: any): boolean {
    if (!conditions) return true

    for (const [key, value] of Object.entries(conditions)) {
      if (record[key] !== value) {
        return false
      }
    }
    return true
  }

  // State management
  captureState(): DatabaseState {
    return JSON.parse(JSON.stringify(this.originalState))
  }

  restoreState(state: DatabaseState): void {
    this.originalState = JSON.parse(JSON.stringify(state))
    console.log('🔄 Database state restored')
  }

  resetState(): void {
    this.originalState = {
      tables: {},
      sequences: {},
      constraints: {}
    }
    this.transactions = []
    this.currentTransaction = null
    console.log('🔄 Database state reset')
  }

  // Utility methods
  getTableData(table: string): any[] {
    return this.originalState.tables[table] || []
  }

  setTableData(table: string, data: any[]): void {
    this.originalState.tables[table] = [...data]
  }

  getTransactionCount(): number {
    return this.transactions.length
  }

  getCurrentTransaction(): TestTransaction | null {
    return this.currentTransaction
  }
}

// Global test database manager instance
export const testDbManager = new TestDatabaseManager()

// Test lifecycle hooks
export const setupTestDatabase = () => {
  beforeAll(() => {
    console.log('🚀 Setting up test database environment')
    testDbManager.resetState()
  })

  beforeEach((context) => {
    const testName = context?.task?.name || 'unknown-test'
    console.log(`🧪 Setting up test: ${testName}`)
    
    // Begin a new transaction for each test
    testDbManager.beginTransaction(testName)
    
    // Clear any existing test data registry
    clearAllTestData()
  })

  afterEach((context) => {
    const testName = context?.task?.name || 'unknown-test'
    console.log(`🧹 Cleaning up test: ${testName}`)
    
    // Rollback the current transaction
    testDbManager.rollbackTransaction()
    
    // Clear test data registry
    clearAllTestData()
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterAll(() => {
    console.log('🏁 Tearing down test database environment')
    
    // Rollback all remaining transactions
    testDbManager.rollbackAllTransactions()
    
    // Reset the entire state
    testDbManager.resetState()
    
    // Clear all test data
    clearAllTestData()
    
    console.log('✅ Test database cleanup completed')
  })
}

// Utility functions for test isolation
export const isolateTest = async (testFn: () => Promise<void> | void) => {
  const initialState = testDbManager.captureState()
  const transactionId = testDbManager.beginTransaction('isolated-test')
  
  try {
    await testFn()
    testDbManager.commitTransaction()
  } catch (error) {
    testDbManager.rollbackTransaction()
    throw error
  } finally {
    testDbManager.restoreState(initialState)
  }
}

export const withCleanDatabase = async (testFn: () => Promise<void> | void) => {
  testDbManager.resetState()
  
  try {
    await testFn()
  } finally {
    testDbManager.resetState()
  }
}

export const withTestData = async (
  setupData: () => void,
  testFn: () => Promise<void> | void
) => {
  const transactionId = testDbManager.beginTransaction('with-test-data')
  
  try {
    setupData()
    await testFn()
    testDbManager.commitTransaction()
  } catch (error) {
    testDbManager.rollbackTransaction()
    throw error
  }
}

// Mock factory for Supabase operations
export const createMockSupabaseOperations = () => {
  const mockClient = testDbManager.getMockSupabaseClient()
  
  // Override the 'then' method to simulate async operations
  mockClient.then = vi.fn().mockImplementation((onResolve) => {
    const result = { data: [], error: null }
    return Promise.resolve(onResolve ? onResolve(result) : result)
  })
  
  // Override specific operations to use our test database
  mockClient.select = vi.fn().mockImplementation((columns = '*') => {
    const chainable = { ...mockClient }
    chainable.then = vi.fn().mockImplementation((onResolve) => {
      // This would be implemented based on the current table context
      const result = { data: [], error: null }
      return Promise.resolve(onResolve ? onResolve(result) : result)
    })
    return chainable
  })
  
  return mockClient
}

// Test data seeding utilities
export const seedTestData = (table: string, data: any[]) => {
  testDbManager.setTableData(table, data)
  console.log(`🌱 Seeded ${data.length} records into ${table}`)
}

export const clearTestData = (table: string) => {
  testDbManager.setTableData(table, [])
  console.log(`🧹 Cleared test data from ${table}`)
}

export const getTestData = (table: string) => {
  return testDbManager.getTableData(table)
}

// Assertion helpers for test data integrity
export const assertDatabaseState = (expectedState: Partial<DatabaseState>) => {
  const currentState = testDbManager.captureState()
  
  for (const [table, expectedData] of Object.entries(expectedState.tables || {})) {
    const actualData = currentState.tables[table] || []
    
    if (JSON.stringify(actualData) !== JSON.stringify(expectedData)) {
      throw new Error(
        `Database state mismatch for table ${table}:\n` +
        `Expected: ${JSON.stringify(expectedData, null, 2)}\n` +
        `Actual: ${JSON.stringify(actualData, null, 2)}`
      )
    }
  }
}

export const assertTableEmpty = (table: string) => {
  const data = testDbManager.getTableData(table)
  if (data.length > 0) {
    throw new Error(`Expected table ${table} to be empty, but found ${data.length} records`)
  }
}

export const assertTableHasRecords = (table: string, expectedCount: number) => {
  const data = testDbManager.getTableData(table)
  if (data.length !== expectedCount) {
    throw new Error(
      `Expected table ${table} to have ${expectedCount} records, but found ${data.length}`
    )
  }
}

// The testDbManager is already exported above, no need to re-export