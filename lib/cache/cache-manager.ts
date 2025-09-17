/**
 * Cache Manager - Advanced caching system with multiple strategies
 * Implements LRU, TTL, and intelligent cache invalidation
 */

export interface CacheConfig {
  maxSize: number
  defaultTTL: number
  strategy: 'lru' | 'fifo' | 'lfu'
  enableMetrics: boolean
  enableCompression: boolean
}

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  size: number
  tags: string[]
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalSize: number
  entryCount: number
  evictions: number
  averageAccessTime: number
}

export class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private accessCounts = new Map<string, number>()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    evictions: 0,
    averageAccessTime: 0
  }

  constructor(private config: CacheConfig) {}

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const startTime = performance.now()
    
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.metrics.misses++
      this.updateHitRate()
      return null
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.metrics.misses++
      this.updateHitRate()
      return null
    }

    // Update access information
    entry.lastAccessed = Date.now()
    entry.accessCount++
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)
    
    // Update access order for LRU
    this.updateAccessOrder(key)
    
    this.metrics.hits++
    this.updateHitRate()
    this.updateAverageAccessTime(performance.now() - startTime)
    
    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number, tags: string[] = []): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.calculateSize(value),
      tags
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictEntries()
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key)
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
    this.updateMetrics()
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.removeFromAccessOrder(key)
    this.accessCounts.delete(key)
    this.updateMetrics()
    
    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.accessCounts.clear()
    this.updateMetrics()
  }

  /**
   * Invalidate entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.delete(key)
        invalidated++
      }
    }
    
    return invalidated
  }

  /**
   * Invalidate entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0
    
    for (const key of Array.from(this.cache.keys())) {
      if (pattern.test(key)) {
        this.delete(key)
        invalidated++
      }
    }
    
    return invalidated
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    memoryUsage: number
    topKeys: Array<{ key: string; accessCount: number; size: number }>
    tagDistribution: Record<string, number>
  } {
    const topKeys = Array.from(this.accessCounts.entries())
      .map(([key, count]) => ({
        key,
        accessCount: count,
        size: this.cache.get(key)?.size || 0
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)

    const tagDistribution: Record<string, number> = {}
    for (const entry of Array.from(this.cache.values())) {
      for (const tag of entry.tags) {
        tagDistribution[tag] = (tagDistribution[tag] || 0) + 1
      }
    }

    return {
      size: this.cache.size,
      memoryUsage: this.metrics.totalSize,
      topKeys,
      tagDistribution
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Calculate size of value
   */
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2 // Rough estimate in bytes
    } catch {
      return 100 // Default size if serialization fails
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(): void {
    const entriesToEvict = Math.ceil(this.config.maxSize * 0.1) // Evict 10%
    
    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU(entriesToEvict)
        break
      case 'lfu':
        this.evictLFU(entriesToEvict)
        break
      case 'fifo':
        this.evictFIFO(entriesToEvict)
        break
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(count: number): void {
    for (let i = 0; i < count && this.accessOrder.length > 0; i++) {
      const key = this.accessOrder.shift()!
      this.delete(key)
      this.metrics.evictions++
    }
  }

  /**
   * Evict least frequently used entries
   */
  private evictLFU(count: number): void {
    const sortedByFrequency = Array.from(this.accessCounts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, count)

    for (const [key] of sortedByFrequency) {
      this.delete(key)
      this.metrics.evictions++
    }
  }

  /**
   * Evict first in, first out entries
   */
  private evictFIFO(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count)

    for (const [key] of entries) {
      this.delete(key)
      this.metrics.evictions++
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.entryCount = this.cache.size
    this.metrics.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0)
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0
  }

  /**
   * Update average access time
   */
  private updateAverageAccessTime(accessTime: number): void {
    const totalAccesses = this.metrics.hits + this.metrics.misses
    this.metrics.averageAccessTime = 
      (this.metrics.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let cleaned = 0
    const now = Date.now()
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key)
        cleaned++
      }
    }
    
    return cleaned
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all values
   */
  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  /**
   * Get all entries
   */
  entries(): Array<[string, T]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value])
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? !this.isExpired(entry) : false
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Specialized cache managers for different data types
export class InventoryCacheManager extends CacheManager {
  constructor() {
    super({
      maxSize: 500,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      strategy: 'lru',
      enableMetrics: true,
      enableCompression: false
    })
  }
}

export class ProjectCacheManager extends CacheManager {
  constructor() {
    super({
      maxSize: 200,
      defaultTTL: 10 * 60 * 1000, // 10 minutes
      strategy: 'lru',
      enableMetrics: true,
      enableCompression: false
    })
  }
}

export class UserCacheManager extends CacheManager {
  constructor() {
    super({
      maxSize: 100,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      strategy: 'lru',
      enableMetrics: true,
      enableCompression: false
    })
  }
}

// Export singleton instances
export const inventoryCache = new InventoryCacheManager()
export const projectCache = new ProjectCacheManager()
export const userCache = new UserCacheManager()

// Global cache manager for general use
export const globalCache = new CacheManager({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000,
  strategy: 'lru',
  enableMetrics: true,
  enableCompression: false
})