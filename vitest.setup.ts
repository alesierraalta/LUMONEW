import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
import { server } from './__tests__/utils/msw-utils'

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useParams: () => ({}),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    return React.createElement('img', { src, alt, ...props })
  },
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children)
  },
}))

// Mock Supabase client
const mockSupabaseClient = {
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
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
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
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn().mockResolvedValue({ data: [], error: null }),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'warn' })

  // Suppress console errors and warnings during tests unless they're important
  console.error = (...args: any[]) => {
    const message = args[0]
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') ||
       message.includes('validateDOMNesting') ||
       message.includes('React does not recognize'))
    ) {
      return
    }
    originalConsoleError(...args)
  }

  console.warn = (...args: any[]) => {
    const message = args[0]
    if (
      typeof message === 'string' &&
      (message.includes('componentWillReceiveProps') ||
       message.includes('componentWillUpdate'))
    ) {
      return
    }
    originalConsoleWarn(...args)
  }
})

afterAll(() => {
  // Stop MSW server
  server.close()
  
  // Restore console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Reset MSW handlers to default state
  server.resetHandlers()
})

// Global test utilities
declare global {
  var testUtils: {
    mockSupabaseClient: typeof mockSupabaseClient
    createMockUser: () => any
    createMockSession: () => any
    createMockInventoryItem: () => any
    createMockCategory: () => any
    createMockLocation: () => any
    waitForNextTick: () => Promise<void>
    msw: {
      server: typeof server
      simulateNetworkError: () => void
      simulateServerError: () => void
      simulateAuthError: () => void
      resetHandlers: () => void
    }
  }
}

global.testUtils = {
  mockSupabaseClient,
  
  createMockUser: () => ({
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
  }),

  createMockSession: () => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: global.testUtils.createMockUser()
  }),

  createMockInventoryItem: () => ({
    id: 'item-test-id',
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    description: 'Test product description',
    categoryId: 'cat-test-id',
    price: 100,
    cost: 50,
    margin: 50,
    currentStock: 25,
    minimumLevel: 10,
    status: 'active',
    locationId: 'loc-test-id',
    tags: ['test', 'product'],
    images: [],
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-test-id',
    updatedBy: 'user-test-id',
    syncStatus: 'synced',
    autoReorder: false
  }),

  createMockCategory: () => ({
    id: 'cat-test-id',
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
    createdBy: 'user-test-id',
    updatedBy: 'user-test-id',
    syncStatus: 'synced'
  }),

  createMockLocation: () => ({
    id: 'loc-test-id',
    name: 'Test Location',
    description: 'Test location description',
    itemQuantity: 10
  }),

  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  msw: {
    server,
    simulateNetworkError: () => {
      const { http, HttpResponse } = require('msw')
      server.use(
        http.get('*/rest/v1/*', () => HttpResponse.error()),
        http.post('*/rest/v1/*', () => HttpResponse.error())
      )
    },
    simulateServerError: () => {
      const { http, HttpResponse } = require('msw')
      server.use(
        http.get('*/rest/v1/*', () => HttpResponse.json({ error: { message: 'Internal server error' } }, { status: 500 })),
        http.post('*/rest/v1/*', () => HttpResponse.json({ error: { message: 'Internal server error' } }, { status: 500 }))
      )
    },
    simulateAuthError: () => {
      const { http, HttpResponse } = require('msw')
      server.use(
        http.get('*/rest/v1/*', () => HttpResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })),
        http.post('*/rest/v1/*', () => HttpResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 }))
      )
    },
    resetHandlers: () => server.resetHandlers()
  }
}

// Custom matchers for better test assertions
expect.extend({
  toBeValidInventoryItem(received: any) {
    const requiredFields = [
      'id', 'sku', 'name', 'description', 'categoryId', 'price', 'cost',
      'margin', 'currentStock', 'minimumLevel', 'status', 'locationId',
      'tags', 'images', 'lastUpdated', 'createdAt', 'updatedAt',
      'createdBy', 'updatedBy', 'syncStatus', 'autoReorder'
    ]

    const missingFields = requiredFields.filter(field => !(field in received))
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected object to be a valid inventory item, but missing fields: ${missingFields.join(', ')}`,
        pass: false
      }
    }

    const validStatuses = ['active', 'inactive', 'discontinued', 'pending']
    if (!validStatuses.includes(received.status)) {
      return {
        message: () => `Expected status to be one of ${validStatuses.join(', ')}, but got ${received.status}`,
        pass: false
      }
    }

    return {
      message: () => 'Expected object not to be a valid inventory item',
      pass: true
    }
  },

  toBeValidApiResponse(received: any) {
    const requiredFields = ['data', 'success']
    const missingFields = requiredFields.filter(field => !(field in received))
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected object to be a valid API response, but missing fields: ${missingFields.join(', ')}`,
        pass: false
      }
    }

    if (typeof received.success !== 'boolean') {
      return {
        message: () => `Expected success to be a boolean, but got ${typeof received.success}`,
        pass: false
      }
    }

    return {
      message: () => 'Expected object not to be a valid API response',
      pass: true
    }
  }
})

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidInventoryItem(): T
    toBeValidApiResponse(): T
  }
  interface AsymmetricMatchersContaining {
    toBeValidInventoryItem(): any
    toBeValidApiResponse(): any
  }
}