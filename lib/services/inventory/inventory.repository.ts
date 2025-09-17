import { createClient } from '../../supabase/client'
import type { InventoryItem, InventoryFormData, FilterOptions } from '../../types'

const supabase = createClient()

/**
 * Repository layer for inventory data access
 * Implements the Repository pattern for better separation of concerns
 */
export class InventoryRepository {
  private readonly tableName = 'inventory'

  /**
   * Base query builder with common joins
   */
  private getBaseQuery() {
    return supabase
      .from(this.tableName)
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
  }

  /**
   * Find all records with optional filters
   */
  async findMany(filters?: FilterOptions): Promise<InventoryItem[]> {
    let query = this.getBaseQuery().order('created_at', { ascending: false })

    // Apply database-level filters for better performance
    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    
    if (filters?.location) {
      query = query.eq('location_id', filters.location)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    // Apply pagination if specified
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  /**
   * Find single record by ID
   */
  async findById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await this.getBaseQuery()
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  /**
   * Create new record
   */
  async create(item: InventoryFormData): Promise<InventoryItem> {
    const insertData = {
      name: item.name,
      sku: item.sku,
      category_id: item.categoryId,
      location_id: item.locationId,
      quantity: item.currentStock,
      min_stock: item.minimumLevel,
      max_stock: item.maximumLevel || item.currentStock * 2,
      unit_price: item.price,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .insert([insertData])
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update existing record
   */
  async update(id: string, updates: Partial<InventoryFormData>): Promise<InventoryItem> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Map form data to database columns
    if (updates.name) updateData.name = updates.name
    if (updates.sku) updateData.sku = updates.sku
    if (updates.categoryId) updateData.category_id = updates.categoryId
    if (updates.locationId) updateData.location_id = updates.locationId
    if (updates.currentStock !== undefined) updateData.quantity = updates.currentStock
    if (updates.minimumLevel !== undefined) updateData.min_stock = updates.minimumLevel
    if (updates.maximumLevel !== undefined) updateData.max_stock = updates.maximumLevel
    if (updates.price !== undefined) updateData.unit_price = updates.price

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Find records by specific criteria
   */
  async findByCriteria(criteria: {
    categoryId?: string
    locationId?: string
    status?: string
    lowStock?: boolean
  }): Promise<InventoryItem[]> {
    let query = this.getBaseQuery()

    if (criteria.categoryId) {
      query = query.eq('category_id', criteria.categoryId)
    }
    
    if (criteria.locationId) {
      query = query.eq('location_id', criteria.locationId)
    }
    
    if (criteria.status) {
      query = query.eq('status', criteria.status)
    }

    const { data, error } = await query
    
    if (error) throw error
    
    let results = data || []
    
    // Apply client-side filters for complex queries
    if (criteria.lowStock) {
      results = results.filter((item: any) => item.quantity <= item.min_stock)
    }
    
    return results
  }

  /**
   * Count records with filters
   */
  async count(filters?: FilterOptions): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })

    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    
    if (filters?.location) {
      query = query.eq('location_id', filters.location)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { count, error } = await query
    
    if (error) throw error
    return count || 0
  }

  /**
   * Search with full-text search capabilities
   */
  async search(searchTerm: string, filters?: FilterOptions): Promise<InventoryItem[]> {
    let query = this.getBaseQuery()
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)

    // Apply additional filters
    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    
    if (filters?.location) {
      query = query.eq('location_id', filters.location)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  /**
   * Bulk operations for better performance
   */
  async bulkCreate(items: InventoryFormData[]): Promise<InventoryItem[]> {
    const insertData = items.map(item => ({
      name: item.name,
      sku: item.sku,
      category_id: item.categoryId,
      location_id: item.locationId,
      quantity: item.currentStock,
      min_stock: item.minimumLevel,
      max_stock: item.maximumLevel || item.currentStock * 2,
      unit_price: item.price,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
    
    if (error) throw error
    return data || []
  }

  /**
   * Bulk update for better performance
   */
  async bulkUpdate(updates: Array<{ id: string; data: Partial<InventoryFormData> }>): Promise<InventoryItem[]> {
    const results: InventoryItem[] = []
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (update) => {
        try {
          return await this.update(update.id, update.data)
        } catch (error) {
          console.error(`Failed to update item ${update.id}:`, error)
          throw error
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }
}

// Export singleton instance
export const inventoryRepository = new InventoryRepository()