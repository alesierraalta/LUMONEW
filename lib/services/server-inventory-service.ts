/**
 * Server Inventory Service - For API routes and server-side operations
 * Uses server-side Supabase client with proper authentication context
 */

import { createClient } from '../supabase/server-with-retry'
import { PaginationHelper, PaginationParams, PaginationResult } from '../utils/pagination'

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
  images: string[]
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

export class ServerInventoryService {
  /**
   * Get paginated inventory items with proper server-side authentication
   */
  async getAll(
    paginationParams: PaginationParams = {},
    filters: InventoryFilters = {}
  ): Promise<PaginationResult<InventoryItem>> {
    const params = PaginationHelper.parseParams(new URLSearchParams(
      Object.entries({ ...paginationParams, ...filters }).map(([k, v]) => [k, String(v)])
    ))

    try {
      const supabase = createClient()
      
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
          images,
          created_at,
          updated_at,
          categories(id, name, color),
          locations(id, name, address)
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

      return result as PaginationResult<InventoryItem>
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  }

  /**
   * Get single inventory item by ID
   */
  async getById(id: string): Promise<InventoryItem> {
    try {
      const supabase = createClient()
      
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

      return data
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error)
      throw error
    }
  }

  /**
   * Create new inventory item
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
    images?: string[]
  }): Promise<InventoryItem> {
    try {
      const supabase = createClient()
      
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

      return data
    } catch (error) {
      console.error('Error creating inventory item:', error)
      throw error
    }
  }

  /**
   * Update inventory item
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
    images: string[]
  }>): Promise<InventoryItem> {
    try {
      const supabase = createClient()
      
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

      return data
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete inventory item
   */
  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error)
      throw error
    }
  }

  /**
   * Bulk create items
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
    images?: string[]
  }>): Promise<InventoryItem[]> {
    try {
      const supabase = createClient()
      
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

      return data || []
    } catch (error) {
      console.error('Error in bulk create:', error)
      throw error
    }
  }
}

// Export singleton instance
export const serverInventoryService = new ServerInventoryService()