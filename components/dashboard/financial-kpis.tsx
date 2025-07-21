'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area, AreaChart } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Calculator, Target, PieChart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock financial data
const financialTrends = [
  { month: 'Jan', revenue: 125000, expenses: 89000, profit: 36000, cashFlow: 42000, roi: 28.8 },
  { month: 'Feb', revenue: 138000, expenses: 95000, profit: 43000, cashFlow: 48000, roi: 31.2 },
  { month: 'Mar', revenue: 142000, expenses: 98000, profit: 44000, cashFlow: 51000, roi: 31.0 },
  { month: 'Apr', revenue: 156000, expenses: 105000, profit: 51000, cashFlow: 58000, roi: 32.7 },
  { month: 'May', revenue: 149000, expenses: 102000, profit: 47000, cashFlow: 54000, roi: 31.5 },
  { month: 'Jun', revenue: 162000, expenses: 108000, profit: 54000, cashFlow: 61000, roi: 33.3 },
  { month: 'Jul', revenue: 171000, expenses: 112000, profit: 59000, cashFlow: 67000, roi: 34.5 }
]

// Key financial metrics
const kpiMetrics = [
  {
    title: 'Monthly Recurring Revenue',
    value: '$171K',
    change: '+8.2%',
    trend: 'up',
    target: '$180K',
    description: 'Current month revenue'
  },
  {
    title: 'Gross Profit Margin',
    value: '34.5%',
    change: '+1.2%',
    trend: 'up',
    target: '35%',
    description: 'Revenue minus COGS'
  },
  {
    title: 'Operating Cash Flow',
    value: '$67K',
    change: '+9.8%',
    trend: 'up',
    target: '$70K',
    description: 'Cash from operations'
  },
  {
    title: 'Return on Investment',
    value: '34.5%',
    change: '+3.7%',
    trend: 'up',
    target: '30%',
    description: 'ROI on inventory'
  },
  {
    title: 'Inventory Turnover',
    value: '8.2x',
    change: '+0.5x',
    trend: 'up',
    target: '8x',
    description: 'Annual turnover rate'
  },
  {
    title: 'Days Sales Outstanding',
    value: '28 days',
    change: '-3 days',
    trend: 'up',
    target: '30 days',
    description: 'Average collection period'
  }
]

// Expense breakdown
const expenseBreakdown = [
  { category: 'Cost of Goods', amount: 67200, percentage: 60, color: '#ef4444' },
  { category: 'Personnel', amount: 22400, percentage: 20, color: '#f59e0b' },
  { category: 'Operations', amount: 11200, percentage: 10, color: '#3b82f6' },
  { category: 'Marketing', amount: 6720, percentage: 6, color: '#10b981' },
  { category: 'Other', amount: 4480, percentage: 4, color: '#8b5cf6' }
]

// Financial ratios
const financialRatios = [
  { name: 'Current Ratio', value: 2.4, benchmark: 2.0, status: 'good' },
  { name: 'Quick Ratio', value: 1.8, benchmark: 1.0, status: 'excellent' },
  { name: 'Debt-to-Equity', value: 0.3, benchmark: 0.5, status: 'excellent' },
  { name: 'Asset Turnover', value: 1.6, benchmark: 1.2, status: 'good' },
  { name: 'Profit Margin', value: 34.5, benchmark: 25.0, status: 'excellent' }
]

export function FinancialKPIs() {
  const currentMonth = financialTrends[financialTrends.length - 1]
  const previousMonth = financialTrends[financialTrends.length - 2]
  const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
  const profitGrowth = ((currentMonth.profit - previousMonth.profit) / previousMonth.profit * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant={metric.trend === 'up' ? 'default' : 'destructive'}>
                  {metric.change}
                </Badge>
                <span className="text-xs text-muted-foreground">Target: {metric.target}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and Profit Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue & Profit Trends
            </CardTitle>
            <CardDescription>
              Monthly financial performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">+{revenueGrowth}%</div>
                <div className="text-sm text-muted-foreground">Revenue Growth</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">+{profitGrowth}%</div>
                <div className="text-sm text-muted-foreground">Profit Growth</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={financialTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
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
                              <span className="text-sm text-muted-foreground">Revenue:</span>
                              <span className="font-medium">${data.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Expenses:</span>
                              <span className="font-medium">${data.expenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Profit:</span>
                              <span className="font-medium">${data.profit.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="expenses" fill="#ef4444" opacity={0.6} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cash Flow Analysis
            </CardTitle>
            <CardDescription>
              Operating cash flow and ROI trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Cash Flow</span>
                <span className="text-lg font-bold text-purple-600">${currentMonth.cashFlow.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentMonth.roi}% ROI this month
              </p>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={financialTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
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
                              <span className="text-sm text-muted-foreground">Cash Flow:</span>
                              <span className="font-medium">${data.cashFlow.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">ROI:</span>
                              <span className="font-medium">{data.roi}%</span>
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
                  dataKey="cashFlow"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios and Expense Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Financial Ratios
            </CardTitle>
            <CardDescription>
              Key financial health indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialRatios.map((ratio, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <div className="font-medium text-sm">{ratio.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Benchmark: {ratio.benchmark}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{ratio.value}</div>
                    <Badge 
                      variant={
                        ratio.status === 'excellent' ? 'default' :
                        ratio.status === 'good' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {ratio.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>
              Current month expense distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseBreakdown.map((expense, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: expense.color }}
                    />
                    <span className="text-sm font-medium">{expense.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${expense.amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{expense.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Expenses</span>
                <span className="font-bold text-lg">
                  ${expenseBreakdown.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}