/**
 * API Cache Manager - Optimized caching for API responses
 * Implements intelligent caching strategies for different types of API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { globalCache } from './cache-manager'

export interface CacheConfig {
  ttl: number
  tags: string[]
  varyBy?: string[]
  skipCache?: boolean
  revalidate?: boolean
}

export interface CachedResponse {
  data: any
  headers: Record<string, string>
  timestamp: number
  ttl: number
  etag: string
}

export class APICacheManager {
  private static instance: APICacheManager
  private cache = globalCache
  private etagGenerator = new Map<string, string>()

  private constructor() {}

  static getInstance(): APICacheManager {
    if (!APICacheManager.instance) {
      APICacheManager.instance = new APICacheManager()
    }
    return APICacheManager.instance
  }

  /**
   * Generate cache key for API request
   */
  private generateCacheKey(
    pathname: string, 
    searchParams: URLSearchParams, 
    varyBy?: string[]
  ): string {
    const baseKey = pathname.replace('/api/', '')
    const params = new URLSearchParams()
    
    // Add search parameters
    searchParams.forEach((value, key) => {
      if (varyBy && !varyBy.includes(key)) return
      params.append(key, value)
    })
    
    const paramString = params.toString()
    return paramString ? `${baseKey}:${paramString}` : baseKey
  }

  /**
   * Generate ETag for response data
   */
  private generateETag(data: any): string {
    const dataString = JSON.stringify(data)
    let hash = 0
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `"${Math.abs(hash).toString(16)}"`
  }

  /**
   * Get cached response if available and valid
   */
  async getCachedResponse(
    request: NextRequest,
    config: CacheConfig
  ): Promise<CachedResponse | null> {
    const cacheKey = this.generateCacheKey(
      request.nextUrl.pathname,
      request.nextUrl.searchParams,
      config.varyBy
    )

    const cached = this.cache.get(cacheKey) as CachedResponse | undefined
    
    if (!cached) return null
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey)
      return null
    }

    // Check ETag for conditional requests
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === cached.etag) {
      return { ...cached, data: null } // 304 Not Modified
    }

    return cached
  }

  /**
   * Cache API response
   */
  async cacheResponse(
    request: NextRequest,
    data: any,
    config: CacheConfig,
    additionalHeaders: Record<string, string> = {}
  ): Promise<CachedResponse> {
    const cacheKey = this.generateCacheKey(
      request.nextUrl.pathname,
      request.nextUrl.searchParams,
      config.varyBy
    )

    const etag = this.generateETag(data)
    const timestamp = Date.now()

    const cachedResponse: CachedResponse = {
      data,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': this.getCacheControlHeader(config),
        'ETag': etag,
        'Last-Modified': new Date(timestamp).toUTCString(),
        'X-Cache': 'HIT',
        'X-Cache-Timestamp': timestamp.toString(),
        ...additionalHeaders
      },
      timestamp,
      ttl: config.ttl,
      etag
    }

    this.cache.set(cacheKey, cachedResponse, config.ttl, config.tags)
    return cachedResponse
  }

  /**
   * Generate appropriate Cache-Control header
   */
  private getCacheControlHeader(config: CacheConfig): string {
    const maxAge = Math.floor(config.ttl / 1000)
    const staleWhileRevalidate = Math.floor(maxAge * 0.2) // 20% of TTL
    
    if (config.revalidate) {
      return `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    }
    
    return `public, max-age=${maxAge}`
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    return this.cache.invalidateByTags(tags)
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern)
    return this.cache.invalidateByPattern(regex)
  }

  /**
   * Create NextResponse from cached data
   */
  createResponse(cachedResponse: CachedResponse): NextResponse {
    if (cachedResponse.data === null) {
      // 304 Not Modified
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': cachedResponse.etag,
          'Cache-Control': cachedResponse.headers['Cache-Control']
        }
      })
    }

    return NextResponse.json(cachedResponse.data, {
      headers: cachedResponse.headers
    })
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...this.cache.getMetrics(),
      ...this.cache.getStats()
    }
  }
}

// Cache configurations for different endpoint types
export const CACHE_CONFIGS = {
  // Inventory endpoints
  inventory: {
    list: {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: ['inventory', 'list'],
      varyBy: ['page', 'limit', 'category', 'location', 'status', 'search']
    },
    item: {
      ttl: 10 * 60 * 1000, // 10 minutes
      tags: ['inventory', 'item'],
      varyBy: ['id']
    },
    lowStock: {
      ttl: 2 * 60 * 1000, // 2 minutes
      tags: ['inventory', 'low-stock'],
      revalidate: true
    }
  },

  // Categories endpoints
  categories: {
    list: {
      ttl: 30 * 60 * 1000, // 30 minutes
      tags: ['categories', 'list'],
      revalidate: true
    },
    item: {
      ttl: 60 * 60 * 1000, // 1 hour
      tags: ['categories', 'item'],
      varyBy: ['id']
    }
  },

  // Locations endpoints
  locations: {
    list: {
      ttl: 30 * 60 * 1000, // 30 minutes
      tags: ['locations', 'list'],
      revalidate: true
    },
    item: {
      ttl: 60 * 60 * 1000, // 1 hour
      tags: ['locations', 'item'],
      varyBy: ['id']
    }
  },

  // Users endpoints
  users: {
    list: {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: ['users', 'list'],
      varyBy: ['page', 'limit', 'role', 'status']
    },
    profile: {
      ttl: 15 * 60 * 1000, // 15 minutes
      tags: ['users', 'profile'],
      varyBy: ['id']
    }
  },

  // Dashboard endpoints
  dashboard: {
    metrics: {
      ttl: 2 * 60 * 1000, // 2 minutes
      tags: ['dashboard', 'metrics'],
      revalidate: true
    },
    recentActivities: {
      ttl: 1 * 60 * 1000, // 1 minute
      tags: ['dashboard', 'activities'],
      revalidate: true
    }
  },

  // Audit endpoints
  audit: {
    logs: {
      ttl: 1 * 60 * 1000, // 1 minute
      tags: ['audit', 'logs'],
      varyBy: ['page', 'limit', 'table', 'user', 'date']
    },
    stats: {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: ['audit', 'stats'],
      revalidate: true
    }
  }
}

// Export singleton instance
export const apiCacheManager = APICacheManager.getInstance()

// Helper function to get cache config for endpoint
export function getCacheConfig(endpoint: string, action: string): CacheConfig | null {
  const config = CACHE_CONFIGS[endpoint as keyof typeof CACHE_CONFIGS]
  if (!config) return null
  
  return config[action as keyof typeof config] || null
}

// Helper function to create cached API response
export async function createCachedResponse(
  request: NextRequest,
  data: any,
  endpoint: string,
  action: string,
  additionalHeaders: Record<string, string> = {}
): Promise<NextResponse> {
  const config = getCacheConfig(endpoint, action)
  
  if (!config || config.skipCache) {
    return NextResponse.json(data)
  }

  // Check for cached response
  const cached = await apiCacheManager.getCachedResponse(request, config)
  if (cached) {
    return apiCacheManager.createResponse(cached)
  }

  // Cache and return new response
  const cachedResponse = await apiCacheManager.cacheResponse(
    request,
    data,
    config,
    additionalHeaders
  )

  return apiCacheManager.createResponse(cachedResponse)
}