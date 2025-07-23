import { http, HttpResponse } from 'msw'
import type { User, Session } from '@supabase/supabase-js'

// Mock data store for MSW handlers
class MSWDataStore {
  private users: any[] = []
  private sessions: any[] = []
  private products: any[] = []
  private categories: any[] = []
  private locations: any[] = []
  private auditLogs: any[] = []
  private stockMovements: any[] = []

  constructor() {
    this.seedInitialData()
  }

  private seedInitialData() {
    // Seed with test data
    this.users = [
      {
        id: 'user-test-id',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {
          name: 'Test User',
          role: 'admin'
        },
        aud: 'authenticated',
        role: 'authenticated'
      }
    ]

    this.products = [
      {
        id: 'product-1',
        sku: 'TEST-SKU-001',
        name: 'Test Product 1',
        description: 'Test product description',
        category_id: 'cat-1',
        price: 100,
        cost: 50,
        margin: 50,
        current_stock: 25,
        minimum_level: 10,
        status: 'active',
        location_id: 'loc-1',
        tags: ['test', 'product'],
        images: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-test-id',
        updated_by: 'user-test-id'
      },
      {
        id: 'product-2',
        sku: 'TEST-SKU-002',
        name: 'Test Product 2',
        description: 'Another test product',
        category_id: 'cat-1',
        price: 200,
        cost: 100,
        margin: 100,
        current_stock: 15,
        minimum_level: 5,
        status: 'active',
        location_id: 'loc-1',
        tags: ['test', 'product'],
        images: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-test-id',
        updated_by: 'user-test-id'
      },
      {
        id: 'product-3',
        sku: 'TEST-SKU-003',
        name: 'Test Product 3',
        description: 'Third test product',
        category_id: 'cat-2',
        price: 150,
        cost: 75,
        margin: 75,
        current_stock: 30,
        minimum_level: 15,
        status: 'inactive',
        location_id: 'loc-2',
        tags: ['test', 'inactive'],
        images: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-test-id',
        updated_by: 'user-test-id'
      },
      {
        id: 'product-4',
        sku: 'TEST-SKU-004',
        name: 'Test Product 4',
        description: 'Fourth test product',
        category_id: 'cat-2',
        price: 300,
        cost: 150,
        margin: 150,
        current_stock: 8,
        minimum_level: 10,
        status: 'inactive',
        location_id: 'loc-2',
        tags: ['test', 'low-stock'],
        images: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-test-id',
        updated_by: 'user-test-id'
      }
    ]

    this.categories = [
      {
        id: 'cat-1',
        name: 'Test Category',
        description: 'Test category description',
        level: 0,
        path: [],
        item_count: 5,
        total_value: 500,
        is_active: true,
        sort_order: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-test-id',
        updated_by: 'user-test-id'
      }
    ]

    this.locations = [
      {
        id: 'loc-1',
        name: 'Test Location',
        description: 'Test location description',
        item_quantity: 10,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ]
  }

  // Generic CRUD operations
  getAll(table: string, filters?: Record<string, any>) {
    const data = this.getData(table)
    if (!filters) return data

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key])
        }
        return item[key] === value
      })
    })
  }

  getById(table: string, id: string) {
    const data = this.getData(table)
    return data.find(item => item.id === id)
  }

  create(table: string, item: any) {
    const data = this.getData(table)
    const newItem = {
      ...item,
      id: item.id || `${table}-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.push(newItem)
    return newItem
  }

  update(table: string, id: string, updates: any) {
    const data = this.getData(table)
    const index = data.findIndex(item => item.id === id)
    if (index === -1) return null

    const updatedItem = {
      ...data[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    data[index] = updatedItem
    return updatedItem
  }

  delete(table: string, id: string) {
    const data = this.getData(table)
    const index = data.findIndex(item => item.id === id)
    if (index === -1) return undefined

    const deletedItem = data[index]
    data.splice(index, 1)
    return deletedItem
  }

  private getData(table: string): any[] {
    switch (table) {
      case 'users': return this.users
      case 'products': return this.products
      case 'categories': return this.categories
      case 'locations': return this.locations
      case 'audit_logs': return this.auditLogs
      case 'stock_movements': return this.stockMovements
      default: return []
    }
  }

  // Reset data for testing
  reset() {
    this.users = []
    this.sessions = []
    this.products = []
    this.categories = []
    this.locations = []
    this.auditLogs = []
    this.stockMovements = []
    this.seedInitialData()
  }
}

// Global data store instance
export const mswDataStore = new MSWDataStore()

// Utility functions for creating responses
const createSuccessResponse = (data: any, count?: number) => {
  return HttpResponse.json(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...(count !== undefined && { 'Content-Range': `0-${data.length - 1}/${count}` })
    }
  })
}

const createErrorResponse = (message: string, status: number = 400) => {
  return HttpResponse.json(
    { error: { message, status } },
    { status }
  )
}

// Parse Supabase query parameters
const parseSupabaseQuery = (url: URL) => {
  const select = url.searchParams.get('select')
  const filters: Record<string, any> = {}
  
  // Parse filters from query parameters
  url.searchParams.forEach((value, key) => {
    // Skip non-filter parameters
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') {
      return
    }
    
    // Handle Supabase query format: column=eq.value or column=in.value1,value2
    if (value.startsWith('eq.')) {
      filters[key] = value.replace('eq.', '')
    } else if (value.startsWith('in.')) {
      filters[key] = value.replace('in.', '').split(',')
    } else {
      // Handle direct value assignment for backward compatibility
      filters[key] = value
    }
  })

  return { select, filters }
}

// MSW Handlers
export const handlers = [
  // Authentication endpoints
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.grant_type === 'password') {
      const { email, password } = body
      
      // Simulate authentication
      if (email === 'test@example.com' && password === 'password') {
        const user = mswDataStore.getAll('users').find(u => u.email === email)
        const session = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user
        }
        
        return HttpResponse.json({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user
        })
      }
      
      return createErrorResponse('Invalid credentials', 401)
    }
    
    return createErrorResponse('Unsupported grant type', 400)
  }),

  http.get('*/auth/v1/user', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Missing or invalid authorization header', 401)
    }
    
    const user = mswDataStore.getAll('users')[0] // Return first user for testing
    return HttpResponse.json(user)
  }),

  http.post('*/auth/v1/logout', () => {
    return HttpResponse.json({}, { status: 204 })
  }),

  // Products endpoints
  http.get('*/rest/v1/products', ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseSupabaseQuery(url)
    
    const products = mswDataStore.getAll('products', filters)
    return createSuccessResponse(products, products.length)
  }),

  http.get('*/rest/v1/products/:id', ({ params }) => {
    const product = mswDataStore.getById('products', params.id as string)
    
    if (!product) {
      return createErrorResponse('Product not found', 404)
    }
    
    return createSuccessResponse(product)
  }),

  http.post('*/rest/v1/products', async ({ request }) => {
    const body = await request.json() as any
    const product = mswDataStore.create('products', body)
    return createSuccessResponse(product)
  }),

  http.patch('*/rest/v1/products/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const product = mswDataStore.update('products', params.id as string, body)
    
    if (!product) {
      return createErrorResponse('Product not found', 404)
    }
    
    return createSuccessResponse(product)
  }),

  http.delete('*/rest/v1/products/:id', ({ params }) => {
    const product = mswDataStore.delete('products', params.id as string)
    
    if (!product) {
      return createErrorResponse('Product not found', 404)
    }
    
    return HttpResponse.json({}, { status: 204 })
  }),

  // Categories endpoints
  http.get('*/rest/v1/categories', ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseSupabaseQuery(url)
    
    const categories = mswDataStore.getAll('categories', filters)
    return createSuccessResponse(categories, categories.length)
  }),

  http.get('*/rest/v1/categories/:id', ({ params }) => {
    const category = mswDataStore.getById('categories', params.id as string)
    
    if (!category) {
      return createErrorResponse('Category not found', 404)
    }
    
    return createSuccessResponse(category)
  }),

  http.post('*/rest/v1/categories', async ({ request }) => {
    const body = await request.json() as any
    const category = mswDataStore.create('categories', body)
    return createSuccessResponse(category)
  }),

  http.patch('*/rest/v1/categories/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const category = mswDataStore.update('categories', params.id as string, body)
    
    if (!category) {
      return createErrorResponse('Category not found', 404)
    }
    
    return createSuccessResponse(category)
  }),

  http.delete('*/rest/v1/categories/:id', ({ params }) => {
    const category = mswDataStore.delete('categories', params.id as string)
    
    if (!category) {
      return createErrorResponse('Category not found', 404)
    }
    
    return HttpResponse.json({}, { status: 204 })
  }),

  // Locations endpoints
  http.get('*/rest/v1/locations', ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseSupabaseQuery(url)
    
    const locations = mswDataStore.getAll('locations', filters)
    return createSuccessResponse(locations, locations.length)
  }),

  http.get('*/rest/v1/locations/:id', ({ params }) => {
    const location = mswDataStore.getById('locations', params.id as string)
    
    if (!location) {
      return createErrorResponse('Location not found', 404)
    }
    
    return createSuccessResponse(location)
  }),

  http.post('*/rest/v1/locations', async ({ request }) => {
    const body = await request.json() as any
    const location = mswDataStore.create('locations', body)
    return createSuccessResponse(location)
  }),

  http.patch('*/rest/v1/locations/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const location = mswDataStore.update('locations', params.id as string, body)
    
    if (!location) {
      return createErrorResponse('Location not found', 404)
    }
    
    return createSuccessResponse(location)
  }),

  http.delete('*/rest/v1/locations/:id', ({ params }) => {
    const location = mswDataStore.delete('locations', params.id as string)
    
    if (!location) {
      return createErrorResponse('Location not found', 404)
    }
    
    return HttpResponse.json({}, { status: 204 })
  }),

  // Users endpoints
  http.get('*/rest/v1/users', ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseSupabaseQuery(url)
    
    const users = mswDataStore.getAll('users', filters)
    return createSuccessResponse(users, users.length)
  }),

  http.get('*/rest/v1/users/:id', ({ params }) => {
    const user = mswDataStore.getById('users', params.id as string)
    
    if (!user) {
      return createErrorResponse('User not found', 404)
    }
    
    return createSuccessResponse(user)
  }),

  // Audit logs endpoints
  http.get('*/rest/v1/audit_logs', ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseSupabaseQuery(url)
    
    const auditLogs = mswDataStore.getAll('audit_logs', filters)
    return createSuccessResponse(auditLogs, auditLogs.length)
  }),

  // Stock movements endpoints
  http.get('*/rest/v1/stock_movements', ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseSupabaseQuery(url)
    
    const stockMovements = mswDataStore.getAll('stock_movements', filters)
    return createSuccessResponse(stockMovements, stockMovements.length)
  }),

  http.post('*/rest/v1/stock_movements', async ({ request }) => {
    const body = await request.json() as any
    const stockMovement = mswDataStore.create('stock_movements', body)
    return createSuccessResponse(stockMovement)
  }),

  // Generic fallback for unhandled Supabase endpoints
  http.get('*/rest/v1/*', ({ request }) => {
    console.warn(`Unhandled GET request to: ${request.url}`)
    return createErrorResponse('Unhandled endpoint', 404)
  }),

  http.post('*/rest/v1/*', async ({ request }) => {
    console.warn(`Unhandled POST request to: ${request.url}`)
    const body = await request.json() as any
    return createSuccessResponse({ id: 'mock-id', ...body })
  }),

  http.patch('*/rest/v1/*', async ({ request }) => {
    console.warn(`Unhandled PATCH request to: ${request.url}`)
    const body = await request.json() as any
    return createSuccessResponse({ id: 'mock-id', ...body })
  }),

  http.delete('*/rest/v1/*', ({ request }) => {
    console.warn(`Unhandled DELETE request to: ${request.url}`)
    return HttpResponse.json({}, { status: 204 })
  })
]

// Error simulation handlers
export const errorHandlers = {
  networkError: () => [
    http.get('*/rest/v1/*', () => {
      return HttpResponse.error()
    }),
    http.post('*/rest/v1/*', () => {
      return HttpResponse.error()
    })
  ],

  serverError: () => [
    http.get('*/rest/v1/*', () => {
      return createErrorResponse('Internal server error', 500)
    }),
    http.post('*/rest/v1/*', () => {
      return createErrorResponse('Internal server error', 500)
    })
  ],

  authError: () => [
    http.get('*/rest/v1/*', () => {
      return createErrorResponse('Unauthorized', 401)
    }),
    http.post('*/rest/v1/*', () => {
      return createErrorResponse('Unauthorized', 401)
    })
  ],

  timeoutError: () => [
    http.get('*/rest/v1/*', () => {
      return new Promise(() => {}) // Never resolves, simulating timeout
    }),
    http.post('*/rest/v1/*', () => {
      return new Promise(() => {}) // Never resolves, simulating timeout
    })
  ]
}

export default handlers