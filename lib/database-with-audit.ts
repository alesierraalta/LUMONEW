import { supabase } from './supabase'
import { auditService } from './audit'

// Enhanced database operations with automatic audit logging
export const auditedUserService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(user: { email: string; name: string; role: string; status?: string }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single()
      
      if (error) throw error

      // Log the creation
      await auditService.logCreate('users', data.id, data, {
        action_type: 'user_created',
        reason: 'New user registration'
      })
      
      return data
    } catch (error) {
      // Log failed operation
      await auditService.logOperation({
        operation: 'INSERT',
        table_name: 'users',
        record_id: 'failed',
        new_values: user,
        metadata: {
          action_type: 'failed_user_creation',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  async update(id: string, updates: Partial<{ email: string; name: string; role: string; status: string; is_active: boolean }>) {
    try {
      // Get old values first
      const oldData = await this.getById(id)
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      // Log the update with field-level changes
      await auditService.logUpdate('users', id, oldData, data, {
        action_type: 'user_updated',
        reason: 'User information modified'
      })
      
      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'UPDATE',
        table_name: 'users',
        record_id: id,
        new_values: updates,
        metadata: {
          action_type: 'failed_user_update',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  async delete(id: string) {
    try {
      // Get data before deletion
      const oldData = await this.getById(id)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      // Log the deletion
      await auditService.logDelete('users', id, oldData, {
        action_type: 'user_deleted',
        reason: 'User account removed'
      })
    } catch (error) {
      await auditService.logOperation({
        operation: 'DELETE',
        table_name: 'users',
        record_id: id,
        metadata: {
          action_type: 'failed_user_deletion',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }
}

// Enhanced category service with audit logging
export const auditedCategoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(category: { name: string; description?: string; color: string }) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single()
      
      if (error) throw error

      await auditService.logCreate('categories', data.id, data, {
        action_type: 'category_created',
        reason: 'New category added'
      })
      
      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'INSERT',
        table_name: 'categories',
        record_id: 'failed',
        new_values: category,
        metadata: {
          action_type: 'failed_category_creation',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  async update(id: string, updates: Partial<{ name: string; description: string; color: string }>) {
    try {
      const oldData = await this.getById(id)
      
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      await auditService.logUpdate('categories', id, oldData, data, {
        action_type: 'category_updated',
        reason: 'Category information modified'
      })
      
      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'UPDATE',
        table_name: 'categories',
        record_id: id,
        new_values: updates,
        metadata: {
          action_type: 'failed_category_update',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  async delete(id: string) {
    try {
      const oldData = await this.getById(id)
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      await auditService.logDelete('categories', id, oldData, {
        action_type: 'category_deleted',
        reason: 'Category removed from system'
      })
    } catch (error) {
      await auditService.logOperation({
        operation: 'DELETE',
        table_name: 'categories',
        record_id: id,
        metadata: {
          action_type: 'failed_category_deletion',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }
}

// Enhanced inventory service with comprehensive audit logging
export const auditedInventoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
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
  },

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
  }) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([item])
        .select(`
          *,
          categories (id, name, color),
          locations (id, name, address)
        `)
        .single()
      
      if (error) throw error

      await auditService.logCreate('inventory', data.id, data, {
        action_type: 'inventory_item_created',
        reason: 'New inventory item added',
        notes: `Item: ${item.name} (SKU: ${item.sku})`
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
        }
      })
      throw error
    }
  },

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
  }>) {
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

      await auditService.logUpdate('inventory', id, oldData, data, metadata)
      
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
        }
      })
      throw error
    }
  },

  async delete(id: string) {
    try {
      const oldData = await this.getById(id)
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      await auditService.logDelete('inventory', id, oldData, {
        action_type: 'inventory_item_deleted',
        reason: 'Inventory item removed from system',
        notes: `Deleted item: ${oldData.name} (SKU: ${oldData.sku})`
      })
    } catch (error) {
      await auditService.logOperation({
        operation: 'DELETE',
        table_name: 'inventory',
        record_id: id,
        metadata: {
          action_type: 'failed_inventory_deletion',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  // Bulk operations with comprehensive logging
  async bulkUpdate(items: Array<{ id: string; updates: any }>) {
    const results = []
    const bulk_operation_id = `bulk_update_${Date.now()}`

    for (const { id, updates } of items) {
      try {
        const result = await this.update(id, updates)
        results.push({ id, success: true, data: result })
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // Log bulk operation summary
    await auditService.logOperation({
      operation: 'BULK_OPERATION',
      table_name: 'inventory',
      record_id: bulk_operation_id,
      metadata: {
        action_type: 'bulk_inventory_update',
        bulk_operation_id,
        total_items: items.length,
        successful_items: results.filter(r => r.success).length,
        failed_items: results.filter(r => !r.success).length,
        reason: 'Bulk inventory update operation'
      }
    })

    return results
  },

  async bulkDelete(ids: string[]) {
    const results = []
    const bulk_operation_id = `bulk_delete_${Date.now()}`

    for (const id of ids) {
      try {
        await this.delete(id)
        results.push({ id, success: true })
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // Log bulk operation summary
    await auditService.logOperation({
      operation: 'BULK_OPERATION',
      table_name: 'inventory',
      record_id: bulk_operation_id,
      metadata: {
        action_type: 'bulk_inventory_delete',
        bulk_operation_id,
        total_items: ids.length,
        successful_items: results.filter(r => r.success).length,
        failed_items: results.filter(r => !r.success).length,
        reason: 'Bulk inventory deletion operation'
      }
    })

    return results
  }
}

// Enhanced location service with audit logging
export const auditedLocationService = {
  async getAll() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(location: { name: string; address?: string }) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([location])
        .select()
        .single()
      
      if (error) throw error

      await auditService.logCreate('locations', data.id, data, {
        action_type: 'location_created',
        reason: 'New location added'
      })
      
      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'INSERT',
        table_name: 'locations',
        record_id: 'failed',
        new_values: location,
        metadata: {
          action_type: 'failed_location_creation',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  async update(id: string, updates: Partial<{ name: string; address: string }>) {
    try {
      const oldData = await this.getById(id)
      
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      await auditService.logUpdate('locations', id, oldData, data, {
        action_type: 'location_updated',
        reason: 'Location information modified'
      })
      
      return data
    } catch (error) {
      await auditService.logOperation({
        operation: 'UPDATE',
        table_name: 'locations',
        record_id: id,
        new_values: updates,
        metadata: {
          action_type: 'failed_location_update',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  },

  async delete(id: string) {
    try {
      const oldData = await this.getById(id)
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      await auditService.logDelete('locations', id, oldData, {
        action_type: 'location_deleted',
        reason: 'Location removed from system'
      })
    } catch (error) {
      await auditService.logOperation({
        operation: 'DELETE',
        table_name: 'locations',
        record_id: id,
        metadata: {
          action_type: 'failed_location_deletion',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw error
    }
  }
}