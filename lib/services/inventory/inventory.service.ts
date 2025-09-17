import { createClient } from '../../supabase/client'
import type { InventoryItem, InventoryFormData, FilterOptions } from '../../types'

const supabase = createClient()

export class InventoryService {
  /**
   * Get all inventory items with optional filtering
   */
  /**
   * Get all inventory items with optional filtering
   */
  async getAll(filters?: FilterOptions): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    
    if (filters?.location) {
      query = query.eq('location_id', filters.location)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    } else {
      // Default to active items only (consistent with optimized service)
      query = query.eq('status', 'active')
    }

    const { data, error } = await query
    
    if (error) throw error
    
    // Apply client-side filters for complex queries
    let filteredData = data || []
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter((item: any) => 
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters?.lowStock) {
      filteredData = filteredData.filter((item: any) => 
        item.quantity <= item.min_stock
      )
    }
    
    if (filters?.stockRange) {
      filteredData = filteredData.filter((item: any) => 
        item.quantity >= filters.stockRange!.min && 
        item.quantity <= filters.stockRange!.max
      )
    }

    return filteredData
  }

  /**
   * Get inventory item by ID
   */
  async getById(id: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Create new inventory item
   */
  async create(item: InventoryFormData): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        name: item.name,
        sku: item.sku,
        category_id: item.categoryId,
        location_id: item.locationId,
        quantity: item.currentStock,
        min_stock: item.minimumLevel,
        max_stock: item.maximumLevel || item.currentStock * 2,
        unit_price: item.price,
        status: 'active'
      }])
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
   * Update inventory item
   */
  async update(id: string, updates: Partial<InventoryFormData>): Promise<InventoryItem> {
    const updateData: any = {}
    
    if (updates.name) updateData.name = updates.name
    if (updates.sku) updateData.sku = updates.sku
    if (updates.categoryId) updateData.category_id = updates.categoryId
    if (updates.locationId) updateData.location_id = updates.locationId
    if (updates.currentStock !== undefined) updateData.quantity = updates.currentStock
    if (updates.minimumLevel !== undefined) updateData.min_stock = updates.minimumLevel
    if (updates.maximumLevel !== undefined) updateData.max_stock = updates.maximumLevel
    if (updates.price !== undefined) updateData.unit_price = updates.price

    const { data, error } = await supabase
      .from('inventory')
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
   * Delete inventory item
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Get low stock items
   */
  /**
   * Get low stock items
   */
  async getLowStock(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('status', 'active')
    
    if (error) throw error
    
    return data?.filter((item: any) => item.quantity <= item.min_stock) || []
  }

  /**
   * Get items by category
   */
  /**
   * Get items by category
   */
  async getByCategory(categoryId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
    
    if (error) throw error
    return data || []
  }

  /**
   * Get items by location
   */
  /**
   * Get items by location
   */
  async getByLocation(locationId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('location_id', locationId)
      .eq('status', 'active')
    
    if (error) throw error
    return data || []
  }

  /**
   * Bulk update items
   */
  async bulkUpdate(updates: Array<{ id: string; data: Partial<InventoryFormData> }>): Promise<InventoryItem[]> {
    const results: InventoryItem[] = []
    
    for (const update of updates) {
      try {
        const result = await this.update(update.id, update.data)
        results.push(result)
      } catch (error) {
        console.error(`Failed to update item ${update.id}:`, error)
        throw error
      }
    }
    
    return results
  }

  /**
   * Search items with advanced filters
   */
  async search(query: string, filters?: FilterOptions): Promise<InventoryItem[]> {
    const searchFilters = {
      ...filters,
      search: query
    }
    
    return this.getAll(searchFilters)
  }
}

// Export singleton instance
export const inventoryService = new InventoryService()