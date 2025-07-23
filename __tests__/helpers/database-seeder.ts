import { vi } from 'vitest'
import { testDbManager } from './test-cleanup'
import {
  createTestInventoryItem,
  createTestCategory,
  createTestLocation,
  createTestUser,
  createTestTransaction,
  createTestAuditEntry,
  createTestDataSet
} from '../fixtures/test-data'

// Database seeding utilities
export class DatabaseSeeder {
  private seededData: Map<string, any[]> = new Map()

  // Seed individual entities
  async seedInventoryItems(count: number = 5, overrides: Partial<any>[] = []): Promise<any[]> {
    const items = Array.from({ length: count }, (_, index) => 
      createTestInventoryItem(overrides[index] || {})
    )
    
    testDbManager.setTableData('inventory', items)
    this.seededData.set('inventory', items)
    
    console.log(`🌱 Seeded ${count} inventory items`)
    return items
  }

  async seedCategories(count: number = 3, overrides: Partial<any>[] = []): Promise<any[]> {
    const categories = Array.from({ length: count }, (_, index) => 
      createTestCategory(overrides[index] || {})
    )
    
    testDbManager.setTableData('categories', categories)
    this.seededData.set('categories', categories)
    
    console.log(`🌱 Seeded ${count} categories`)
    return categories
  }

  async seedLocations(count: number = 3, overrides: Partial<any>[] = []): Promise<any[]> {
    const locations = Array.from({ length: count }, (_, index) => 
      createTestLocation(overrides[index] || {})
    )
    
    testDbManager.setTableData('locations', locations)
    this.seededData.set('locations', locations)
    
    console.log(`🌱 Seeded ${count} locations`)
    return locations
  }

  async seedUsers(count: number = 3, overrides: Partial<any>[] = []): Promise<any[]> {
    const users = Array.from({ length: count }, (_, index) => 
      createTestUser(overrides[index] || {})
    )
    
    testDbManager.setTableData('users', users)
    this.seededData.set('users', users)
    
    console.log(`🌱 Seeded ${count} users`)
    return users
  }

  async seedTransactions(count: number = 5, overrides: Partial<any>[] = []): Promise<any[]> {
    const transactions = Array.from({ length: count }, (_, index) => 
      createTestTransaction(overrides[index] || {})
    )
    
    testDbManager.setTableData('transactions', transactions)
    this.seededData.set('transactions', transactions)
    
    console.log(`🌱 Seeded ${count} transactions`)
    return transactions
  }

  async seedAuditEntries(count: number = 5, overrides: Partial<any>[] = []): Promise<any[]> {
    const auditEntries = Array.from({ length: count }, (_, index) => 
      createTestAuditEntry(overrides[index] || {})
    )
    
    testDbManager.setTableData('audit_logs', auditEntries)
    this.seededData.set('audit_logs', auditEntries)
    
    console.log(`🌱 Seeded ${count} audit entries`)
    return auditEntries
  }

  // Seed complete dataset with relationships
  async seedCompleteDataset(): Promise<ReturnType<typeof createTestDataSet>> {
    const dataset = createTestDataSet()
    
    testDbManager.setTableData('users', dataset.users)
    testDbManager.setTableData('categories', dataset.categories)
    testDbManager.setTableData('locations', dataset.locations)
    testDbManager.setTableData('inventory', dataset.items)
    testDbManager.setTableData('transactions', dataset.transactions)
    testDbManager.setTableData('audit_logs', dataset.auditEntries)
    
    this.seededData.set('users', dataset.users)
    this.seededData.set('categories', dataset.categories)
    this.seededData.set('locations', dataset.locations)
    this.seededData.set('inventory', dataset.items)
    this.seededData.set('transactions', dataset.transactions)
    this.seededData.set('audit_logs', dataset.auditEntries)
    
    console.log('🌱 Seeded complete dataset with relationships')
    return dataset
  }

  // Seed minimal dataset for basic tests
  async seedMinimalDataset(): Promise<any> {
    const user = createTestUser({ role: 'admin' })
    const category = createTestCategory({ name: 'Test Category' })
    const location = createTestLocation({ name: 'Test Location' })
    const item = createTestInventoryItem({
      categoryId: category.id,
      locationId: location.id,
      createdBy: user.id,
      updatedBy: user.id
    })
    
    testDbManager.setTableData('users', [user])
    testDbManager.setTableData('categories', [category])
    testDbManager.setTableData('locations', [location])
    testDbManager.setTableData('inventory', [item])
    
    this.seededData.set('users', [user])
    this.seededData.set('categories', [category])
    this.seededData.set('locations', [location])
    this.seededData.set('inventory', [item])
    
    console.log('🌱 Seeded minimal dataset')
    return { user, category, location, item }
  }

  // Custom seeding methods for specific test scenarios
  async seedLowStockItems(count: number = 3): Promise<any[]> {
    const items = Array.from({ length: count }, (_, index) => 
      createTestInventoryItem({
        name: `Low Stock Item ${index + 1}`,
        currentStock: 5,
        minimumLevel: 10,
        status: 'active'
      })
    )
    
    const existingItems = testDbManager.getTableData('inventory')
    testDbManager.setTableData('inventory', [...existingItems, ...items])
    
    console.log(`🌱 Seeded ${count} low stock items`)
    return items
  }

  async seedInactiveItems(count: number = 2): Promise<any[]> {
    const items = Array.from({ length: count }, (_, index) => 
      createTestInventoryItem({
        name: `Inactive Item ${index + 1}`,
        status: 'inactive'
      })
    )
    
    const existingItems = testDbManager.getTableData('inventory')
    testDbManager.setTableData('inventory', [...existingItems, ...items])
    
    console.log(`🌱 Seeded ${count} inactive items`)
    return items
  }

  async seedRecentTransactions(count: number = 5): Promise<any[]> {
    const now = new Date()
    const transactions = Array.from({ length: count }, (_, index) => 
      createTestTransaction({
        timestamp: new Date(now.getTime() - (index * 60000)), // 1 minute apart
        type: index % 2 === 0 ? 'sale' : 'adjustment'
      })
    )
    
    const existingTransactions = testDbManager.getTableData('transactions')
    testDbManager.setTableData('transactions', [...existingTransactions, ...transactions])
    
    console.log(`🌱 Seeded ${count} recent transactions`)
    return transactions
  }

  // Cleanup methods
  clearTable(tableName: string): void {
    testDbManager.setTableData(tableName, [])
    this.seededData.delete(tableName)
    console.log(`🧹 Cleared table: ${tableName}`)
  }

  clearAllTables(): void {
    const tables = ['inventory', 'categories', 'locations', 'users', 'transactions', 'audit_logs']
    tables.forEach(table => this.clearTable(table))
    console.log('🧹 Cleared all tables')
  }

  getSeededData(tableName: string): any[] {
    return this.seededData.get(tableName) || []
  }

  getAllSeededData(): Map<string, any[]> {
    return new Map(this.seededData)
  }

  // Utility methods for test assertions
  findSeededItem(tableName: string, predicate: (item: any) => boolean): any | undefined {
    const data = this.seededData.get(tableName) || []
    return data.find(predicate)
  }

  countSeededItems(tableName: string, predicate?: (item: any) => boolean): number {
    const data = this.seededData.get(tableName) || []
    return predicate ? data.filter(predicate).length : data.length
  }

  // Mock Supabase responses for seeded data
  setupMockResponses(): void {
    const mockClient = testDbManager.getMockSupabaseClient()
    
    // Mock select operations to return seeded data
    mockClient.from = vi.fn().mockImplementation((tableName: string) => {
      const chainable = { ...mockClient }
      
      chainable.select = vi.fn().mockImplementation((columns = '*') => {
        const selectChainable = { ...chainable }
        
        selectChainable.then = vi.fn().mockImplementation((onResolve) => {
          const data = this.seededData.get(tableName) || []
          const result = { data, error: null, count: data.length }
          return Promise.resolve(onResolve ? onResolve(result) : result)
        })
        
        // Add filter methods
        selectChainable.eq = vi.fn().mockImplementation((column: string, value: any) => {
          const filterChainable = { ...selectChainable }
          filterChainable.then = vi.fn().mockImplementation((onResolve) => {
            const data = (this.seededData.get(tableName) || []).filter(item => item[column] === value)
            const result = { data, error: null, count: data.length }
            return Promise.resolve(onResolve ? onResolve(result) : result)
          })
          return filterChainable
        })
        
        selectChainable.in = vi.fn().mockImplementation((column: string, values: any[]) => {
          const filterChainable = { ...selectChainable }
          filterChainable.then = vi.fn().mockImplementation((onResolve) => {
            const data = (this.seededData.get(tableName) || []).filter(item => values.includes(item[column]))
            const result = { data, error: null, count: data.length }
            return Promise.resolve(onResolve ? onResolve(result) : result)
          })
          return filterChainable
        })
        
        selectChainable.order = vi.fn().mockImplementation((column: string, options?: any) => {
          const orderChainable = { ...selectChainable }
          orderChainable.then = vi.fn().mockImplementation((onResolve) => {
            const data = [...(this.seededData.get(tableName) || [])]
            const ascending = !options || options.ascending !== false
            data.sort((a, b) => {
              if (ascending) {
                return a[column] > b[column] ? 1 : -1
              } else {
                return a[column] < b[column] ? 1 : -1
              }
            })
            const result = { data, error: null, count: data.length }
            return Promise.resolve(onResolve ? onResolve(result) : result)
          })
          return orderChainable
        })
        
        selectChainable.limit = vi.fn().mockImplementation((count: number) => {
          const limitChainable = { ...selectChainable }
          limitChainable.then = vi.fn().mockImplementation((onResolve) => {
            const data = (this.seededData.get(tableName) || []).slice(0, count)
            const result = { data, error: null, count: data.length }
            return Promise.resolve(onResolve ? onResolve(result) : result)
          })
          return limitChainable
        })
        
        return selectChainable
      })
      
      // Mock insert operations
      chainable.insert = vi.fn().mockImplementation((data: any) => {
        const insertChainable = { ...chainable }
        insertChainable.then = vi.fn().mockImplementation((onResolve) => {
          const insertedData = Array.isArray(data) ? data : [data]
          const existingData = this.seededData.get(tableName) || []
          const newData = [...existingData, ...insertedData]
          this.seededData.set(tableName, newData)
          testDbManager.setTableData(tableName, newData)
          
          const result = { data: insertedData, error: null }
          return Promise.resolve(onResolve ? onResolve(result) : result)
        })
        return insertChainable
      })
      
      // Mock update operations
      chainable.update = vi.fn().mockImplementation((updateData: any) => {
        const updateChainable = { ...chainable }
        
        updateChainable.eq = vi.fn().mockImplementation((column: string, value: any) => {
          const eqChainable = { ...updateChainable }
          eqChainable.then = vi.fn().mockImplementation((onResolve) => {
            const data = this.seededData.get(tableName) || []
            const updatedData = data.map(item => 
              item[column] === value ? { ...item, ...updateData } : item
            )
            this.seededData.set(tableName, updatedData)
            testDbManager.setTableData(tableName, updatedData)
            
            const result = { data: updatedData.filter(item => item[column] === value), error: null }
            return Promise.resolve(onResolve ? onResolve(result) : result)
          })
          return eqChainable
        })
        
        return updateChainable
      })
      
      // Mock delete operations
      chainable.delete = vi.fn().mockImplementation(() => {
        const deleteChainable = { ...chainable }
        
        deleteChainable.eq = vi.fn().mockImplementation((column: string, value: any) => {
          const eqChainable = { ...deleteChainable }
          eqChainable.then = vi.fn().mockImplementation((onResolve) => {
            const data = this.seededData.get(tableName) || []
            const deletedItems = data.filter(item => item[column] === value)
            const remainingData = data.filter(item => item[column] !== value)
            this.seededData.set(tableName, remainingData)
            testDbManager.setTableData(tableName, remainingData)
            
            const result = { data: deletedItems, error: null }
            return Promise.resolve(onResolve ? onResolve(result) : result)
          })
          return eqChainable
        })
        
        return deleteChainable
      })
      
      return chainable
    })
    
    console.log('🔧 Mock Supabase responses configured for seeded data')
  }
}

// Global seeder instance
export const dbSeeder = new DatabaseSeeder()

// Convenience functions for common seeding patterns
export const seedForTest = async (testName: string, seedFn: (seeder: DatabaseSeeder) => Promise<any>) => {
  console.log(`🌱 Seeding data for test: ${testName}`)
  const result = await seedFn(dbSeeder)
  dbSeeder.setupMockResponses()
  return result
}

export const withSeededData = async (
  seedFn: (seeder: DatabaseSeeder) => Promise<any>,
  testFn: (seededData: any) => Promise<void> | void
) => {
  const seededData = await seedFn(dbSeeder)
  dbSeeder.setupMockResponses()
  
  try {
    await testFn(seededData)
  } finally {
    dbSeeder.clearAllTables()
  }
}

// Pre-configured seeding scenarios
export const seedingScenarios = {
  minimal: () => dbSeeder.seedMinimalDataset(),
  complete: () => dbSeeder.seedCompleteDataset(),
  lowStock: () => dbSeeder.seedLowStockItems(5),
  inactive: () => dbSeeder.seedInactiveItems(3),
  recentActivity: () => dbSeeder.seedRecentTransactions(10),
  
  // Combined scenarios
  inventoryManagement: async () => {
    await dbSeeder.seedUsers(2)
    await dbSeeder.seedCategories(3)
    await dbSeeder.seedLocations(2)
    await dbSeeder.seedInventoryItems(10)
    await dbSeeder.seedLowStockItems(3)
    await dbSeeder.seedInactiveItems(2)
    return dbSeeder.getAllSeededData()
  },
  
  auditTesting: async () => {
    const minimal = await dbSeeder.seedMinimalDataset()
    await dbSeeder.seedAuditEntries(15)
    await dbSeeder.seedTransactions(10)
    return { ...minimal, auditEntries: dbSeeder.getSeededData('audit_logs') }
  }
}