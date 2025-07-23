'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Package, AlertCircle } from 'lucide-react'
import { analyticsService } from '@/lib/database'
import { useEffect, useState } from 'react'

const COLORS = ['#22c55e', '#f59e0b', '#ef4444']

export function InventoryTurnoverChart() {
  const [turnoverData, setTurnoverData] = useState<any[]>([])
  const [abcAnalysisData, setAbcAnalysisData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [turnoverResults, abcResults] = await Promise.all([
          analyticsService.getInventoryTurnoverByCategory(),
          analyticsService.getABCAnalysis()
        ])
        
        setTurnoverData(turnoverResults)
        setAbcAnalysisData(abcResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch turnover data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading turnover data: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const avgTurnover = turnoverData.length > 0
    ? turnoverData.reduce((sum, item) => sum + item.turnover, 0) / turnoverData.length
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Inventory Turnover by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inventory Turnover by Category
          </CardTitle>
          <CardDescription>
            Times per year inventory is sold and replaced
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Turnover Rate</span>
              <span className="text-lg font-bold text-blue-600">{avgTurnover.toFixed(1)}x</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry benchmark: 6-8x annually
            </p>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
                className="text-xs fill-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
              />
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
                            <span className="text-sm text-muted-foreground">Turnover:</span>
                            <span className="font-medium">{data.turnover}x/year</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenue:</span>
                            <span className="font-medium">${data.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Items:</span>
                            <span className="font-medium">{data.items}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar 
                dataKey="turnover" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ABC Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ABC Analysis
          </CardTitle>
          <CardDescription>
            Inventory classification by value contribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={abcAnalysisData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {abcAnalysisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <p className="font-semibold">{data.name}</p>
                          <div className="grid grid-cols-1 gap-1 mt-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Items:</span>
                              <span className="font-medium">{data.value}% ({data.count})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Revenue:</span>
                              <span className="font-medium">{data.revenue}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              {abcAnalysisData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name.split(' ')[0]} Items</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.count} items</div>
                    <div className="text-xs text-muted-foreground">{item.revenue}% revenue</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Optimization Tip</p>
                <p className="text-xs text-amber-700">
                  Focus on A-items for inventory control and B-items for cost optimization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}