import { vi } from 'vitest'

// Test data factory functions
export const createTestInventoryItem = (overrides: Partial<any> = {}) => ({
  id: `test-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  sku: `TEST-SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  name: 'Test Product',
  description: 'Test product description',
  categoryId: 'test-category-id',
  price: 100,
  cost: 50,
  margin: 50,
  currentStock: 25,
  minimumLevel: 10,
  status: 'active' as const,
  locationId: 'test-location-id',
  tags: ['test', 'product'],
  images: [],
  lastUpdated: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user-id',
  updatedBy: 'test-user-id',
  syncStatus: 'synced' as const,
  autoReorder: false,
  ...overrides
})

export const createTestCategory = (overrides: Partial<any> = {}) => ({
  id: `test-category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Category',
  description: 'Test category description',
  level: 0,
  path: [],
  itemCount: 5,
  totalValue: 500,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user-id',
  updatedBy: 'test-user-id',
  syncStatus: 'synced' as const,
  ...overrides
})

export const createTestLocation = (overrides: Partial<any> = {}) => ({
  id: `test-location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Location',
  description: 'Test location description',
  itemQuantity: 10,
  ...overrides
})

export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email: `test-${Math.random().toString(36).substr(2, 6)}@example.com`,
  name: 'Test User',
  role: 'admin' as const,
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    name: 'Test User',
    role: 'admin'
  },
  aud: 'authenticated',
  ...overrides
})

export const createTestTransaction = (overrides: Partial<any> = {}) => ({
  id: `test-transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'adjustment' as const,
  itemId: 'test-item-id',
  quantity: 10,
  reason: 'Test transaction',
  notes: 'Test transaction notes',
  userId: 'test-user-id',
  timestamp: new Date(),
  previousStock: 15,
  newStock: 25,
  ...overrides
})

export const createTestAuditEntry = (overrides: Partial<any> = {}) => ({
  id: `test-audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  action: 'CREATE' as const,
  entityType: 'inventory' as const,
  entityId: 'test-entity-id',
  userId: 'test-user-id',
  timestamp: new Date(),
  changes: {
    before: null,
    after: { name: 'Test Item' }
  },
  metadata: {
    userAgent: 'test-agent',
    ipAddress: '127.0.0.1'
  },
  ...overrides
})

// Mock data collections
export const mockInventoryItems = [
  createTestInventoryItem({ name: 'Product A', sku: 'PROD-A-001', currentStock: 50 }),
  createTestInventoryItem({ name: 'Product B', sku: 'PROD-B-002', currentStock: 25 }),
  createTestInventoryItem({ name: 'Product C', sku: 'PROD-C-003', currentStock: 5, status: 'inactive' }),
]

export const mockCategories = [
  createTestCategory({ name: 'Electronics', itemCount: 10 }),
  createTestCategory({ name: 'Clothing', itemCount: 15 }),
  createTestCategory({ name: 'Books', itemCount: 8 }),
]

export const mockLocations = [
  createTestLocation({ name: 'Warehouse A', itemQuantity: 100 }),
  createTestLocation({ name: 'Warehouse B', itemQuantity: 75 }),
  createTestLocation({ name: 'Store Front', itemQuantity: 25 }),
]

export const mockUsers = [
  createTestUser({ name: 'Admin User', role: 'admin' }),
  createTestUser({ name: 'Manager User', role: 'manager' }),
  createTestUser({ name: 'Staff User', role: 'staff' }),
]

export const mockTransactions = [
  createTestTransaction({ type: 'adjustment', quantity: 10, reason: 'Stock correction' }),
  createTestTransaction({ type: 'sale', quantity: -5, reason: 'Product sold' }),
  createTestTransaction({ type: 'purchase', quantity: 20, reason: 'New stock received' }),
]

export const mockAuditEntries = [
  createTestAuditEntry({ action: 'CREATE', entityType: 'inventory' }),
  createTestAuditEntry({ action: 'UPDATE', entityType: 'category' }),
  createTestAuditEntry({ action: 'DELETE', entityType: 'location' }),
]

// Test data builders with relationships
export const createTestDataSet = () => {
  const users = mockUsers
  const categories = mockCategories
  const locations = mockLocations
  const items = mockInventoryItems.map((item, index) => ({
    ...item,
    categoryId: categories[index % categories.length].id,
    locationId: locations[index % locations.length].id,
    createdBy: users[0].id,
    updatedBy: users[0].id,
  }))
  const transactions = mockTransactions.map((transaction, index) => ({
    ...transaction,
    itemId: items[index % items.length].id,
    userId: users[index % users.length].id,
  }))
  const auditEntries = mockAuditEntries.map((entry, index) => ({
    ...entry,
    entityId: items[index % items.length].id,
    userId: users[index % users.length].id,
  }))

  return {
    users,
    categories,
    locations,
    items,
    transactions,
    auditEntries,
  }
}

// Mock API responses
export const createMockApiResponse = (data: any, success = true) => ({
  data,
  success,
  message: success ? 'Operation successful' : 'Operation failed',
  timestamp: new Date().toISOString(),
})

export const createMockErrorResponse = (message: string, code = 'GENERIC_ERROR') => ({
  data: null,
  success: false,
  message,
  error: {
    code,
    details: message,
  },
  timestamp: new Date().toISOString(),
})

// Mock Supabase responses
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : data ? 1 : 0,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

export const createMockSupabaseError = (message: string, code = 'PGRST116') => ({
  message,
  details: message,
  hint: null,
  code,
})

// Test utilities for data manipulation
export const cloneTestData = (data: any) => JSON.parse(JSON.stringify(data))

export const generateUniqueId = (prefix = 'test') => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const createBulkTestData = (factory: Function, count: number, overrides: any[] = []) => {
  return Array.from({ length: count }, (_, index) => 
    factory(overrides[index] || {})
  )
}

// Test data validation helpers
export const validateTestInventoryItem = (item: any) => {
  const requiredFields = [
    'id', 'sku', 'name', 'description', 'categoryId', 'price', 'cost',
    'margin', 'currentStock', 'minimumLevel', 'status', 'locationId',
    'tags', 'images', 'lastUpdated', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'syncStatus', 'autoReorder'
  ]
  
  return requiredFields.every(field => field in item)
}

export const validateTestCategory = (category: any) => {
  const requiredFields = [
    'id', 'name', 'description', 'level', 'path', 'itemCount',
    'totalValue', 'isActive', 'sortOrder', 'createdAt', 'updatedAt',
    'createdBy', 'updatedBy', 'syncStatus'
  ]
  
  return requiredFields.every(field => field in category)
}

export const validateTestUser = (user: any) => {
  const requiredFields = ['id', 'email', 'name', 'role', 'created_at']
  return requiredFields.every(field => field in user)
}

// Test data cleanup tracking
export const testDataRegistry = new Map<string, any[]>()

export const registerTestData = (testName: string, data: any[]) => {
  testDataRegistry.set(testName, data)
}

export const getTestData = (testName: string) => {
  return testDataRegistry.get(testName) || []
}

export const clearTestData = (testName: string) => {
  testDataRegistry.delete(testName)
}

export const clearAllTestData = () => {
  testDataRegistry.clear()
}

// Mock timers and dates
export const mockCurrentDate = new Date('2023-12-25T10:00:00Z')

export const setupMockDate = () => {
  vi.useFakeTimers()
  vi.setSystemTime(mockCurrentDate)
}

export const restoreMockDate = () => {
  vi.useRealTimers()
}

// Test environment helpers
export const isTestEnvironment = () => process.env.NODE_ENV === 'test'

export const getTestConfig = () => ({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
})