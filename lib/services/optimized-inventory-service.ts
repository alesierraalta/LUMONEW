/**
 * Optimized Inventory Service - High-performance inventory operations
 * Implements caching, pagination, and database optimization
 */

import { createClient } from '../supabase/client'
import { auditService } from '../audit'
import { inventoryCache } from '../cache/cache-manager'
import { PaginationHelper, PaginationParams, PaginationResult } from '../utils/pagination'

const supabase = createClient()

// Get audit client for logging
function getAuditClient() {
  if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { getServiceRoleClient } = require('../supabase/service-role')
      return getServiceRoleClient()
    } catch (error) {
      console.warn('Service role client not available, using browser client for audit operations:', error)
      return supabase
    }
  }
  return supabase
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category_id: string
  location_id: string
  quantity: number
  min_stock: number
  max_stock: number
  unit_price: number
  status: string
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
    color: string
  }
  locations?: {
    id: string
    name: string
    address?: string
  }
}

export interface InventoryFilters {
  category?: string
  location?: string
  status?: string
  search?: string
  minQuantity?: number
  maxQuantity?: number
  lowStock?: boolean
  outOfStock?: boolean
}

export class OptimizedInventoryService {
  private cache = inventoryCache
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get paginated inventory items with advanced filtering and caching
   */
  async getAll(
    paginationParams: PaginationParams = {},
    filters: InventoryFilters = {}
  ): Promise<PaginationResult<InventoryItem>> {
    const params = PaginationHelper.parseParams(new URLSearchParams(
      Object.entries({ ...paginationParams, ...filters }).map(([k, v]) => [k, String(v)])
    ))

    // Generate cache key
    const cacheKey = `inventory:list:${JSON.stringify({ params, filters })}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Build optimized query with database-level filtering
      let query = supabase
        .from('inventory')
        .select(`
          id,
          name,
          sku,
          category_id,
          location_id,
          quantity,
          min_stock,
          max_stock,
          unit_price,
          status,
          created_at,
          updated_at,
          categories!inner(id, name, color),
          locations!inner(id, name, address)
        `)

      // Apply filters at database level for better performance
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }

      if (filters.location) {
        query = query.eq('location_id', filters.location)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      } else {
        query = query.eq('status', 'active') // Default to active items
      }

      // Advanced filtering
      if (filters.minQuantity !== undefined) {
        query = query.gte('quantity', filters.minQuantity)
      }

      if (filters.maxQuantity !== undefined) {
        query = query.lte('quantity', filters.maxQuantity)
      }

      if (filters.lowStock) {
        query = query.filter('quantity', 'lte', 'min_stock')
      }

      if (filters.outOfStock) {
        query = query.eq('quantity', 0)
      }

      // Text search using database full-text search
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      // Count query for pagination
      let countQuery = supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })

      // Apply same filters to count query
      if (filters.category) countQuery = countQuery.eq('category_id', filters.category)
      if (filters.location) countQuery = countQuery.eq('location_id', filters.location)
      if (filters.status) {
        countQuery = countQuery.eq('status', filters.status)
      } else {
        countQuery = countQuery.eq('status', 'active')
      }
      if (filters.minQuantity !== undefined) countQuery = countQuery.gte('quantity', filters.minQuantity)
      if (filters.maxQuantity !== undefined) countQuery = countQuery.lte('quantity', filters.maxQuantity)
      if (filters.lowStock) countQuery = countQuery.filter('quantity', 'lte', 'min_stock')
      if (filters.outOfStock) countQuery = countQuery.eq('quantity', 0)
      if (filters.search) {
        countQuery = countQuery.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      // Apply pagination
      const { dataQuery, countQuery: finalCountQuery } = PaginationHelper.buildSupabaseQuery(
        query,
        params,
        countQuery
      )

      // Execute queries in parallel
      const [dataResult, countResult] = await Promise.all([
        dataQuery,
        finalCountQuery
      ])

      if (dataResult.error) throw dataResult.error
      if (countResult?.error) throw countResult.error

      const total = countResult?.count || 0
      const result = PaginationHelper.createResult(dataResult.data || [], total, params)

      // Cache the result
      this.cache.set(cacheKey, result, this.CACHE_TTL, ['inventory', 'list'])

      return result as PaginationResult<InventoryItem>
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  }

  /**
   * Get single inventory item by ID with caching
   */
  async getById(id: string): Promise<InventoryItem> {
    const cacheKey = `inventory:item:${id}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories (id, name, color),
          locations (id, name, address)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (error) throw error

      // Cache the result
      this.cache.set(cacheKey, data, this.CACHE_TTL * 2, ['inventory', 'item', `item:${id}`])

      return data
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error)
      throw error
    }
  }

  /**
   * Get low stock items with caching
   */
  async getLowStock(): Promise<InventoryItem[]> {
    const cacheKey = 'inventory:low-stock'
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories (id, name, color),
          locations (id, name, address)
        `)
        .filter('quantity', 'lte', 'min_stock')
        .eq('status', 'active')
        .order('quantity', { ascending: true })

      if (error) throw error

      // Cache with shorter TTL for more dynamic data
      this.cache.set(cacheKey, data || [], this.CACHE_TTL / 2, ['inventory', 'low-stock'])

      return data || []
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      throw error
    }
  }

  /**
   * Get items by category with caching
   */
  async getByCategory(categoryId: string, paginationParams: PaginationParams = {}): Promise<PaginationResult<InventoryItem>> {
    return this.getAll(paginationParams, { category: categoryId })
  }

  /**
   * Get items by location with caching
   */
  async getByLocation(locationId: string, paginationParams: PaginationParams = {}): Promise<PaginationResult<InventoryItem>> {
    return this.getAll(paginationParams, { location: locationId })
  }

  /**
   * Search items with optimized full-text search
   */
  async search(
    searchTerm: string, 
    paginationParams: PaginationParams = {},
    filters: InventoryFilters = {}
  ): Promise<PaginationResult<InventoryItem>> {
    return this.getAll(paginationParams, { ...filters, search: searchTerm })
  }

  /**
   * Create new inventory item with cache invalidation
   */
  async create(item: {
    name: string
    sku: string
    category_id: string
    location_id: string
    quantity: number
    min_stock: number
    max_stock: number
    unit_price: number
    status?: string
  }): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([{ ...item, status: item.status || 'active' }])
        .select(`
          *,
          categories (id, name, color),
          locations (id, name, address)
        `)
        .single()

      if (error) throw error

      // Invalidate related caches
      this.invalidateRelatedCaches(['list', 'low-stock'])

      // Log the creation (non-blocking)
      auditService.logCreate('inventory', data.id, data, {
        action_type: 'inventory_item_created',
        reason: 'New inventory item added',
        notes: `Item: ${item.name} (SKU: ${item.sku})`
      }, getAuditClient()).catch(error => {
        console.warn('Audit logging failed for inventory creation:', error)
      })

      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'INSERT',
        table_name: 'inventory',
        record_id: 'failed',
        new_values: item,
        metadata: {
          action_type: 'failed_inventory_creation',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        supabaseClient: getAuditClient()
      })
      throw error
    }
  }

  /**
   * Update inventory item with cache invalidation
   */
  async update(id: string, updates: Partial<{
    name: string
    sku: string
    category_id: string
    location_id: string
    quantity: number
    min_stock: number
    max_stock: number
    unit_price: number
    status: string
  }>): Promise<InventoryItem> {
    try {
      const oldData = await this.getById(id)

      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          categories (id, name, color),
          locations (id, name, address)
        `)
        .single()

      if (error) throw error

      // Invalidate related caches
      this.invalidateRelatedCaches(['list', 'low-stock', `item:${id}`])

      // Special handling for quantity changes
      const quantityChanged = oldData.quantity !== updates.quantity
      const metadata: any = {
        action_type: 'inventory_item_updated',
        reason: 'Inventory item modified'
      }

      if (quantityChanged && updates.quantity !== undefined) {
        metadata.stock_change = {
          from: oldData.quantity,
          to: updates.quantity,
          difference: updates.quantity - oldData.quantity
        }
        metadata.action_type = 'inventory_stock_adjusted'
        metadata.reason = 'Stock quantity adjusted'
      }

      // Log the update (non-blocking)
      auditService.logUpdate('inventory', id, oldData, data, metadata, getAuditClient()).catch(error => {
        console.warn('Audit logging failed for inventory update:', error)
      })

      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'UPDATE',
        table_name: 'inventory',
        record_id: id,
        new_values: updates,
        metadata: {
          action_type: 'failed_inventory_update',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        supabaseClient: getAuditClient()
      })
      throw error
    }
  }

  /**
   * Delete inventory item with cache invalidation
   */
  async delete(id: string): Promise<void> {
    try {
      const oldData = await this.getById(id)

      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Invalidate related caches
      this.invalidateRelatedCaches(['list', 'low-stock', `item:${id}`])

      // Log the deletion (non-blocking)
      auditService.logDelete('inventory', id, oldData, {
        action_type: 'inventory_item_deleted',
        reason: 'Inventory item removed from system',
        notes: `Deleted item: ${oldData.name} (SKU: ${oldData.sku})`
      }, getAuditClient()).catch(error => {
        console.warn('Audit logging failed for inventory deletion:', error)
      })
    } catch (error) {
      await auditService.logOperation({
        operation: 'DELETE',
        table_name: 'inventory',
        record_id: id,
        metadata: {
          action_type: 'failed_inventory_deletion',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        supabaseClient: getAuditClient()
      })
      throw error
    }
  }

  /**
   * Bulk create items with optimized performance
   */
  async createMany(items: Array<{
    name: string
    sku: string
    category_id: string
    location_id: string
    quantity: number
    min_stock: number
    max_stock: number
    unit_price: number
    status?: string
  }>): Promise<InventoryItem[]> {
    try {
      const itemsWithStatus = items.map(item => ({ ...item, status: item.status || 'active' }))

      const { data, error } = await supabase
        .from('inventory')
        .insert(itemsWithStatus)
        .select(`
          *,
          categories (id, name, color),
          locations (id, name, address)
        `)

      if (error) throw error

      // Invalidate related caches
      this.invalidateRelatedCaches(['list', 'low-stock'])

      // Log bulk creation
      auditService.logOperation({
        operation: 'BULK_OPERATION',
        table_name: 'inventory',
        record_id: `bulk_create_${Date.now()}`,
        metadata: {
          action_type: 'bulk_inventory_creation',
          total_items: items.length,
          reason: 'Bulk inventory creation operation'
        },
        supabaseClient: getAuditClient()
      }).catch(error => {
        console.warn('Audit logging failed for bulk creation:', error)
      })

      return data || []
    } catch (error) {
      console.error('Error in bulk create:', error)
      throw error
    }
  }

  /**
   * Get inventory statistics with caching
   */
  async getStatistics(): Promise<{
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    totalValue: number
  }> {
    const cacheKey = 'inventory:statistics'
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics')

      if (error) throw error

      const stats = data || {
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0
      }

      // Cache with shorter TTL
      this.cache.set(cacheKey, stats, this.CACHE_TTL / 2, ['inventory', 'statistics'])

      return stats
    } catch (error) {
      console.error('Error fetching inventory statistics:', error)
      throw error
    }
  }

  /**
   * Invalidate related caches
   */
  private invalidateRelatedCaches(tags: string[]): void {
    this.cache.invalidateByTags(tags.map(tag => `inventory-${tag}`))
  }

  /**
   * Clear all inventory caches
   */
  clearCache(): void {
    this.cache.invalidateByTags(['inventory'])
  }
}

// Export singleton instance
export const optimizedInventoryService = new OptimizedInventoryService()