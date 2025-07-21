import { supabase } from './supabase'

// User operations
export const userService = {
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
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{ email: string; name: string; role: string; status: string; is_active: boolean }>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Role operations
export const roleService = {
  async getAll() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(role: { name: string; description?: string; permissions: string[] }) {
    const { data, error } = await supabase
      .from('roles')
      .insert([role])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{ name: string; description: string; permissions: string[] }>) {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Category operations
export const categoryService = {
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
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{ name: string; description: string; color: string }>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Location operations
export const locationService = {
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

  async create(location: { name: string; address?: string; type: string; capacity?: number }) {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{ name: string; address: string; type: string; capacity: number }>) {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Inventory operations
export const inventoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, type)
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
        locations (id, name, type)
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
    const { data, error } = await supabase
      .from('inventory')
      .insert([item])
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, type)
      `)
      .single()
    
    if (error) throw error
    return data
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
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, type)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, type)
      `)
      .filter('quantity', 'lte', 'min_stock')
      .eq('status', 'active')
    
    if (error) throw error
    return data
  },

  async getByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, type)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
    
    if (error) throw error
    return data
  },

  async getByLocation(locationId: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, type)
      `)
      .eq('location_id', locationId)
      .eq('status', 'active')
    
    if (error) throw error
    return data
  }
}

// Audit log operations
export const auditService = {
  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users (id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async create(log: {
    user_id: string
    action: string
    table_name: string
    record_id: string
    old_values?: any
    new_values?: any
  }) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([log])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByUser(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users (id, name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async getByTable(tableName: string, limit = 20) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users (id, name, email)
      `)
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

// Dashboard analytics
export const analyticsService = {
  async getDashboardMetrics() {
    // Get total inventory count
    const { count: totalItems } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get low stock items count
    const { data: lowStockItems } = await supabase
      .from('inventory')
      .select('quantity, min_stock')
      .eq('status', 'active')

    const lowStockCount = lowStockItems?.filter(item => item.quantity <= item.min_stock).length || 0

    // Get total value
    const { data: inventoryValues } = await supabase
      .from('inventory')
      .select('quantity, unit_price')
      .eq('status', 'active')

    const totalValue = inventoryValues?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0

    // Get categories count
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Get locations count
    const { count: locationsCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })

    return {
      totalItems: totalItems || 0,
      lowStockCount,
      totalValue,
      categoriesCount: categoriesCount || 0,
      locationsCount: locationsCount || 0
    }
  },

  async getInventoryByCategory() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        quantity,
        categories (name, color)
      `)
      .eq('status', 'active')

    if (error) throw error

    const categoryData = data?.reduce((acc: any, item: any) => {
      const categoryName = item.categories?.name || 'Unknown'
      const categoryColor = item.categories?.color || '#gray'
      
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, value: 0, color: categoryColor }
      }
      acc[categoryName].value += item.quantity
      return acc
    }, {})

    return Object.values(categoryData || {})
  },

  async getRecentActivity() {
    return await auditService.getAll(10)
  }
}