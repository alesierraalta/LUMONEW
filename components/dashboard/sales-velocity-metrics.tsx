'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TrendingUp, DollarSign, Zap, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { analyticsService } from '@/lib/database'
import { useEffect, useState } from 'react'

export function SalesVelocityMetrics() {
  const [salesVelocityData, setSalesVelocityData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [profitMarginData, setProfitMarginData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [velocityResults, topProductsResults, profitMarginResults] = await Promise.all([
          analyticsService.getSalesVelocityData(),
          analyticsService.getTopPerformingProducts(),
          analyticsService.getProfitMarginByCategory()
        ])
        
        setSalesVelocityData(velocityResults)
        setTopProducts(topProductsResults)
        setProfitMarginData(profitMarginResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sales velocity data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading sales velocity data: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentVelocity = salesVelocityData.length > 0 ? salesVelocityData[salesVelocityData.length - 1]?.velocity || 0 : 0
  const previousVelocity = salesVelocityData.length > 1 ? salesVelocityData[salesVelocityData.length - 2]?.velocity || 0 : 0
  const velocityChange = previousVelocity > 0 ? ((currentVelocity - previousVelocity) / previousVelocity * 100).toFixed(1) : '0'
  
  const avgProfitMargin = profitMarginData.length > 0
    ? profitMarginData.reduce((sum, item) => sum + item.margin, 0) / profitMarginData.length
    : 0

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
                ${salesVelocityData.length > 0 ? salesVelocityData[salesVelocityData.length - 1]?.avgOrderValue || 0 : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Order Value</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {salesVelocityData.length > 0 ? salesVelocityData[salesVelocityData.length - 1]?.conversionRate || 0 : 0}%
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