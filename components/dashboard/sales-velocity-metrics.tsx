'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TrendingUp, DollarSign, Zap, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock data for sales velocity
const salesVelocityData = [
  { week: 'W1', velocity: 45, avgOrderValue: 125, conversionRate: 3.2, profit: 28 },
  { week: 'W2', velocity: 52, avgOrderValue: 138, conversionRate: 3.8, profit: 32 },
  { week: 'W3', velocity: 48, avgOrderValue: 142, conversionRate: 3.5, profit: 35 },
  { week: 'W4', velocity: 61, avgOrderValue: 156, conversionRate: 4.1, profit: 38 },
  { week: 'W5', velocity: 58, avgOrderValue: 149, conversionRate: 3.9, profit: 36 },
  { week: 'W6', velocity: 67, avgOrderValue: 162, conversionRate: 4.3, profit: 42 },
  { week: 'W7', velocity: 72, avgOrderValue: 168, conversionRate: 4.6, profit: 45 },
  { week: 'W8', velocity: 69, avgOrderValue: 171, conversionRate: 4.4, profit: 47 }
]

// Top performing products by velocity
const topProducts = [
  { name: 'Wireless Headphones', velocity: 85, profit: 45, trend: 'up' },
  { name: 'Smart Watch', velocity: 78, profit: 52, trend: 'up' },
  { name: 'Laptop Stand', velocity: 72, profit: 38, trend: 'stable' },
  { name: 'USB-C Hub', velocity: 68, profit: 42, trend: 'up' },
  { name: 'Bluetooth Speaker', velocity: 65, profit: 35, trend: 'down' }
]

// Profit margin by category
const profitMarginData = [
  { category: 'Electronics', margin: 25.5, revenue: 45000, cost: 33525 },
  { category: 'Accessories', margin: 42.8, revenue: 28000, cost: 16016 },
  { category: 'Software', margin: 68.2, revenue: 22000, cost: 6996 },
  { category: 'Hardware', margin: 18.3, revenue: 38000, cost: 31054 },
  { category: 'Services', margin: 75.0, revenue: 15000, cost: 3750 }
]

export function SalesVelocityMetrics() {
  const currentVelocity = salesVelocityData[salesVelocityData.length - 1].velocity
  const previousVelocity = salesVelocityData[salesVelocityData.length - 2].velocity
  const velocityChange = ((currentVelocity - previousVelocity) / previousVelocity * 100).toFixed(1)
  
  const avgProfitMargin = profitMarginData.reduce((sum, item) => sum + item.margin, 0) / profitMarginData.length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sales Velocity Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sales Velocity Trend
          </CardTitle>
          <CardDescription>
            Units sold per week and conversion metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentVelocity}</div>
              <div className="text-sm text-muted-foreground">Units/Week</div>
              <Badge variant={velocityChange.startsWith('-') ? 'destructive' : 'default'} className="mt-1">
                {velocityChange}%
              </Badge>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${salesVelocityData[salesVelocityData.length - 1].avgOrderValue}
              </div>
              <div className="text-sm text-muted-foreground">Avg Order Value</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {salesVelocityData[salesVelocityData.length - 1].conversionRate}%
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesVelocityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <p className="font-semibold">{label}</p>
                        <div className="grid grid-cols-1 gap-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Velocity:</span>
                            <span className="font-medium">{data.velocity} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">AOV:</span>
                            <span className="font-medium">${data.avgOrderValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Conversion:</span>
                            <span className="font-medium">{data.conversionRate}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="velocity"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>
            Products by sales velocity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {product.velocity} units/week • {product.profit}% margin
                  </div>
                </div>
                <Badge 
                  variant={
                    product.trend === 'up' ? 'default' : 
                    product.trend === 'down' ? 'destructive' : 'secondary'
                  }
                  className="ml-2"
                >
                  {product.trend === 'up' ? '↗' : product.trend === 'down' ? '↘' : '→'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profit Margin Analysis */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Profit Margin Analysis
          </CardTitle>
          <CardDescription>
            Profitability by category with revenue breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Profit Margin</span>
              <span className="text-lg font-bold text-green-600">{avgProfitMargin.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: 35% | Industry avg: 28%
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitMarginData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
                className="text-xs fill-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <p className="font-semibold">{label}</p>
                        <div className="grid grid-cols-1 gap-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Margin:</span>
                            <span className="font-medium">{data.margin}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenue:</span>
                            <span className="font-medium">${data.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cost:</span>
                            <span className="font-medium">${data.cost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Profit:</span>
                            <span className="font-medium">${(data.revenue - data.cost).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{
                  fill: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  r: 5
                }}
                activeDot={{
                  r: 7,
                  fill: 'hsl(var(--primary))'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}