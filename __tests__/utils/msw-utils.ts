import { setupServer } from 'msw/node'
import { handlers, errorHandlers, mswDataStore } from '../mocks/msw-handlers'
import type { RequestHandler } from 'msw'

// MSW server instance
export const server = setupServer(...handlers)

// MSW utilities for testing
export const mswUtils = {
  // Server lifecycle management
  start: () => server.listen({ onUnhandledRequest: 'warn' }),
  stop: () => server.close(),
  reset: () => {
    server.resetHandlers()
    mswDataStore.reset()
  },

  // Dynamic handler management
  use: (...newHandlers: RequestHandler[]) => server.use(...newHandlers),
  resetHandlers: (...newHandlers: RequestHandler[]) => server.resetHandlers(...newHandlers),

  // Error simulation utilities
  simulateNetworkError: () => {
    server.use(...errorHandlers.networkError())
  },

  simulateServerError: () => {
    server.use(...errorHandlers.serverError())
  },

  simulateAuthError: () => {
    server.use(...errorHandlers.authError())
  },

  simulateTimeoutError: () => {
    server.use(...errorHandlers.timeoutError())
  },

  // Data management utilities
  dataStore: mswDataStore,

  // Seed test data
  seedTestData: (data: {
    users?: any[]
    products?: any[]
    categories?: any[]
    locations?: any[]
    auditLogs?: any[]
    stockMovements?: any[]
  }) => {
    if (data.users) {
      data.users.forEach(user => mswDataStore.create('users', user))
    }
    if (data.products) {
      data.products.forEach(product => mswDataStore.create('products', product))
    }
    if (data.categories) {
      data.categories.forEach(category => mswDataStore.create('categories', category))
    }
    if (data.locations) {
      data.locations.forEach(location => mswDataStore.create('locations', location))
    }
    if (data.auditLogs) {
      data.auditLogs.forEach(log => mswDataStore.create('audit_logs', log))
    }
    if (data.stockMovements) {
      data.stockMovements.forEach(movement => mswDataStore.create('stock_movements', movement))
    }
  },

  // Create mock responses
  createMockProduct: (overrides: Partial<any> = {}) => ({
    id: `product-${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    name: 'Mock Product',
    description: 'Mock product description',
    category_id: 'cat-1',
    price: 100,
    cost: 50,
    margin: 50,
    current_stock: 25,
    minimum_level: 10,
    status: 'active',
    location_id: 'loc-1',
    tags: ['mock', 'test'],
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-test-id',
    updated_by: 'user-test-id',
    ...overrides
  }),

  createMockCategory: (overrides: Partial<any> = {}) => ({
    id: `cat-${Date.now()}`,
    name: 'Mock Category',
    description: 'Mock category description',
    level: 0,
    path: [],
    item_count: 0,
    total_value: 0,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-test-id',
    updated_by: 'user-test-id',
    ...overrides
  }),

  createMockLocation: (overrides: Partial<any> = {}) => ({
    id: `loc-${Date.now()}`,
    name: 'Mock Location',
    description: 'Mock location description',
    item_quantity: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  createMockUser: (overrides: Partial<any> = {}) => ({
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      name: 'Mock User',
      role: 'user'
    },
    aud: 'authenticated',
    role: 'authenticated',
    ...overrides
  }),

  createMockAuditLog: (overrides: Partial<any> = {}) => ({
    id: `audit-${Date.now()}`,
    table_name: 'products',
    record_id: 'product-1',
    action: 'UPDATE',
    old_values: {},
    new_values: {},
    user_id: 'user-test-id',
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  createMockStockMovement: (overrides: Partial<any> = {}) => ({
    id: `movement-${Date.now()}`,
    product_id: 'product-1',
    location_id: 'loc-1',
    movement_type: 'IN',
    quantity: 10,
    reference: 'TEST-REF',
    notes: 'Test stock movement',
    user_id: 'user-test-id',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  // Response builders
  buildSuccessResponse: (data: any, count?: number) => ({
    data,
    error: null,
    count: count ?? (Array.isArray(data) ? data.length : 1),
    status: 200,
    statusText: 'OK'
  }),

  buildErrorResponse: (message: string, status: number = 400) => ({
    data: null,
    error: {
      message,
      details: null,
      hint: null,
      code: status.toString()
    },
    count: null,
    status,
    statusText: 'Error'
  }),

  // Test scenario utilities
  setupEmptyDatabase: () => {
    mswDataStore.reset()
    // Clear all seeded data
    mswDataStore.getAll('users').splice(0)
    mswDataStore.getAll('products').splice(0)
    mswDataStore.getAll('categories').splice(0)
    mswDataStore.getAll('locations').splice(0)
  },

  setupFullDatabase: () => {
    mswDataStore.reset()
    
    // Add comprehensive test data
    const users = [
      mswUtils.createMockUser({ id: 'admin-1', email: 'admin@test.com', user_metadata: { role: 'admin' } }),
      mswUtils.createMockUser({ id: 'manager-1', email: 'manager@test.com', user_metadata: { role: 'manager' } }),
      mswUtils.createMockUser({ id: 'user-1', email: 'user@test.com', user_metadata: { role: 'user' } })
    ]

    const categories = [
      mswUtils.createMockCategory({ id: 'cat-electronics', name: 'Electronics' }),
      mswUtils.createMockCategory({ id: 'cat-clothing', name: 'Clothing' }),
      mswUtils.createMockCategory({ id: 'cat-books', name: 'Books' })
    ]

    const locations = [
      mswUtils.createMockLocation({ id: 'loc-warehouse', name: 'Main Warehouse' }),
      mswUtils.createMockLocation({ id: 'loc-store', name: 'Retail Store' }),
      mswUtils.createMockLocation({ id: 'loc-online', name: 'Online Fulfillment' })
    ]

    const products = [
      mswUtils.createMockProduct({ 
        id: 'prod-laptop', 
        name: 'Laptop Computer', 
        category_id: 'cat-electronics',
        location_id: 'loc-warehouse',
        current_stock: 50
      }),
      mswUtils.createMockProduct({ 
        id: 'prod-shirt', 
        name: 'T-Shirt', 
        category_id: 'cat-clothing',
        location_id: 'loc-store',
        current_stock: 100
      }),
      mswUtils.createMockProduct({ 
        id: 'prod-book', 
        name: 'Programming Book', 
        category_id: 'cat-books',
        location_id: 'loc-online',
        current_stock: 25
      })
    ]

    mswUtils.seedTestData({
      users,
      categories,
      locations,
      products
    })
  },

  // Performance testing utilities
  simulateSlowResponse: (delay: number = 2000) => {
    const { http, HttpResponse, delay: mswDelay } = require('msw')
    
    server.use(
      http.get('*/rest/v1/*', async () => {
        await mswDelay(delay)
        return HttpResponse.json([])
      })
    )
  },

  // Debugging utilities
  logRequests: (enabled: boolean = true) => {
    if (enabled) {
      server.events.on('request:start', ({ request }) => {
        console.log(`MSW: ${request.method} ${request.url}`)
      })
    } else {
      server.events.removeAllListeners('request:start')
    }
  },

  // Validation utilities
  validateSupabaseRequest: (request: Request) => {
    const authHeader = request.headers.get('Authorization')
    const apiKeyHeader = request.headers.get('apikey')
    
    return {
      hasAuth: !!authHeader,
      hasApiKey: !!apiKeyHeader,
      isValidAuth: authHeader?.startsWith('Bearer '),
      isValidApiKey: apiKeyHeader === 'test-anon-key'
    }
  }
}

// Export default utilities
export default mswUtils