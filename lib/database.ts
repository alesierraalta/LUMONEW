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

  async create(location: { name: string; address?: string }) {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{ name: string; address: string }>) {
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
        locations (id, name, address)
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
        locations (id, name, address)
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
        locations (id, name, address)
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
        locations (id, name, address)
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
  },

  // Enhanced analytics for dashboard charts
  async getInventoryTurnoverByCategory() {
    try {
      // Get inventory data with categories and calculate turnover
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select(`
          id,
          name,
          quantity,
          unit_price,
          categories!inner (name, color)
        `)
        .eq('status', 'active')

      if (error) throw error

      // Get transaction data for turnover calculation
      const { data: transactionData } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          product_id,
          transactions!inner (
            type,
            created_at
          )
        `)
        .eq('transactions.type', 'sale')
        .gte('transactions.created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year

      // Calculate turnover by category
      const categoryTurnover: Record<string, any> = {}
      
      inventoryData?.forEach((item: any) => {
        const categoryName = item.categories?.name || 'Unknown'
        const categoryColor = item.categories?.color || '#gray'
        
        if (!categoryTurnover[categoryName]) {
          categoryTurnover[categoryName] = {
            category: categoryName,
            color: categoryColor,
            totalInventory: 0,
            totalSold: 0,
            revenue: 0,
            items: 0
          }
        }
        
        categoryTurnover[categoryName].totalInventory += item.quantity
        categoryTurnover[categoryName].revenue += item.quantity * item.unit_price
        categoryTurnover[categoryName].items += 1
      })

      // Add sales data
      transactionData?.forEach((transaction: any) => {
        const item = inventoryData?.find((inv: any) => inv.id === transaction.product_id)
        if (item?.categories && typeof item.categories === 'object' && 'name' in item.categories) {
          const categoryName = String(item.categories.name)
          if (categoryTurnover[categoryName]) {
            categoryTurnover[categoryName].totalSold += transaction.quantity
          }
        }
      })

      // Calculate turnover rate (times per year)
      const turnoverData = Object.values(categoryTurnover).map((cat: any) => ({
        category: cat.category,
        turnover: cat.totalInventory > 0 ? (cat.totalSold / cat.totalInventory) * 4 : 0, // Quarterly to annual
        revenue: cat.revenue,
        items: cat.items,
        color: cat.color
      }))

      return turnoverData
    } catch (error) {
      console.error('Error calculating inventory turnover:', error)
      return []
    }
  },

  async getABCAnalysis() {
    try {
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select('id, name, quantity, unit_price')
        .eq('status', 'active')

      if (error) throw error

      // Calculate total value for each item
      const itemValues = inventoryData?.map(item => ({
        ...item,
        totalValue: item.quantity * item.unit_price
      })) || []

      // Sort by value descending
      itemValues.sort((a, b) => b.totalValue - a.totalValue)

      const totalValue = itemValues.reduce((sum, item) => sum + item.totalValue, 0)
      const totalItems = itemValues.length

      let cumulativeValue = 0
      let aItems = 0, bItems = 0, cItems = 0
      let aRevenue = 0, bRevenue = 0, cRevenue = 0

      itemValues.forEach((item, index) => {
        cumulativeValue += item.totalValue
        const cumulativePercentage = (cumulativeValue / totalValue) * 100

        if (cumulativePercentage <= 80) {
          aItems++
          aRevenue += item.totalValue
        } else if (cumulativePercentage <= 95) {
          bItems++
          bRevenue += item.totalValue
        } else {
          cItems++
          cRevenue += item.totalValue
        }
      })

      return [
        {
          name: 'A Items (High Value)',
          value: Math.round((aItems / totalItems) * 100),
          count: aItems,
          revenue: Math.round((aRevenue / totalValue) * 100),
          color: '#22c55e'
        },
        {
          name: 'B Items (Medium Value)',
          value: Math.round((bItems / totalItems) * 100),
          count: bItems,
          revenue: Math.round((bRevenue / totalValue) * 100),
          color: '#f59e0b'
        },
        {
          name: 'C Items (Low Value)',
          value: Math.round((cItems / totalItems) * 100),
          count: cItems,
          revenue: Math.round((cRevenue / totalValue) * 100),
          color: '#ef4444'
        }
      ]
    } catch (error) {
      console.error('Error calculating ABC analysis:', error)
      return []
    }
  },

  async getSalesVelocityData() {
    try {
      // Get sales data for the last 8 weeks
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (8 * 7 * 24 * 60 * 60 * 1000))

      const { data: salesData, error } = await supabase
        .from('transactions')
        .select(`
          id,
          total,
          created_at,
          transaction_items (quantity, unit_price)
        `)
        .eq('type', 'sale')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      // Group by week
      const weeklyData: Record<string, any> = {}
      
      salesData?.forEach(transaction => {
        const date = new Date(transaction.created_at)
        const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        const weekKey = `W${Math.ceil((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            week: weekKey,
            velocity: 0,
            avgOrderValue: 0,
            totalRevenue: 0,
            orderCount: 0,
            totalItems: 0
          }
        }
        
        const totalItems = transaction.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
        weeklyData[weekKey].velocity += totalItems
        weeklyData[weekKey].totalRevenue += transaction.total
        weeklyData[weekKey].orderCount += 1
        weeklyData[weekKey].totalItems += totalItems
      })

      // Calculate averages and conversion rates
      const velocityData = Object.values(weeklyData).map((week: any) => ({
        week: week.week,
        velocity: week.velocity,
        avgOrderValue: week.orderCount > 0 ? Math.round(week.totalRevenue / week.orderCount) : 0,
        conversionRate: Math.random() * 2 + 3, // Mock conversion rate - would need web analytics integration
        profit: Math.round(week.totalRevenue * 0.25) // Assuming 25% profit margin
      }))

      return velocityData.sort((a, b) => a.week.localeCompare(b.week))
    } catch (error) {
      console.error('Error calculating sales velocity:', error)
      return []
    }
  },

  async getTopPerformingProducts() {
    try {
      const { data: productSales, error } = await supabase
        .from('transaction_items')
        .select(`
          product_name,
          quantity,
          unit_price,
          transactions!inner (
            type,
            created_at
          )
        `)
        .eq('transactions.type', 'sale')
        .gte('transactions.created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (error) throw error

      // Group by product and calculate metrics
      const productMetrics: Record<string, any> = {}
      
      productSales?.forEach(item => {
        if (!productMetrics[item.product_name]) {
          productMetrics[item.product_name] = {
            name: item.product_name,
            totalSold: 0,
            revenue: 0,
            avgPrice: 0
          }
        }
        
        productMetrics[item.product_name].totalSold += item.quantity
        productMetrics[item.product_name].revenue += item.quantity * item.unit_price
      })

      // Calculate velocity and profit margin
      const topProducts = Object.values(productMetrics)
        .map((product: any) => ({
          name: product.name,
          velocity: Math.round(product.totalSold / 4), // Weekly average
          profit: Math.round(Math.random() * 30 + 20), // Mock profit margin 20-50%
          trend: Math.random() > 0.7 ? 'down' : Math.random() > 0.3 ? 'up' : 'stable'
        }))
        .sort((a, b) => b.velocity - a.velocity)
        .slice(0, 5)

      return topProducts
    } catch (error) {
      console.error('Error getting top performing products:', error)
      return []
    }
  },

  async getProfitMarginByCategory() {
    try {
      const { data: categoryData, error } = await supabase
        .from('inventory')
        .select(`
          unit_price,
          quantity,
          categories!inner (name)
        `)
        .eq('status', 'active')

      if (error) throw error

      // Group by category and calculate margins
      const categoryMargins: Record<string, any> = {}
      
      categoryData?.forEach((item: any) => {
        const categoryName = item.categories?.name || 'Unknown'
        
        if (!categoryMargins[categoryName]) {
          categoryMargins[categoryName] = {
            category: categoryName,
            totalRevenue: 0,
            totalCost: 0,
            itemCount: 0
          }
        }
        
        const revenue = item.unit_price * item.quantity
        const cost = revenue * (0.6 + Math.random() * 0.2) // Mock cost 60-80% of revenue
        
        categoryMargins[categoryName].totalRevenue += revenue
        categoryMargins[categoryName].totalCost += cost
        categoryMargins[categoryName].itemCount += 1
      })

      const profitData = Object.values(categoryMargins).map((cat: any) => ({
        category: cat.category,
        margin: cat.totalRevenue > 0 ? Math.round(((cat.totalRevenue - cat.totalCost) / cat.totalRevenue) * 100) : 0,
        revenue: Math.round(cat.totalRevenue),
        cost: Math.round(cat.totalCost)
      }))

      return profitData
    } catch (error) {
      console.error('Error calculating profit margins:', error)
      return []
    }
  }
}

// Transaction operations
export const transactionService = {
  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price,
          notes
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price,
          notes
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(transaction: {
    type: 'sale' | 'stock_addition'
    subtotal: number
    tax: number
    tax_rate: number
    total: number
    notes?: string
    created_by: string
    status?: 'completed' | 'pending' | 'cancelled'
    line_items: {
      product_id: string
      product_sku: string
      product_name: string
      quantity: number
      unit_price: number
      total_price: number
      notes?: string
    }[]
  }) {
    const { line_items, ...transactionData } = transaction
    
    // Start a transaction
    const { data: newTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        status: transactionData.status || 'completed'
      }])
      .select()
      .single()
    
    if (transactionError) throw transactionError
    
    // Insert line items
    const lineItemsWithTransactionId = line_items.map(item => ({
      ...item,
      transaction_id: newTransaction.id
    }))
    
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(lineItemsWithTransactionId)
    
    if (itemsError) throw itemsError
    
    // Return the complete transaction with items
    return await this.getById(newTransaction.id)
  },

  async update(id: string, updates: Partial<{
    type: 'sale' | 'stock_addition'
    subtotal: number
    tax: number
    tax_rate: number
    total: number
    notes: string
    status: 'completed' | 'pending' | 'cancelled'
  }>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    // Delete transaction items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .delete()
      .eq('transaction_id', id)
    
    if (itemsError) throw itemsError
    
    // Delete the transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getByDateRange(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price,
          notes
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getByType(type: 'sale' | 'stock_addition', limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price,
          notes
        )
      `)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async getByUser(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price,
          notes
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async deleteAll() {
    // Delete all transaction items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (itemsError) throw itemsError
    
    // Delete all transactions
    const { error } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (error) throw error
  }
}