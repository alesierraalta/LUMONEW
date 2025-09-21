import { test as base, expect } from '@playwright/test'

// Test configuration and utilities for inventory tests
export interface InventoryTestConfig {
  baseUrl: string
  adminCredentials: {
    email: string
    password: string
  }
  testData: {
    categories: Array<{ id: string; name: string; color: string }>
    locations: Array<{ id: string; name: string; type: string }>
  }
  timeouts: {
    short: number
    medium: number
    long: number
  }
}

export const inventoryConfig: InventoryTestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  adminCredentials: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  },
  testData: {
    categories: [
      { id: '1', name: 'Electronics', color: '#3B82F6' },
      { id: '2', name: 'Accessories', color: '#10B981' },
      { id: '3', name: 'Tools', color: '#F59E0B' },
      { id: '4', name: 'Office Supplies', color: '#8B5CF6' }
    ],
    locations: [
      { id: '1', name: 'Warehouse A', type: 'Main Warehouse' },
      { id: '2', name: 'Warehouse B', type: 'Secondary Warehouse' },
      { id: '3', name: 'Store Front', type: 'Retail Store' },
      { id: '4', name: 'Storage Room', type: 'Storage' }
    ]
  },
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000
  }
}

// Test data generators
export class InventoryTestDataGenerator {
  private static counter = 0

  static generateInventoryItem(overrides: Partial<any> = {}) {
    this.counter++
    return {
      name: `Test Product ${this.counter}`,
      sku: `TEST-${this.counter.toString().padStart(3, '0')}`,
      category_id: inventoryConfig.testData.categories[0].id,
      location_id: inventoryConfig.testData.locations[0].id,
      quantity: 100,
      min_stock: 10,
      max_stock: 200,
      unit_price: 99.99,
      status: 'active',
      ...overrides
    }
  }

  static generateBulkItems(count: number, baseOverrides: Partial<any> = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.generateInventoryItem({
        name: `Bulk Product ${i + 1}`,
        sku: `BULK-${(i + 1).toString().padStart(3, '0')}`,
        ...baseOverrides
      })
    )
  }

  static generateCSVContent(items: any[]) {
    const headers = ['name', 'sku', 'category', 'location', 'price', 'quantity', 'min_stock']
    const rows = items.map(item => [
      item.name,
      item.sku,
      item.category_id,
      item.location_id,
      item.unit_price,
      item.quantity,
      item.min_stock
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  static generateTransactionData(items: any[], type: 'sale' | 'stock_addition' = 'sale') {
    const lineItems = items.map(item => ({
      product: {
        id: item.id,
        sku: item.sku,
        name: item.name
      },
      quantity: 1,
      unitPrice: item.unit_price,
      totalPrice: item.unit_price
    }))

    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const tax = subtotal * 0.16
    const total = subtotal + tax

    return {
      type,
      lineItems,
      subtotal,
      tax,
      taxRate: 0.16,
      total,
      notes: `Test ${type} transaction`,
      createdBy: 'test-user'
    }
  }
}

// Test utilities
export class InventoryTestUtils {
  static async loginAsAdmin(page: any) {
    await page.goto(`${inventoryConfig.baseUrl}/auth/login`)
    await page.fill('[data-testid="email-input"]', inventoryConfig.adminCredentials.email)
    await page.fill('[data-testid="password-input"]', inventoryConfig.adminCredentials.password)
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  }

  static async navigateToInventory(page: any) {
    await page.click('[data-testid="inventory-nav-link"]')
    await page.waitForURL('/inventory')
    await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible()
  }

  static async createInventoryItem(page: any, item: any) {
    await page.click('[data-testid="add-item-button"]')
    await page.waitForSelector('[data-testid="item-form"]')
    
    await page.fill('[data-testid="item-name-input"]', item.name)
    await page.fill('[data-testid="item-sku-input"]', item.sku)
    await page.selectOption('[data-testid="category-select"]', { label: item.category_id })
    await page.selectOption('[data-testid="location-select"]', { label: item.location_id })
    await page.fill('[data-testid="price-input"]', item.unit_price.toString())
    await page.fill('[data-testid="quantity-input"]', item.quantity.toString())
    await page.fill('[data-testid="min-stock-input"]', item.min_stock.toString())
    
    await page.click('[data-testid="save-item-button"]')
    await page.waitForSelector('[data-testid="success-message"]')
  }

  static async searchInventoryItem(page: any, searchTerm: string) {
    await page.fill('[data-testid="search-input"]', searchTerm)
    await page.press('[data-testid="search-input"]', 'Enter')
    await page.waitForTimeout(inventoryConfig.timeouts.short)
  }

  static async selectInventoryItem(page: any, itemName: string) {
    const row = page.locator(`[data-testid="inventory-row"]:has-text("${itemName}")`)
    await row.locator('[data-testid="item-checkbox"]').check()
  }

  static async cleanupTestData(page: any, skus: string[]) {
    for (const sku of skus) {
      try {
        await this.searchInventoryItem(page, sku)
        const row = page.locator(`[data-testid="inventory-row"]:has-text("${sku}")`)
        if (await row.isVisible()) {
          await row.locator('[data-testid="delete-button"]').click()
          await page.click('[data-testid="confirm-delete-button"]')
          await page.waitForTimeout(inventoryConfig.timeouts.short)
        }
      } catch (error) {
        console.log(`Could not delete test item ${sku}:`, error)
      }
    }
  }

  static async waitForAPIResponse(page: any, url: string, timeout: number = inventoryConfig.timeouts.medium) {
    return page.waitForResponse(response => 
      response.url().includes(url) && response.status() === 200,
      { timeout }
    )
  }

  static async verifyTableSorting(page: any, column: string, direction: 'asc' | 'desc') {
    const rows = page.locator('[data-testid="inventory-row"]')
    const count = await rows.count()
    
    if (count < 2) return // Need at least 2 items to verify sorting
    
    const firstValue = await rows.first().locator(`[data-testid="item-${column}"]`).textContent()
    const secondValue = await rows.nth(1).locator(`[data-testid="item-${column}"]`).textContent()
    
    if (column === 'price' || column === 'quantity') {
      const firstNum = parseFloat(firstValue!.replace(/[^0-9.-]+/g, ''))
      const secondNum = parseFloat(secondValue!.replace(/[^0-9.-]+/g, ''))
      
      if (direction === 'asc') {
        expect(firstNum).toBeLessThanOrEqual(secondNum)
      } else {
        expect(firstNum).toBeGreaterThanOrEqual(secondNum)
      }
    } else {
      const comparison = firstValue!.localeCompare(secondValue!)
      if (direction === 'asc') {
        expect(comparison).toBeLessThanOrEqual(0)
      } else {
        expect(comparison).toBeGreaterThanOrEqual(0)
      }
    }
  }

  static async verifyBulkOperationSuccess(page: any, expectedCount: number) {
    await page.waitForSelector('[data-testid="bulk-operation-success"]', { 
      timeout: inventoryConfig.timeouts.long 
    })
    
    const successMessage = await page.locator('[data-testid="bulk-operation-success"]').textContent()
    expect(successMessage).toContain(expectedCount.toString())
  }

  static async verifyCSVImportSuccess(page: any, expectedCount: number) {
    await page.waitForSelector('[data-testid="import-complete"]', { 
      timeout: inventoryConfig.timeouts.long 
    })
    
    const successCount = await page.locator('[data-testid="import-success-count"]').textContent()
    expect(parseInt(successCount!)).toBe(expectedCount)
  }

  static async verifyTransactionCreation(page: any, expectedTotal: number) {
    await page.waitForSelector('[data-testid="transaction-success"]', { 
      timeout: inventoryConfig.timeouts.medium 
    })
    
    const totalDisplay = await page.locator('[data-testid="transaction-total"]').textContent()
    expect(totalDisplay).toContain(expectedTotal.toFixed(2))
  }
}

// Test fixtures
export const test = base.extend<{
  inventoryConfig: InventoryTestConfig
  testDataGenerator: typeof InventoryTestDataGenerator
  testUtils: typeof InventoryTestUtils
}>({
  inventoryConfig: async ({}, use) => {
    await use(inventoryConfig)
  },
  
  testDataGenerator: async ({}, use) => {
    await use(InventoryTestDataGenerator)
  },
  
  testUtils: async ({}, use) => {
    await use(InventoryTestUtils)
  }
})

// Test hooks
export const setupTestEnvironment = async (page: any) => {
  // Ensure test environment is ready
  await page.goto(inventoryConfig.baseUrl)
  
  // Check if we need to set up test data
  const response = await page.request.get(`${inventoryConfig.baseUrl}/api/inventory`)
  const data = await response.json()
  
  if (!data.success || data.data.length === 0) {
    console.log('Setting up test environment...')
    // Add any necessary setup here
  }
}

export const cleanupTestEnvironment = async (page: any) => {
  // Clean up any test data created during tests
  const testSkus = ['TEST-', 'BULK-', 'CSV-', 'API-', 'V1-', 'ANALYTICS-', 'PERF-']
  
  for (const skuPrefix of testSkus) {
    try {
      const response = await page.request.get(`${inventoryConfig.baseUrl}/api/inventory?search=${skuPrefix}`)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        for (const item of data.data) {
          await page.request.delete(`${inventoryConfig.baseUrl}/api/inventory?id=${item.id}`)
        }
      }
    } catch (error) {
      console.log(`Cleanup failed for ${skuPrefix}:`, error)
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()

  static startMeasurement(name: string): () => void {
    const startTime = Date.now()
    
    return () => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, [])
      }
      this.measurements.get(name)!.push(duration)
    }
  }

  static getAverageTime(name: string): number {
    const times = this.measurements.get(name) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  static getMaxTime(name: string): number {
    const times = this.measurements.get(name) || []
    return times.length > 0 ? Math.max(...times) : 0
  }

  static getMinTime(name: string): number {
    const times = this.measurements.get(name) || []
    return times.length > 0 ? Math.min(...times) : 0
  }

  static getAllMeasurements(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    for (const [name, times] of this.measurements.entries()) {
      result[name] = {
        avg: this.getAverageTime(name),
        min: this.getMinTime(name),
        max: this.getMaxTime(name),
        count: times.length
      }
    }
    
    return result
  }

  static reset(): void {
    this.measurements.clear()
  }
}

// Export everything for use in tests
export { expect } from '@playwright/test'
export * from './inventory-functionality.test'
export * from './inventory-api.test'