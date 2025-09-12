'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area, AreaChart } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Calculator, Target, PieChart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { analyticsService } from '@/lib/database'

interface TrendPoint {
  month: string
  revenue: number
  expenses: number
  profit: number
  cashFlow: number
  roi: number
}

interface ExpenseItem { category: string; amount: number; percentage: number; color: string }

export function FinancialKPIs() {
  const t = useTranslations('dashboard.financial')
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [kpis, setKpis] = useState<{ revenueGrowth: number; profitGrowth: number; grossProfitMargin: number; inventoryTurnover: number; roi: number; current: TrendPoint | null }>({ revenueGrowth: 0, profitGrowth: 0, grossProfitMargin: 0, inventoryTurnover: 0, roi: 0, current: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [trendData, expenseData, kpiData] = await Promise.all([
          analyticsService.getFinancialTrends(7),
          analyticsService.getExpenseBreakdown(),
          analyticsService.getFinancialKpis()
        ])
        setTrends(trendData as TrendPoint[])
        setExpenses(expenseData as ExpenseItem[])
        setKpis({
          revenueGrowth: (kpiData as any).revenueGrowth,
          profitGrowth: (kpiData as any).profitGrowth,
          grossProfitMargin: (kpiData as any).grossProfitMargin,
          inventoryTurnover: (kpiData as any).inventoryTurnover,
          roi: (kpiData as any).roi,
          current: (kpiData as any).current || null
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load financial KPIs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const revenueGrowthText = useMemo(() => `+${kpis.revenueGrowth.toFixed(1)}%`, [kpis])
  const profitGrowthText = useMemo(() => `+${kpis.profitGrowth.toFixed(1)}%`, [kpis])

  const metricCards = useMemo(() => {
    const currentRevenueK = kpis.current ? `$${Math.round(kpis.current.revenue / 1000)}K` : '$0K'
    const currentCashK = kpis.current ? `$${Math.round(kpis.current.cashFlow / 1000)}K` : '$0K'
    return [
      { title: t('monthlyRecurringRevenue'), value: currentRevenueK, change: revenueGrowthText, trend: kpis.revenueGrowth >= 0 ? 'up' : 'down', target: '$180K', description: t('currentMonthRevenue') },
      { title: t('grossProfitMargin'), value: `${kpis.grossProfitMargin.toFixed(1)}%`, change: kpis.grossProfitMargin >= 0 ? '+0%' : '-0%', trend: kpis.grossProfitMargin >= 0 ? 'up' : 'down', target: '35%', description: t('revenueMinusCogs') },
      { title: t('operatingCashFlow'), value: currentCashK, change: profitGrowthText, trend: kpis.profitGrowth >= 0 ? 'up' : 'down', target: '$70K', description: t('cashFromOperations') },
      { title: t('returnOnInvestment'), value: `${kpis.roi.toFixed(1)}%`, change: kpis.roi >= 0 ? '+0%' : '-0%', trend: kpis.roi >= 0 ? 'up' : 'down', target: '30%', description: t('roiOnInventory') },
      { title: t('inventoryTurnover'), value: `${kpis.inventoryTurnover.toFixed(1)}x`, change: '+0.0x', trend: 'up', target: '8x', description: t('annualTurnoverRate') },
      { title: t('daysSalesOutstanding'), value: '—', change: '—', trend: 'up', target: '30 days', description: t('averageCollectionPeriod') }
    ]
  }, [kpis, revenueGrowthText, profitGrowthText, t])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Error financiero</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentMonth = kpis.current || trends[trends.length - 1]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric, index) => (
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
              {t('revenueAndProfitTrends')}
            </CardTitle>
            <CardDescription>
              {t('monthlyFinancialPerformance')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{revenueGrowthText}</div>
                <div className="text-sm text-muted-foreground">{t('revenueGrowth')}</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{profitGrowthText}</div>
                <div className="text-sm text-muted-foreground">{t('profitGrowth')}</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TrendPoint
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <p className="font-semibold">{label}</p>
                          <div className="grid grid-cols-1 gap-1 mt-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">{t('revenue')}:</span>
                              <span className="font-medium">${data.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">{t('expenses')}:</span>
                              <span className="font-medium">${data.expenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">{t('profit')}:</span>
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
              {t('cashFlowAnalysis')}
            </CardTitle>
            <CardDescription>
              {t('operatingCashFlowAndRoi')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('currentCashFlow')}</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">${(currentMonth?.cashFlow || 0).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(currentMonth?.roi || 0).toFixed(1)}% {t('roiThisMonth')}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TrendPoint
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
              {t('financialRatios')}
            </CardTitle>
            <CardDescription>
              {t('keyFinancialHealthIndicators')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder ratios since we don't track balance sheet here */}
              {[
                { name: 'Current Ratio', value: 2.0, benchmark: 2.0, status: 'good' },
                { name: 'Quick Ratio', value: 1.4, benchmark: 1.0, status: 'good' },
                { name: 'Profit Margin', value: kpis.grossProfitMargin, benchmark: 25.0, status: kpis.grossProfitMargin >= 25 ? 'excellent' : 'good' }
              ].map((ratio, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <div className="font-medium text-sm">{t(`ratios.${ratio.name.toLowerCase().replace(/[^a-z]/g, '')}`)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('ratios.benchmark')}: {ratio.benchmark}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{typeof ratio.value === 'number' ? ratio.value.toFixed(1) : ratio.value}</div>
                    <Badge
                      variant={
                        ratio.status === 'excellent' ? 'default' :
                        ratio.status === 'good' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {t(`ratios.${ratio.status}`)}
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
              {t('expenseBreakdown')}
            </CardTitle>
            <CardDescription>
              {t('currentMonthExpenseDistribution')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.map((expense, index) => (
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
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('totalExpenses')}</span>
                <span className="font-bold text-lg">
                  ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}