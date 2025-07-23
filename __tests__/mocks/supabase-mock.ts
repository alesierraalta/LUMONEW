import { vi } from 'vitest'
import type { 
  User, 
  Session, 
  AuthError, 
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  AuthResponse,
  AuthTokenResponse
} from '@supabase/supabase-js'

// Enhanced Supabase client mock with comprehensive database operations
export interface MockSupabaseClient {
  // Auth methods
  auth: {
    getSession: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
    refreshSession: ReturnType<typeof vi.fn>
    setSession: ReturnType<typeof vi.fn>
  }
  
  // Database methods
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  
  // Query filters
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  gt: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lt: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  like: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  contains: ReturnType<typeof vi.fn>
  containedBy: ReturnType<typeof vi.fn>
  rangeGt: ReturnType<typeof vi.fn>
  rangeGte: ReturnType<typeof vi.fn>
  rangeLt: ReturnType<typeof vi.fn>
  rangeLte: ReturnType<typeof vi.fn>
  rangeAdjacent: ReturnType<typeof vi.fn>
  overlaps: ReturnType<typeof vi.fn>
  textSearch: ReturnType<typeof vi.fn>
  match: ReturnType<typeof vi.fn>
  not: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  filter: ReturnType<typeof vi.fn>
  
  // Query modifiers
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  offset: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  
  // Response methods
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  
  // Storage methods (if needed)
  storage?: {
    from: ReturnType<typeof vi.fn>
    upload: ReturnType<typeof vi.fn>
    download: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    list: ReturnType<typeof vi.fn>
    getPublicUrl: ReturnType<typeof vi.fn>
    createSignedUrl: ReturnType<typeof vi.fn>
  }
  
  // Real-time methods (if needed)
  channel?: ReturnType<typeof vi.fn>
  removeChannel?: ReturnType<typeof vi.fn>
  removeAllChannels?: ReturnType<typeof vi.fn>
}

// Mock data store for simulating database state
class MockDataStore {
  private data: Map<string, any[]> = new Map()
  private sequences: Map<string, number> = new Map()
  
  constructor() {
    this.initializeTables()
  }
  
  private initializeTables() {
    const tables = [
      'users', 'inventory', 'categories', 'locations', 
      'transactions', 'audit_logs', 'roles', 'permissions'
    ]
    
    tables.forEach(table => {
      this.data.set(table, [])
      this.sequences.set(table, 1)
    })
  }
  
  getTable(tableName: string): any[] {
    return this.data.get(tableName) || []
  }
  
  setTable(tableName: string, data: any[]): void {
    this.data.set(tableName, [...data])
  }
  
  addToTable(tableName: string, records: any | any[]): any[] {
    const table = this.getTable(tableName)
    const recordsArray = Array.isArray(records) ? records : [records]
    
    // Add auto-generated IDs if not present
    const processedRecords = recordsArray.map(record => {
      if (!record.id) {
        const sequence = this.sequences.get(tableName) || 1
        record.id = `${tableName.slice(0, -1)}-${sequence}`
        this.sequences.set(tableName, sequence + 1)
      }
      return {
        ...record,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString()
      }
    })
    
    table.push(...processedRecords)
    this.data.set(tableName, table)
    return processedRecords
  }
  
  updateInTable(tableName: string, updates: any, conditions: any): any[] {
    const table = this.getTable(tableName)
    const updatedRecords: any[] = []
    
    const newTable = table.map(record => {
      if (this.matchesConditions(record, conditions)) {
        const updatedRecord = {
          ...record,
          ...updates,
          updated_at: new Date().toISOString()
        }
        updatedRecords.push(updatedRecord)
        return updatedRecord
      }
      return record
    })
    
    this.data.set(tableName, newTable)
    return updatedRecords
  }
  
  deleteFromTable(tableName: string, conditions: any): any[] {
    const table = this.getTable(tableName)
    const deletedRecords: any[] = []
    
    const newTable = table.filter(record => {
      if (this.matchesConditions(record, conditions)) {
        deletedRecords.push(record)
        return false
      }
      return true
    })
    
    this.data.set(tableName, newTable)
    return deletedRecords
  }
  
  queryTable(tableName: string, options: {
    select?: string[]
    conditions?: any
    orderBy?: { column: string; ascending?: boolean }[]
    limit?: number
    offset?: number
    range?: [number, number]
  } = {}): any[] {
    let results = this.getTable(tableName)
    
    // Apply conditions
    if (options.conditions) {
      results = results.filter(record => this.matchesConditions(record, options.conditions))
    }
    
    // Apply ordering
    if (options.orderBy && options.orderBy.length > 0) {
      results.sort((a, b) => {
        for (const order of options.orderBy!) {
          const { column, ascending = true } = order
          const aVal = a[column]
          const bVal = b[column]
          
          if (aVal < bVal) return ascending ? -1 : 1
          if (aVal > bVal) return ascending ? 1 : -1
        }
        return 0
      })
    }
    
    // Apply range/pagination
    if (options.range) {
      const [start, end] = options.range
      results = results.slice(start, end + 1)
    } else {
      if (options.offset) {
        results = results.slice(options.offset)
      }
      if (options.limit) {
        results = results.slice(0, options.limit)
      }
    }
    
    // Apply select (column filtering)
    if (options.select && options.select.length > 0) {
      results = results.map(record => {
        const filtered: any = {}
        options.select!.forEach(column => {
          if (column === '*') {
            return record
          }
          if (record.hasOwnProperty(column)) {
            filtered[column] = record[column]
          }
        })
        return Object.keys(filtered).length > 0 ? filtered : record
      })
    }
    
    return results
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
  
  clearTable(tableName: string): void {
    this.data.set(tableName, [])
    this.sequences.set(tableName, 1)
  }
  
  clearAllTables(): void {
    this.data.clear()
    this.sequences.clear()
    this.initializeTables()
  }
  
  getTableNames(): string[] {
    return Array.from(this.data.keys())
  }
  
  getTableCount(tableName: string): number {
    return this.getTable(tableName).length
  }
}

// Global mock data store instance
export const mockDataStore = new MockDataStore()

// Enhanced mock responses with proper overloads
export function createMockPostgrestResponse<T>(
  data: T[],
  error?: null,
  count?: number
): PostgrestResponse<T>
export function createMockPostgrestResponse<T>(
  data: null,
  error: PostgrestError,
  count?: number
): PostgrestResponse<T>
export function createMockPostgrestResponse<T>(
  data: T[] | null,
  error: PostgrestError | null = null,
  count?: number
): PostgrestResponse<T> {
  if (error) {
    return {
      data: [] as T[],
      error,
      count: 0,
      status: 400,
      statusText: 'Bad Request'
    }
  }
  return {
    data: data || [] as T[],
    error: null,
    count: count ?? (Array.isArray(data) ? data.length : 0),
    status: 200,
    statusText: 'OK'
  }
}

export function createMockPostgrestSingleResponse<T>(
  data: T,
  error?: null
): PostgrestSingleResponse<T>
export function createMockPostgrestSingleResponse<T>(
  data: null,
  error: PostgrestError
): PostgrestSingleResponse<T>
export function createMockPostgrestSingleResponse<T>(
  data: T | null,
  error: PostgrestError | null = null
): PostgrestSingleResponse<T> {
  if (error) {
    return {
      data: null as T,
      error,
      count: 0,
      status: 400,
      statusText: 'Bad Request'
    }
  }
  return {
    data: data as T,
    error: null,
    count: data ? 1 : 0,
    status: 200,
    statusText: 'OK'
  }
}

export const createMockAuthResponse = (
  data: { user: User | null; session: Session | null } | null = null,
  error: AuthError | null = null
): AuthResponse => {
  if (error) {
    return { data: { user: null, session: null }, error }
  }
  return {
    data: data || { user: null, session: null },
    error: null
  }
}

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'mock-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    name: 'Test User',
    role: 'admin'
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockSession = (user?: User): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: user || createMockUser()
})

export const createMockError = (
  message: string,
  code?: string,
  details?: string
): PostgrestError => ({
  message,
  details: details || message,
  hint: '',
  code: code || 'PGRST116',
  name: 'PostgrestError'
})

export const createMockAuthError = (
  message: string,
  status?: number
): AuthError => {
  const error = new Error(message) as AuthError
  error.status = status || 400
  return error
}

// Enhanced Supabase client mock factory
export const createMockSupabaseClient = (options: {
  initialData?: Record<string, any[]>
  authState?: { user: User | null; session: Session | null }
  simulateErrors?: boolean
} = {}): MockSupabaseClient => {
  const { initialData, authState, simulateErrors = false } = options
  
  // Initialize mock data store
  if (initialData) {
    Object.entries(initialData).forEach(([table, data]) => {
      mockDataStore.setTable(table, data)
    })
  }
  
  // Current table context for chaining
  let currentTable = ''
  let currentQuery: any = {}
  let currentFilters: any = {}
  let currentModifiers: any = {}
  
  const resetQuery = () => {
    currentQuery = {}
    currentFilters = {}
    currentModifiers = {}
  }
  
  const executeQuery = async () => {
    if (simulateErrors && Math.random() < 0.1) {
      return createMockPostgrestResponse(null, createMockError('Simulated database error'))
    }
    
    try {
      let results: any[] = []
      
      if (currentQuery.operation === 'select') {
        results = mockDataStore.queryTable(currentTable, {
          select: currentQuery.columns,
          conditions: currentFilters,
          orderBy: currentModifiers.orderBy,
          limit: currentModifiers.limit,
          offset: currentModifiers.offset,
          range: currentModifiers.range
        })
      } else if (currentQuery.operation === 'insert') {
        results = mockDataStore.addToTable(currentTable, currentQuery.data)
      } else if (currentQuery.operation === 'update') {
        results = mockDataStore.updateInTable(currentTable, currentQuery.data, currentFilters)
      } else if (currentQuery.operation === 'delete') {
        results = mockDataStore.deleteFromTable(currentTable, currentFilters)
      } else if (currentQuery.operation === 'upsert') {
        // Simple upsert implementation
        const existing = mockDataStore.queryTable(currentTable, {
          conditions: currentFilters
        })
        
        if (existing.length > 0) {
          results = mockDataStore.updateInTable(currentTable, currentQuery.data, currentFilters)
        } else {
          results = mockDataStore.addToTable(currentTable, currentQuery.data)
        }
      }
      
      return createMockPostgrestResponse(results)
    } catch (error) {
      return createMockPostgrestResponse(null, createMockError('Query execution failed'))
    } finally {
      resetQuery()
    }
  }
  
  const createChainableQuery = () => {
    const chainable: any = {}
    
    // Query filters
    chainable.eq = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[column] = value
      return chainable
    })
    
    chainable.neq = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_neq`] = value
      return chainable
    })
    
    chainable.gt = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_gt`] = value
      return chainable
    })
    
    chainable.gte = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_gte`] = value
      return chainable
    })
    
    chainable.lt = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_lt`] = value
      return chainable
    })
    
    chainable.lte = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_lte`] = value
      return chainable
    })
    
    chainable.like = vi.fn().mockImplementation((column: string, pattern: string) => {
      currentFilters[`${column}_like`] = pattern
      return chainable
    })
    
    chainable.ilike = vi.fn().mockImplementation((column: string, pattern: string) => {
      currentFilters[`${column}_ilike`] = pattern
      return chainable
    })
    
    chainable.in = vi.fn().mockImplementation((column: string, values: any[]) => {
      currentFilters[`${column}_in`] = values
      return chainable
    })
    
    chainable.contains = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_contains`] = value
      return chainable
    })
    
    chainable.containedBy = vi.fn().mockImplementation((column: string, value: any) => {
      currentFilters[`${column}_containedBy`] = value
      return chainable
    })
    
    // Query modifiers
    chainable.order = vi.fn().mockImplementation((column: string, options?: { ascending?: boolean }) => {
      if (!currentModifiers.orderBy) currentModifiers.orderBy = []
      currentModifiers.orderBy.push({ column, ascending: options?.ascending ?? true })
      return chainable
    })
    
    chainable.limit = vi.fn().mockImplementation((count: number) => {
      currentModifiers.limit = count
      return chainable
    })
    
    chainable.offset = vi.fn().mockImplementation((count: number) => {
      currentModifiers.offset = count
      return chainable
    })
    
    chainable.range = vi.fn().mockImplementation((from: number, to: number) => {
      currentModifiers.range = [from, to]
      return chainable
    })
    
    // Response methods
    chainable.single = vi.fn().mockImplementation(async () => {
      const response = await executeQuery()
      const data = Array.isArray(response.data) && response.data.length > 0 
        ? response.data[0] 
        : null
      return createMockPostgrestSingleResponse(data, response.error)
    })
    
    chainable.maybeSingle = vi.fn().mockImplementation(async () => {
      const response = await executeQuery()
      const data = Array.isArray(response.data) && response.data.length > 0 
        ? response.data[0] 
        : null
      return createMockPostgrestSingleResponse(data, response.error)
    })
    
    chainable.then = vi.fn().mockImplementation(async (onResolve?: (value: any) => any) => {
      const response = await executeQuery()
      return onResolve ? onResolve(response) : response
    })
    
    return chainable
  }
  
  const mockClient: MockSupabaseClient = {
    // Auth methods
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: authState?.session || null },
        error: null
      }),
      
      getUser: vi.fn().mockResolvedValue({
        data: { user: authState?.user || null },
        error: null
      }),
      
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      
      signInWithPassword: vi.fn().mockResolvedValue(
        createMockAuthResponse(
          authState || { user: createMockUser(), session: createMockSession() }
        )
      ),
      
      signUp: vi.fn().mockResolvedValue(
        createMockAuthResponse(
          authState || { user: createMockUser(), session: createMockSession() }
        )
      ),
      
      signOut: vi.fn().mockResolvedValue({ error: null }),
      
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      
      updateUser: vi.fn().mockResolvedValue(
        createMockAuthResponse({ user: createMockUser(), session: null })
      ),
      
      refreshSession: vi.fn().mockResolvedValue(
        createMockAuthResponse({ user: createMockUser(), session: createMockSession() })
      ),
      
      setSession: vi.fn().mockResolvedValue(
        createMockAuthResponse({ user: createMockUser(), session: createMockSession() })
      )
    },
    
    // Database methods
    from: vi.fn().mockImplementation((table: string) => {
      currentTable = table
      resetQuery()
      return mockClient
    }),
    
    select: vi.fn().mockImplementation((columns: string = '*') => {
      currentQuery.operation = 'select'
      currentQuery.columns = columns === '*' ? undefined : columns.split(',').map(c => c.trim())
      return createChainableQuery()
    }),
    
    insert: vi.fn().mockImplementation((data: any) => {
      currentQuery.operation = 'insert'
      currentQuery.data = data
      return createChainableQuery()
    }),
    
    update: vi.fn().mockImplementation((data: any) => {
      currentQuery.operation = 'update'
      currentQuery.data = data
      return createChainableQuery()
    }),
    
    delete: vi.fn().mockImplementation(() => {
      currentQuery.operation = 'delete'
      return createChainableQuery()
    }),
    
    upsert: vi.fn().mockImplementation((data: any) => {
      currentQuery.operation = 'upsert'
      currentQuery.data = data
      return createChainableQuery()
    }),
    
    // Direct filter methods (for backward compatibility)
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
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    
    // Direct modifier methods (for backward compatibility)
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    
    // Direct response methods (for backward compatibility)
    single: vi.fn().mockResolvedValue(createMockPostgrestSingleResponse(null)),
    maybeSingle: vi.fn().mockResolvedValue(createMockPostgrestSingleResponse(null)),
    then: vi.fn().mockResolvedValue(createMockPostgrestResponse([]))
  }
  
  return mockClient
}

// Global mock client instance
export let globalMockClient: MockSupabaseClient

// Initialize global mock client
export const initializeMockSupabaseClient = (options?: Parameters<typeof createMockSupabaseClient>[0]) => {
  globalMockClient = createMockSupabaseClient(options)
  return globalMockClient
}

// Reset mock client and data
export const resetMockSupabaseClient = () => {
  mockDataStore.clearAllTables()
  if (globalMockClient) {
    vi.clearAllMocks()
    Object.values(globalMockClient.auth).forEach(fn => fn.mockClear())
  }
}

// Utility functions for testing
export const seedMockDatabase = (data: Record<string, any[]>) => {
  Object.entries(data).forEach(([table, records]) => {
    mockDataStore.setTable(table, records)
  })
}

export const getMockTableData = (tableName: string) => {
  return mockDataStore.getTable(tableName)
}

export const clearMockTable = (tableName: string) => {
  mockDataStore.clearTable(tableName)
}

export const getMockTableCount = (tableName: string) => {
  return mockDataStore.getTableCount(tableName)
}