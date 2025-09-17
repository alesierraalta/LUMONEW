/**
 * Authentication Cache - High-performance authentication caching
 * Reduces database calls for authentication and authorization
 */

import { User } from '@supabase/supabase-js'

export interface CachedUser {
  id: string
  email: string
  role: string
  permissions: string[]
  metadata: any
  cachedAt: number
  expiresAt: number
}

export interface AuthCacheConfig {
  maxSize: number
  defaultTTL: number
  cleanupInterval: number
}

export class AuthCache {
  private cache = new Map<string, CachedUser>()
  private cleanupTimer: NodeJS.Timeout | null = null
  
  constructor(
    private config: AuthCacheConfig = {
      maxSize: 1000,
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    }
  ) {
    this.startCleanupTimer()
  }

  /**
   * Generate cache key from authorization header
   */
  private generateCacheKey(authHeader: string): string {
    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    // Use a hash of the token as the key (first 32 characters for security)
    return token.substring(0, 32)
  }

  /**
   * Get user permissions based on role
   */
  private getUserPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      user: ['read_profile', 'update_profile'],
      moderator: ['read_profile', 'update_profile', 'moderate_content', 'manage_posts'],
      admin: [
        'read_profile',
        'update_profile',
        'manage_users',
        'manage_roles',
        'system_admin',
        'users.create',
        'users.edit',
        'users.delete',
        'roles.manage'
      ]
    }
    
    return rolePermissions[role] || rolePermissions.user
  }

  /**
   * Cache user authentication data
   */
  set(authHeader: string, user: User, ttl?: number): CachedUser {
    const cacheKey = this.generateCacheKey(authHeader)
    const now = Date.now()
    const expiresAt = now + (ttl || this.config.defaultTTL)
    
    const role = user.user_metadata?.role || 'user'
    const permissions = this.getUserPermissions(role)
    
    const cachedUser: CachedUser = {
      id: user.id,
      email: user.email || '',
      role,
      permissions,
      metadata: user.user_metadata,
      cachedAt: now,
      expiresAt
    }
    
    // Check cache size and evict if necessary
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldestEntries()
    }
    
    this.cache.set(cacheKey, cachedUser)
    return cachedUser
  }

  /**
   * Get cached user authentication data
   */
  get(authHeader: string): CachedUser | null {
    const cacheKey = this.generateCacheKey(authHeader)
    const cached = this.cache.get(cacheKey)
    
    if (!cached) {
      return null
    }
    
    // Check if cache entry has expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }
    
    return cached
  }

  /**
   * Remove user from cache
   */
  delete(authHeader: string): boolean {
    const cacheKey = this.generateCacheKey(authHeader)
    return this.cache.delete(cacheKey)
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if user has required permission
   */
  hasPermission(authHeader: string, permission: string): boolean {
    const cached = this.get(authHeader)
    return cached ? cached.permissions.includes(permission) : false
  }

  /**
   * Check if user has required role
   */
  hasRole(authHeader: string, role: string): boolean {
    const cached = this.get(authHeader)
    if (!cached) return false
    
    // Admin can access any role-restricted resource
    if (cached.role === 'admin') return true
    
    return cached.role === role
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    hitRate: number
    totalRequests: number
    cacheHits: number
    cacheMisses: number
  } {
    // This would be enhanced with actual hit/miss tracking
    return {
      size: this.cache.size,
      hitRate: 0, // Would be calculated from actual metrics
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt)
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1)
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now > value.expiresAt) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
  }
}

// Export singleton instance
export const authCache = new AuthCache()

// Utility functions for middleware
export function cacheUser(authHeader: string, user: User, ttl?: number): CachedUser {
  return authCache.set(authHeader, user, ttl)
}

export function getCachedUser(authHeader: string): CachedUser | null {
  return authCache.get(authHeader)
}

export function invalidateUser(authHeader: string): boolean {
  return authCache.delete(authHeader)
}

export function checkPermission(authHeader: string, permission: string): boolean {
  return authCache.hasPermission(authHeader, permission)
}

export function checkRole(authHeader: string, role: string): boolean {
  return authCache.hasRole(authHeader, role)
}