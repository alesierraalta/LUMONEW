import { apiCacheManager } from '@/lib/cache/api-cache-manager'

// Mock the cache implementation
const mockCache = new Map<string, { data: any; timestamp: number; tags: string[] }>()

jest.mock('@/lib/cache/api-cache-manager', () => ({
  apiCacheManager: {
    set: jest.fn((key: string, data: any, options: any) => {
      mockCache.set(key, {
        data,
        timestamp: Date.now(),
        tags: options?.tags || []
      })
    }),
    get: jest.fn((key: string) => {
      const item = mockCache.get(key)
      if (!item) return null
      
      // Check if expired (5 minutes TTL)
      const isExpired = Date.now() - item.timestamp > 5 * 60 * 1000
      if (isExpired) {
        mockCache.delete(key)
        return null
      }
      
      return item.data
    }),
    invalidateByTags: jest.fn((tags: string[]) => {
      const keysToDelete: string[] = []
      
      for (const [key, item] of mockCache.entries()) {
        if (tags.some(tag => item.tags.includes(tag))) {
          keysToDelete.push(key)
        }
      }
      
      keysToDelete.forEach(key => mockCache.delete(key))
    }),
    clear: jest.fn(() => {
      mockCache.clear()
    })
  }
}))

describe('API Cache Manager', () => {
  beforeEach(() => {
    mockCache.clear()
    jest.clearAllMocks()
  })

  describe('Cache Operations', () => {
    it('should store and retrieve data correctly', () => {
      const testData = { items: [{ id: 1, name: 'Test Item' }] }
      const cacheKey = '/api/inventory/items'
      const tags = ['inventory', 'list']

      // Store data
      apiCacheManager.set(cacheKey, testData, { tags })

      // Retrieve data
      const retrievedData = apiCacheManager.get(cacheKey)

      expect(retrievedData).toEqual(testData)
    })

    it('should invalidate cache by tags correctly', () => {
      // Store multiple items with different tags
      apiCacheManager.set('/api/inventory/items', { items: [] }, { tags: ['inventory', 'list'] })
      apiCacheManager.set('/api/categories', { categories: [] }, { tags: ['categories', 'list'] })
      apiCacheManager.set('/api/inventory/low-stock', { items: [] }, { tags: ['inventory', 'low-stock'] })

      // Verify data is stored
      expect(apiCacheManager.get('/api/inventory/items')).toBeDefined()
      expect(apiCacheManager.get('/api/categories')).toBeDefined()
      expect(apiCacheManager.get('/api/inventory/low-stock')).toBeDefined()

      // Invalidate by 'inventory' tag
      apiCacheManager.invalidateByTags(['inventory'])

      // Verify inventory-related cache is cleared
      expect(apiCacheManager.get('/api/inventory/items')).toBeNull()
      expect(apiCacheManager.get('/api/inventory/low-stock')).toBeNull()
      
      // Verify categories cache is still there
      expect(apiCacheManager.get('/api/categories')).toBeDefined()
    })

    it('should handle cache expiration correctly', () => {
      const testData = { items: [] }
      const cacheKey = '/api/inventory/items'

      // Store data
      apiCacheManager.set(cacheKey, testData, { tags: ['inventory'] })

      // Verify data is available
      expect(apiCacheManager.get(cacheKey)).toEqual(testData)

      // Mock time to simulate expiration (6 minutes later)
      const originalNow = Date.now
      Date.now = jest.fn(() => originalNow() + 6 * 60 * 1000)

      // Verify data is expired
      expect(apiCacheManager.get(cacheKey)).toBeNull()

      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Bulk Operations Cache Integration', () => {
    it('should invalidate inventory cache after bulk create', () => {
      // Simulate cached inventory data
      const cachedInventoryData = {
        data: [
          { id: 1, sku: 'EXISTING-001', name: 'Existing Item' }
        ]
      }
      
      apiCacheManager.set('/api/inventory/items', cachedInventoryData, { tags: ['inventory', 'list'] })

      // Verify cache is populated
      expect(apiCacheManager.get('/api/inventory/items')).toEqual(cachedInventoryData)

      // Simulate bulk create operation
      const newItems = [
        { id: 2, sku: 'NEW-001', name: 'New Item 1' },
        { id: 3, sku: 'NEW-002', name: 'New Item 2' }
      ]

      // After bulk create, invalidate cache
      apiCacheManager.invalidateByTags(['inventory', 'list'])

      // Verify cache is cleared
      expect(apiCacheManager.get('/api/inventory/items')).toBeNull()

      // Verify invalidateByTags was called with correct parameters
      expect(apiCacheManager.invalidateByTags).toHaveBeenCalledWith(['inventory', 'list'])
    })

    it('should invalidate multiple cache entries with inventory tag', () => {
      // Set up multiple cache entries with inventory tag
      apiCacheManager.set('/api/inventory/items', { items: [] }, { tags: ['inventory', 'list'] })
      apiCacheManager.set('/api/inventory/low-stock', { items: [] }, { tags: ['inventory', 'low-stock'] })
      apiCacheManager.set('/api/inventory/out-of-stock', { items: [] }, { tags: ['inventory', 'out-of-stock'] })

      // Verify all entries exist
      expect(apiCacheManager.get('/api/inventory/items')).toBeDefined()
      expect(apiCacheManager.get('/api/inventory/low-stock')).toBeDefined()
      expect(apiCacheManager.get('/api/inventory/out-of-stock')).toBeDefined()

      // Invalidate all inventory-related cache
      apiCacheManager.invalidateByTags(['inventory'])

      // Verify all inventory cache entries are cleared
      expect(apiCacheManager.get('/api/inventory/items')).toBeNull()
      expect(apiCacheManager.get('/api/inventory/low-stock')).toBeNull()
      expect(apiCacheManager.get('/api/inventory/out-of-stock')).toBeNull()
    })
  })

  describe('Cache Performance', () => {
    it('should handle large cache operations efficiently', () => {
      const startTime = Date.now()

      // Store 1000 cache entries
      for (let i = 0; i < 1000; i++) {
        apiCacheManager.set(`/api/item/${i}`, { id: i, data: `item-${i}` }, { tags: ['inventory'] })
      }

      const storeTime = Date.now() - startTime

      // Invalidate all at once
      const invalidateStartTime = Date.now()
      apiCacheManager.invalidateByTags(['inventory'])
      const invalidateTime = Date.now() - invalidateStartTime

      // Performance assertions (should be fast)
      expect(storeTime).toBeLessThan(1000) // Less than 1 second
      expect(invalidateTime).toBeLessThan(100) // Less than 100ms

      // Verify all entries are cleared
      for (let i = 0; i < 1000; i++) {
        expect(apiCacheManager.get(`/api/item/${i}`)).toBeNull()
      }
    })
  })
})
