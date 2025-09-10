import { createClient } from './supabase/client'

// Use browser client for database operations (compatible with both server and client)
const supabase = createClient()

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
    unit_of_measure?: string
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
    unit_of_measure: string
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
    // Use a more efficient approach: fetch all active inventory and filter client-side
    // This avoids the PostgREST column comparison limitation
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('status', 'active')
    
    if (error) throw error
    
    // Filter items where quantity <= min_stock on the client side
    return data?.filter((item: any) => item.quantity <= item.min_stock) || []
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

    const lowStockCount = lowStockItems?.filter((item: any) => item.quantity <= item.min_stock).length || 0

    // Get total value
    const { data: inventoryValues } = await supabase
      .from('inventory')
      .select('quantity, unit_price')
      .eq('status', 'active')

    const totalValue = inventoryValues?.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0) || 0

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
      const itemValues = inventoryData?.map((item: any) => ({
        ...item,
        totalValue: item.quantity * item.unit_price
      })) || []

      // Sort by value descending
      itemValues.sort((a: any, b: any) => b.totalValue - a.totalValue)

      const totalValue = itemValues.reduce((sum: number, item: any) => sum + item.totalValue, 0)
      const totalItems = itemValues.length

      let cumulativeValue = 0
      let aItems = 0, bItems = 0, cItems = 0
      let aRevenue = 0, bRevenue = 0, cRevenue = 0

      itemValues.forEach((item: any, index: number) => {
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
      
      salesData?.forEach((transaction: any) => {
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
        
        const totalItems = transaction.transaction_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
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
      
      productSales?.forEach((item: any) => {
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
  ,
  async getFinancialTrends(months: number = 7) {
    try {
      const endDate = new Date()
      const start = new Date(endDate.getFullYear(), endDate.getMonth() - (months - 1), 1)

      const { data: txs, error } = await supabase
        .from('transactions')
        .select('id, type, total, created_at, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('type', ['sale', 'stock_addition'])
        .eq('status', 'completed')

      if (error) throw error

      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = (d: Date) => d.toLocaleString('en', { month: 'short' })

      const monthsRange: { key: string; date: Date }[] = []
      for (let i = 0; i < months; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
        monthsRange.push({ key: monthKey(d), date: d })
      }

      const aggregates: Record<string, { revenue: number; expenses: number }> = {}
      monthsRange.forEach(({ key }) => (aggregates[key] = { revenue: 0, expenses: 0 }))

      txs?.forEach((t: any) => {
        const d = new Date(t.created_at)
        const key = monthKey(d)
        if (!aggregates[key]) aggregates[key] = { revenue: 0, expenses: 0 }
        if (t.type === 'sale') aggregates[key].revenue += Number(t.total) || 0
        if (t.type === 'stock_addition') aggregates[key].expenses += Number(t.total) || 0
      })

      const result = monthsRange.map(({ key, date }) => {
        const revenue = Math.round(aggregates[key].revenue)
        const expenses = Math.round(aggregates[key].expenses)
        const profit = revenue - expenses
        const cashFlow = profit
        const roi = expenses > 0 ? Math.round((profit / expenses) * 1000) / 10 : 0
        return {
          month: monthLabel(date),
          revenue,
          expenses,
          profit,
          cashFlow,
          roi
        }
      })

      return result
    } catch (error) {
      console.error('Error calculating financial trends:', error)
      return []
    }
  }
  ,
  async getExpenseBreakdown(monthDate?: Date) {
    try {
      const now = monthDate ? new Date(monthDate) : new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      const { data: purchaseItems } = await supabase
        .from('transaction_items')
        .select(
          `product_id, quantity, unit_price, transaction_id,
           transactions!inner (id, type, created_at)`
        )
        .eq('transactions.type', 'stock_addition')
        .gte('transactions.created_at', monthStart.toISOString())
        .lte('transactions.created_at', monthEnd.toISOString())

      const productIds = Array.from(
        new Set((purchaseItems || []).map((i: any) => String(i.product_id)).filter(Boolean))
      )

      let inventoryIndex: Record<string, { category: string }> = {}
      if (productIds.length > 0) {
        const { data: inv } = await supabase
          .from('inventory')
          .select('id, categories ( name )')
          .in('id', productIds)

        inv?.forEach((it: any) => {
          inventoryIndex[it.id] = { category: it.categories?.name || 'Other' }
        })
      }

      const byCategory: Record<string, { amount: number }> = {}
      purchaseItems?.forEach((it: any) => {
        const cat = inventoryIndex[it.product_id]?.category || 'Other'
        const amount = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
        if (!byCategory[cat]) byCategory[cat] = { amount: 0 }
        byCategory[cat].amount += amount
      })

      const total = Object.values(byCategory).reduce((s, v) => s + v.amount, 0)
      const breakdown = Object.entries(byCategory)
        .map(([category, v], i) => ({
          category,
          amount: Math.round(v.amount),
          percentage: total > 0 ? Math.round((v.amount / total) * 100) : 0,
          color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6366f1', '#22c55e'][i % 7]
        }))
        .sort((a, b) => b.amount - a.amount)

      return breakdown
    } catch (error) {
      console.error('Error calculating expense breakdown:', error)
      return []
    }
  }
  ,
  async getFinancialKpis() {
    try {
      const trends = await this.getFinancialTrends(2)
      const current = trends[trends.length - 1] || { revenue: 0, expenses: 0, profit: 0, cashFlow: 0, roi: 0 }
      const previous = trends[trends.length - 2] || { revenue: 0, profit: 0 }

      const revenueGrowth = previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0
      const profitGrowth = previous.profit > 0 ? ((current.profit - previous.profit) / previous.profit) * 100 : 0
      const grossProfitMargin = current.revenue > 0 ? (current.profit / current.revenue) * 100 : 0

      // Approximate inventory turnover: average of category turnover
      const turnoverByCategory = await this.getInventoryTurnoverByCategory()
      const inventoryTurnover = turnoverByCategory.length
        ? Math.round((turnoverByCategory.reduce((s, c: any) => s + (Number(c.turnover) || 0), 0) / turnoverByCategory.length) * 10) / 10
        : 0

      return {
        current,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        profitGrowth: Math.round(profitGrowth * 10) / 10,
        grossProfitMargin: Math.round(grossProfitMargin * 10) / 10,
        inventoryTurnover,
        roi: current.roi,
      }
    } catch (error) {
      console.error('Error calculating financial KPIs:', error)
      return {
        current: { revenue: 0, expenses: 0, profit: 0, cashFlow: 0, roi: 0 },
        revenueGrowth: 0,
        profitGrowth: 0,
        grossProfitMargin: 0,
        inventoryTurnover: 0,
        roi: 0
      }
    }
  }
  ,
  async getLocationPerformance() {
    try {
      // Fetch base entities
      const [{ data: locations }, { data: inventoryData }, { data: saleItems }] = await Promise.all([
        supabase.from('locations').select('id, name'),
        supabase
          .from('inventory')
          .select('id, location_id, quantity, min_stock, max_stock, unit_price')
          .eq('status', 'active'),
        supabase
          .from('transaction_items')
          .select(
            `id, product_id, quantity, unit_price, transaction_id,
             transactions!inner (id, type, created_at)`
          )
          .eq('transactions.type', 'sale')
      ])

      const locationIndex: Record<string, { id: string; name: string }> = {}
      locations?.forEach((loc: any) => {
        locationIndex[loc.id] = { id: loc.id, name: loc.name }
      })

      const inventoryById: Record<string, any> = {}
      const perLocation: Record<
        string,
        {
          id: string
          name: string
          revenue: number
          ordersSet: Set<string>
          totalSold: number
          quantitySum: number
          maxStockSum: number
        }
      > = {}

      inventoryData?.forEach((inv: any) => {
        inventoryById[inv.id] = inv
        if (!perLocation[inv.location_id]) {
          const locName = locationIndex[inv.location_id]?.name || 'Unknown'
          perLocation[inv.location_id] = {
            id: inv.location_id,
            name: locName,
            revenue: 0,
            ordersSet: new Set<string>(),
            totalSold: 0,
            quantitySum: 0,
            maxStockSum: 0
          }
        }
        perLocation[inv.location_id].quantitySum += Number(inv.quantity) || 0
        perLocation[inv.location_id].maxStockSum += Number(inv.max_stock) || 0
      })

      saleItems?.forEach((item: any) => {
        const inv = inventoryById[item.product_id]
        if (!inv) return
        const locId = inv.location_id
        if (!perLocation[locId]) {
          const locName = locationIndex[locId]?.name || 'Unknown'
          perLocation[locId] = {
            id: locId,
            name: locName,
            revenue: 0,
            ordersSet: new Set<string>(),
            totalSold: 0,
            quantitySum: 0,
            maxStockSum: 0
          }
        }
        perLocation[locId].revenue += (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
        if (item.transaction_id) perLocation[locId].ordersSet.add(String(item.transaction_id))
        perLocation[locId].totalSold += Number(item.quantity) || 0
      })

      const results = Object.values(perLocation).map((loc) => {
        const stockLevel = loc.maxStockSum > 0 ? Math.round((loc.quantitySum / loc.maxStockSum) * 100) : null
        const efficiencyBase = loc.quantitySum > 0 ? (loc.totalSold / loc.quantitySum) * 100 : loc.totalSold > 0 ? 100 : 0
        const efficiency = Math.max(0, Math.min(100, Math.round(efficiencyBase)))
        const utilization = stockLevel ?? 0
        return {
          location: loc.name,
          revenue: Math.round(loc.revenue),
          orders: loc.ordersSet.size,
          efficiency,
          stockLevel: stockLevel ?? 0,
          utilization,
          // Fields not directly tracked; set to null to allow UI to hide or show placeholders
          staffCount: null as number | null,
          avgProcessingTime: null as number | null,
          accuracy: null as number | null
        }
      })

      // Sort by revenue desc for a consistent view
      results.sort((a, b) => b.revenue - a.revenue)

      return results
    } catch (error) {
      console.error('Error calculating location performance:', error)
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

// ============================================================================
// PROJECT MANAGEMENT SERVICES
// ============================================================================

// Project operations
export const projectService = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_items (
          id,
          product_type,
          product_name,
          current_status,
          is_completed
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_items (
          *,
          project_status_history (
            *
          ),
          project_attachments (
            *
          )
        ),
        workflow_items (
          *
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(project: {
    name: string
    description?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    start_date: Date
    expected_end_date?: Date
    created_by: string
  }) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...project,
        status: 'active',
        progress: 0,
        total_items: 0,
        completed_items: 0
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{
    name: string
    description: string
    status: 'active' | 'completed' | 'cancelled' | 'on_hold'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    expected_end_date: string
    actual_end_date: string
    progress: number
    total_items: number
    completed_items: number
  }>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    // Before deleting the project, return LU items back to inventory
    // and remove related project items to maintain referential integrity.
    // 1) Fetch LU project items for this project
    const { data: luItems } = await supabase
      .from('project_items')
      .select('id, product_type, description, quantity')
      .eq('project_id', id)

    if (Array.isArray(luItems) && luItems.length > 0) {
      for (const item of luItems) {
        try {
          if (item?.product_type === 'LU') {
            const description: string = (item as any)?.description || ''
            const match = description.match(/^SKU:\s*(.+)$/)
            const sku = match ? match[1].trim() : null
            if (sku && typeof item.quantity === 'number' && item.quantity > 0) {
              const { data: inv } = await supabase
                .from('inventory')
                .select('id, quantity')
                .eq('sku', sku)
                .single()
              if (inv?.id) {
                await inventoryService.update(inv.id, {
                  quantity: (Number(inv.quantity) || 0) + Number(item.quantity)
                })
              }
            }
          }
        } catch (e) {
          // Continue best-effort restock per item but do not block project deletion
          console.warn('Failed to restock LU item during project delete:', e)
        }
      }
    }

    // 2) Delete project items explicitly
    const { error: piError } = await supabase
      .from('project_items')
      .delete()
      .eq('project_id', id)
    if (piError) throw piError

    // 3) Delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateProgress(id: string) {
    // Get project items count
    const { data: items, error: itemsError } = await supabase
      .from('project_items')
      .select('id, is_completed')
      .eq('project_id', id)
    
    if (itemsError) throw itemsError
    
    const totalItems = items?.length || 0
    const completedItems = items?.filter((item: any) => item.is_completed).length || 0
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    
    // Update project progress
    const { data, error } = await supabase
      .from('projects')
      .update({
        total_items: totalItems,
        completed_items: completedItems,
        progress: progress
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getProjectItems(projectId: string) {
    return await projectItemService.getAll(projectId)
  },

  async addInventoryItemToProject(params: {
    projectId: string
    inventoryId: string
    quantity: number
    unitPrice?: number
    notes?: string
    createdBy: string
  }) {
    const { projectId, inventoryId, quantity, unitPrice, notes = '', createdBy } = params

    if (!projectId) throw new Error('projectId is required')
    if (!inventoryId) throw new Error('inventoryId is required')
    if (!createdBy) throw new Error('createdBy is required')
    if (!quantity || quantity <= 0) throw new Error('quantity must be greater than 0')

    // Fetch inventory item to validate and get details
    const inventoryItem = await inventoryService.getById(inventoryId)
    if (!inventoryItem) throw new Error('Inventory item not found')
    if (typeof inventoryItem.quantity !== 'number') throw new Error('Inventory item has invalid quantity')
    if (inventoryItem.quantity < quantity) throw new Error('Insufficient stock for the requested quantity')

    const resolvedUnitPrice = typeof unitPrice === 'number' ? unitPrice : (inventoryItem.unit_price || 0)

    // Check if this item already exists in the project (by SKU)
    const existingItems = await projectItemService.getAll(projectId)
    const existingItem = existingItems.find((item: any) => 
      item.product_type === 'LU' && 
      item.description === `SKU: ${inventoryItem.sku}`
    )

    let projectItem

    if (existingItem) {
      // Update existing item: increase quantity and recalculate total
      const newQuantity = existingItem.quantity + quantity
      const newTotal = resolvedUnitPrice * newQuantity
      
      console.log(`🔄 Attempting to consolidate ${quantity} units into existing item (${existingItem.quantity} -> ${newQuantity})`)
      
      // Map to database column names - project_items table doesn't have notes field
      const updateData: any = {
        quantity: newQuantity,
        unit_cost: resolvedUnitPrice,  // Database uses unit_cost, not unit_price
        total_cost: newTotal,          // Database uses total_cost, not total_price
      }
      
      console.log('🔧 Update data:', updateData)
      
      const { data, error } = await supabase
        .from('project_items')
        .update(updateData)
        .eq('id', existingItem.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Failed to update existing item:', error)
        throw error
      }
      
      projectItem = data
      console.log(`✅ Successfully consolidated ${quantity} units into existing project item (total: ${newQuantity})`)
    } else {
      // Create new project item with product_type 'LU' (from inventory)
      projectItem = await projectItemService.create({
        project_id: projectId,
        product_type: 'LU',
        product_name: inventoryItem.name,
        product_description: `SKU: ${inventoryItem.sku}`,  // This gets mapped to description in create()
        quantity,
        unit_price: resolvedUnitPrice,
        total_price: resolvedUnitPrice * quantity,
        notes,  // This gets handled in create() function
        created_by: createdBy
      })
      
      console.log(`✅ Created new project item with ${quantity} units`)
    }

    // Decrease stock from inventory
    await inventoryService.update(inventoryId, {
      quantity: Math.max(0, (inventoryItem.quantity as number) - quantity)
    })

    return projectItem
  }
}

// Project item operations
export const projectItemService = {
  async getAll(projectId?: string) {
    let query = supabase
      .from('project_items')
      .select(`
        *,
        project_status_history (
          *
        ),
        project_attachments (
          *
        )
      `)
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('project_items')
      .select(`
        *,
        project_status_history (
          *
        ),
        project_attachments (
          *
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(item: {
    project_id: string
    product_type: 'LU' | 'CL' | 'MP'
    product_name: string
    product_description?: string
    quantity: number
    unit_price?: number
    total_price?: number
    inventory_item_id?: string
    supplier_name?: string
    supplier_contact_info?: string
    supplier_email?: string
    supplier_phone?: string
    expected_delivery?: Date
    notes?: string
    created_by: string
  }) {
    // Determine initial status based on product type (must satisfy DB check constraint)
    // Allowed values: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
    let initialStatus: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
    switch (item.product_type) {
      case 'LU':
        initialStatus = 'completed'
        break
      case 'CL':
      case 'MP':
        initialStatus = 'pending'
        break
      default:
        initialStatus = 'pending'
    }
    
    // Map to database columns
    const insertRecord: any = {
      project_id: item.project_id,
      product_type: item.product_type,
      product_name: item.product_name,
      description: item.product_description,
      quantity: item.quantity,
      unit_cost: item.unit_price,
      total_cost: item.total_price,
      current_status: initialStatus,
      is_completed: item.product_type === 'LU',
      created_by: item.created_by
    }

    const { data, error } = await supabase
      .from('project_items')
      .insert([insertRecord])
      .select()
      .single()
    
    if (error) throw error
    
    // Create initial status history
    await this.createStatusHistory({
      project_item_id: data.id,
      to_status: initialStatus,
      changed_by: item.created_by,
      changed_by_name: 'System', // This should be the actual user name
      notes: 'Item created'
    })
    
    // Update project progress
    await projectService.updateProgress(item.project_id)
    
    return data
  },

  async update(id: string, updates: Partial<{
    product_name: string
    product_description: string
    quantity: number
    unit_price: number
    total_price: number
    quotation_amount: number
    quotation_paid: Date
    shipping_cost: number
    supplier_pi_amount: number
    supplier_pi_paid: Date
    customs_duty_amount: number
    customs_duty_paid: Date
    is_air_shipping: boolean
    expected_delivery: Date
    actual_delivery: Date
    notes: string
  }>) {
    const { data, error } = await supabase
      .from('project_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(id: string, newStatus: string, userId: string, userName: string, notes?: string, costIncurred?: number) {
    // Get current item
    const { data: item, error: itemError } = await supabase
      .from('project_items')
      .select('current_status, project_id, product_type')
      .eq('id', id)
      .single()
    
    if (itemError) throw itemError
    
    const oldStatus = item.current_status
    const isCompleted = newStatus === 'completed'
    
    // Update item status
    const { data, error } = await supabase
      .from('project_items')
      .update({
        current_status: newStatus,
        is_completed: isCompleted,
        completed_date: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Create status history record
    await this.createStatusHistory({
      project_item_id: id,
      from_status: oldStatus,
      to_status: newStatus,
      changed_by: userId,
      changed_by_name: userName,
      notes,
      cost_incurred: costIncurred
    })
    
    // Update project progress
    await projectService.updateProgress(item.project_id)
    
    return data
  },

  async createStatusHistory(history: {
    project_item_id: string
    from_status?: string
    to_status: string
    changed_by: string
    changed_by_name: string
    notes?: string
    cost_incurred?: number
    estimated_cost?: number
    actual_cost?: number
  }) {
    const { data, error } = await supabase
      .from('project_status_history')
      .insert([{
        project_item_id: history.project_item_id,
        old_status: history.from_status,
        new_status: history.to_status,
        changed_by: history.changed_by,
        changed_by_name: history.changed_by_name,
        notes: history.notes,
        cost_incurred: history.cost_incurred,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    // Get item details before deletion for restock logic and project progress
    const { data: item } = await supabase
      .from('project_items')
      .select('id, project_id, product_type, description, quantity')
      .eq('id', id)
      .single()

    // If LU item: return quantity to inventory by matching SKU in description
    if (item && item.product_type === 'LU') {
      try {
        const description: string = (item as any)?.description || ''
        const match = description.match(/^SKU:\s*(.+)$/)
        const sku = match ? match[1].trim() : null
        if (sku && typeof item.quantity === 'number' && item.quantity > 0) {
          const { data: inv } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('sku', sku)
            .single()
          if (inv?.id) {
            await inventoryService.update(inv.id, {
              quantity: (Number(inv.quantity) || 0) + Number(item.quantity)
            })
          }
        }
      } catch (e) {
        console.warn('Failed to restock LU item on delete:', e)
      }
    }

    // Proceed to delete the project item
    const { error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', id)
    if (error) throw error

    // Update project progress if item existed
    if (item?.project_id) {
      await projectService.updateProgress(item.project_id)
    }
  }
}

// Project attachment operations
export const projectAttachmentService = {
  async getAll(projectId?: string, projectItemId?: string) {
    let query = supabase
      .from('project_attachments')
      .select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    if (projectItemId) {
      query = query.eq('project_item_id', projectItemId)
    }
    
    const { data, error } = await query.order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(attachment: {
    project_id?: string
    project_item_id?: string
    file_name: string
    file_url: string
    file_type: string
    file_size: number
    category: 'quotation' | 'invoice' | 'receipt' | 'shipping_label' | 'customs_document' | 'photo' | 'other'
    description?: string
    uploaded_by: string
    uploaded_by_name: string
  }) {
    const { data, error } = await supabase
      .from('project_attachments')
      .insert([{
        ...attachment,
        uploaded_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('project_attachments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Project analytics and metrics
export const projectAnalyticsService = {
  async getProjectMetrics() {
    // Get project counts by status
    const { data: projects } = await supabase
      .from('projects')
      .select('status')
    
    const projectCounts = projects?.reduce((acc: any, project: any) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {}) || {}
    
    // Get item counts by type and status
    const { data: items } = await supabase
      .from('project_items')
      .select('product_type, current_status, is_completed')
    
    const itemMetrics = items?.reduce((acc: any, item: any) => {
      const type = item.product_type.toLowerCase()
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0, pending: 0 }
      }
      acc[type].total++
      if (item.is_completed) {
        acc[type].completed++
      } else {
        acc[type].pending++
      }
      return acc
    }, {}) || {}
    
    // Financial data removed - no longer tracking budget/costs
    
    return {
      totalProjects: projects?.length || 0,
      activeProjects: projectCounts.active || 0,
      completedProjects: projectCounts.completed || 0,
      onHoldProjects: projectCounts.on_hold || 0,
      cancelledProjects: projectCounts.cancelled || 0,
      luItems: itemMetrics.lu || { total: 0, completed: 0, pending: 0 },
      clItems: itemMetrics.cl || { total: 0, completed: 0, pending: 0 },
      mpItems: itemMetrics.mp || { total: 0, completed: 0, pending: 0 }
    }
  },

  async getRecentActivity(limit = 10) {
    const { data, error } = await supabase
      .from('project_status_history')
      .select(`
        *,
        project_items!inner (
          product_name,
          projects!inner (
            name
          )
        )
      `)
      .order('change_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

// Workflow item operations
export const workflowItemService = {
  async getAll(projectId?: string) {
    let query = supabase
      .from('workflow_items')
      .select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('workflow_items')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(item: {
    project_id: string
    product_type: 'CL' | 'IMP'
    product_name: string
    current_step: string
    step_data: Record<string, any>
    created_by: string
  }) {
    // Generate a unique ID for the workflow item
    const workflowId = `${item.product_type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase
      .from('workflow_items')
      .insert([{
        id: workflowId,
        project_id: item.project_id,
        product_type: item.product_type,
        product_name: item.product_name,
        current_step: item.current_step,
        step_data: item.step_data,
        created_by: item.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{
    current_step: string
    step_data: Record<string, any>
    product_name: string
  }>) {
    const { data, error } = await supabase
      .from('workflow_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('workflow_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return data
  }
}