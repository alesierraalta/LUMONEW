'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, FolderOpen } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

// Mock data - in a real app, this would come from an API
const mockMetrics = {
  totalItems: 1247,
  totalValue: 125430.50,
  lowStockItems: 23,
  categoriesCount: 12
}

export function MetricsCards() {
  const metrics = [
    {
      title: 'Total Items',
      value: formatNumber(mockMetrics.totalItems),
      description: 'Items in inventory',
      icon: Package,
      trend: '+12% from last month'
    },
    {
      title: 'Total Value',
      value: formatCurrency(mockMetrics.totalValue),
      description: 'Inventory value',
      icon: DollarSign,
      trend: '+8% from last month'
    },
    {
      title: 'Low Stock',
      value: formatNumber(mockMetrics.lowStockItems),
      description: 'Items need restocking',
      icon: AlertTriangle,
      trend: '-5% from last month',
      isAlert: true
    },
    {
      title: 'Categories',
      value: formatNumber(mockMetrics.categoriesCount),
      description: 'Product categories',
      icon: FolderOpen,
      trend: 'No change'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index} className={metric.isAlert ? 'border-yellow-200 bg-yellow-50/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.isAlert ? 'text-yellow-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
            <p className={`text-xs mt-1 ${
              metric.trend.includes('+') ? 'text-green-600' : 
              metric.trend.includes('-') ? 'text-red-600' : 
              'text-muted-foreground'
            }`}>
              {metric.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}