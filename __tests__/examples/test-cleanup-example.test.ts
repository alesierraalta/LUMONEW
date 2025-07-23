import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestDatabase, testDbManager, isolateTest, withCleanDatabase, withTestData } from '../helpers/test-cleanup'
import { dbSeeder, seedForTest, withSeededData, seedingScenarios } from '../helpers/database-seeder'
import { createTestInventoryItem, createTestCategory, createTestUser } from '../fixtures/test-data'

// Setup test database lifecycle
setupTestDatabase()

describe('Test Cleanup and Rollback Example', () => {
  describe('Basic cleanup functionality', () => {
    it('should automatically rollback changes after test completion', async () => {
      // Start with empty database
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
      
      // Add some test data during the test
      const item = createTestInventoryItem({ name: 'Test Item' })
      testDbManager.mockInsert('inventory', item)
      
      // Verify data was added
      expect(testDbManager.getTableData('inventory')).toHaveLength(1)
      expect(testDbManager.getTableData('inventory')[0].name).toBe('Test Item')
      
      // After this test completes, the data should be automatically rolled back
    })

    it('should start with clean state after previous test', async () => {
      // This test should start with empty database due to automatic rollback
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
      
      // Add different test data
      const item = createTestInventoryItem({ name: 'Another Test Item' })
      testDbManager.mockInsert('inventory', item)
      
      expect(testDbManager.getTableData('inventory')).toHaveLength(1)
      expect(testDbManager.getTableData('inventory')[0].name).toBe('Another Test Item')
    })
  })

  describe('Transaction-based testing', () => {
    it('should handle multiple operations in a single transaction', async () => {
      const transactionId = testDbManager.beginTransaction('multi-operation-test')
      
      // Perform multiple operations
      const user = createTestUser({ name: 'Test User' })
      const category = createTestCategory({ name: 'Test Category' })
      const item = createTestInventoryItem({ 
        name: 'Test Item',
        categoryId: category.id,
        createdBy: user.id 
      })
      
      testDbManager.mockInsert('users', user)
      testDbManager.mockInsert('categories', category)
      testDbManager.mockInsert('inventory', item)
      
      // Verify all data is present
      expect(testDbManager.getTableData('users')).toHaveLength(1)
      expect(testDbManager.getTableData('categories')).toHaveLength(1)
      expect(testDbManager.getTableData('inventory')).toHaveLength(1)
      
      // Commit the transaction
      testDbManager.commitTransaction()
      
      // Data should still be present after commit
      expect(testDbManager.getTableData('users')).toHaveLength(1)
      expect(testDbManager.getTableData('categories')).toHaveLength(1)
      expect(testDbManager.getTableData('inventory')).toHaveLength(1)
    })

    it('should rollback failed operations', async () => {
      const transactionId = testDbManager.beginTransaction('failed-operation-test')
      
      // Add some data
      const item = createTestInventoryItem({ name: 'Test Item' })
      testDbManager.mockInsert('inventory', item)
      
      expect(testDbManager.getTableData('inventory')).toHaveLength(1)
      
      // Simulate a failure and rollback
      testDbManager.rollbackTransaction()
      
      // Data should be gone after rollback
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
    })
  })

  describe('Isolated test execution', () => {
    it('should isolate test execution with automatic cleanup', async () => {
      await isolateTest(async () => {
        // Add test data
        const item = createTestInventoryItem({ name: 'Isolated Test Item' })
        testDbManager.mockInsert('inventory', item)
        
        expect(testDbManager.getTableData('inventory')).toHaveLength(1)
        
        // Perform some operations
        testDbManager.mockUpdate('inventory', { name: 'Updated Item' }, { id: item.id })
        
        const updatedData = testDbManager.getTableData('inventory')
        expect(updatedData[0].name).toBe('Updated Item')
      })
      
      // After isolated test, database should be clean
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
    })

    it('should handle errors in isolated tests', async () => {
      let errorThrown = false
      
      try {
        await isolateTest(async () => {
          // Add test data
          const item = createTestInventoryItem({ name: 'Error Test Item' })
          testDbManager.mockInsert('inventory', item)
          
          expect(testDbManager.getTableData('inventory')).toHaveLength(1)
          
          // Simulate an error
          throw new Error('Test error')
        })
      } catch (error) {
        errorThrown = true
        expect((error as Error).message).toBe('Test error')
      }
      
      expect(errorThrown).toBe(true)
      // Database should still be clean after error
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
    })
  })

  describe('Database seeding with cleanup', () => {
    it('should seed and cleanup test data automatically', async () => {
      await withSeededData(
        async (seeder) => {
          return await seeder.seedMinimalDataset()
        },
        async (seededData) => {
          // Verify seeded data is available
          expect(testDbManager.getTableData('users')).toHaveLength(1)
          expect(testDbManager.getTableData('categories')).toHaveLength(1)
          expect(testDbManager.getTableData('locations')).toHaveLength(1)
          expect(testDbManager.getTableData('inventory')).toHaveLength(1)
          
          // Verify relationships
          const item = testDbManager.getTableData('inventory')[0]
          const category = testDbManager.getTableData('categories')[0]
          const location = testDbManager.getTableData('locations')[0]
          const user = testDbManager.getTableData('users')[0]
          
          expect(item.categoryId).toBe(category.id)
          expect(item.locationId).toBe(location.id)
          expect(item.createdBy).toBe(user.id)
        }
      )
      
      // After withSeededData, all tables should be clean
      expect(testDbManager.getTableData('users')).toHaveLength(0)
      expect(testDbManager.getTableData('categories')).toHaveLength(0)
      expect(testDbManager.getTableData('locations')).toHaveLength(0)
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
    })

    it('should handle complex seeding scenarios', async () => {
      const seededData = await seedForTest('complex-scenario', async (seeder) => {
        return await seedingScenarios.inventoryManagement()
      })
      
      // Verify complex dataset
      expect(testDbManager.getTableData('users').length).toBeGreaterThan(0)
      expect(testDbManager.getTableData('categories').length).toBeGreaterThan(0)
      expect(testDbManager.getTableData('locations').length).toBeGreaterThan(0)
      expect(testDbManager.getTableData('inventory').length).toBeGreaterThan(0)
      
      // Verify low stock items were seeded
      const lowStockItems = testDbManager.getTableData('inventory').filter(
        item => item.currentStock <= item.minimumLevel
      )
      expect(lowStockItems.length).toBeGreaterThan(0)
      
      // Verify inactive items were seeded
      const inactiveItems = testDbManager.getTableData('inventory').filter(
        item => item.status === 'inactive'
      )
      expect(inactiveItems.length).toBeGreaterThan(0)
    })
  })

  describe('Clean database testing', () => {
    it('should provide completely clean database environment', async () => {
      await withCleanDatabase(async () => {
        // Start with absolutely clean state
        expect(testDbManager.getTableData('inventory')).toHaveLength(0)
        expect(testDbManager.getTableData('users')).toHaveLength(0)
        expect(testDbManager.getTableData('categories')).toHaveLength(0)
        
        // Add some data
        const item = createTestInventoryItem({ name: 'Clean DB Test' })
        testDbManager.mockInsert('inventory', item)
        
        expect(testDbManager.getTableData('inventory')).toHaveLength(1)
      })
      
      // After withCleanDatabase, state should be reset
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
    })
  })

  describe('Test data validation and integrity', () => {
    it('should validate test data integrity during operations', async () => {
      const transactionId = testDbManager.beginTransaction('integrity-test')
      
      // Create related data
      const user = createTestUser({ name: 'Integrity User' })
      const category = createTestCategory({ name: 'Integrity Category' })
      const item = createTestInventoryItem({
        name: 'Integrity Item',
        categoryId: category.id,
        createdBy: user.id
      })
      
      // Insert in correct order (dependencies first)
      testDbManager.mockInsert('users', user)
      testDbManager.mockInsert('categories', category)
      testDbManager.mockInsert('inventory', item)
      
      // Verify referential integrity
      const insertedItem = testDbManager.getTableData('inventory')[0]
      const insertedCategory = testDbManager.getTableData('categories')[0]
      const insertedUser = testDbManager.getTableData('users')[0]
      
      expect(insertedItem.categoryId).toBe(insertedCategory.id)
      expect(insertedItem.createdBy).toBe(insertedUser.id)
      
      // Test update operations
      testDbManager.mockUpdate('inventory', { name: 'Updated Integrity Item' }, { id: item.id })
      
      const updatedItem = testDbManager.getTableData('inventory')[0]
      expect(updatedItem.name).toBe('Updated Integrity Item')
      expect(updatedItem.categoryId).toBe(category.id) // Relationship preserved
      
      testDbManager.commitTransaction()
    })

    it('should handle cascading operations correctly', async () => {
      const transactionId = testDbManager.beginTransaction('cascade-test')
      
      // Create a category with multiple items
      const category = createTestCategory({ name: 'Cascade Category' })
      const items = [
        createTestInventoryItem({ name: 'Item 1', categoryId: category.id }),
        createTestInventoryItem({ name: 'Item 2', categoryId: category.id }),
        createTestInventoryItem({ name: 'Item 3', categoryId: category.id })
      ]
      
      testDbManager.mockInsert('categories', category)
      testDbManager.mockInsert('inventory', items)
      
      expect(testDbManager.getTableData('categories')).toHaveLength(1)
      expect(testDbManager.getTableData('inventory')).toHaveLength(3)
      
      // Verify all items reference the category
      const allItems = testDbManager.getTableData('inventory')
      allItems.forEach(item => {
        expect(item.categoryId).toBe(category.id)
      })
      
      // Test deletion of category (should handle cascade)
      testDbManager.mockDelete('categories', { id: category.id })
      
      expect(testDbManager.getTableData('categories')).toHaveLength(0)
      
      testDbManager.commitTransaction()
    })
  })

  describe('Performance and stress testing', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now()
      
      await withSeededData(
        async (seeder) => {
          // Seed large dataset
          await seeder.seedUsers(50)
          await seeder.seedCategories(20)
          await seeder.seedLocations(10)
          await seeder.seedInventoryItems(500)
          await seeder.seedTransactions(1000)
          
          return seeder.getAllSeededData()
        },
        async (seededData) => {
          // Verify large dataset
          expect(testDbManager.getTableData('users')).toHaveLength(50)
          expect(testDbManager.getTableData('categories')).toHaveLength(20)
          expect(testDbManager.getTableData('locations')).toHaveLength(10)
          expect(testDbManager.getTableData('inventory')).toHaveLength(500)
          expect(testDbManager.getTableData('transactions')).toHaveLength(1000)
          
          // Perform some operations on large dataset
          const items = testDbManager.getTableData('inventory')
          const activeItems = items.filter(item => item.status === 'active')
          expect(activeItems.length).toBeGreaterThan(0)
        }
      )
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000) // 5 seconds
      
      // Verify cleanup was successful
      expect(testDbManager.getTableData('inventory')).toHaveLength(0)
      expect(testDbManager.getTableData('transactions')).toHaveLength(0)
    })
  })
})