'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, FolderOpen } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { analyticsService } from '@/lib/database'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { TotalValueModal } from './total-value-modal'

interface DashboardMetrics {
  totalItems: number
  lowStockCount: number
  totalValue: number
  categoriesCount: number
  locationsCount: number
}

export function MetricsCards() {
  const t = useTranslations('dashboard.metrics')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTotalValueModalOpen, setIsTotalValueModalOpen] = useState(false)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        const data = await analyticsService.getDashboardMetrics()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20"></div>
              <div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
              <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 mb-2"></div>
              <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
        <Card className="col-span-full border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
          <CardContent className="pt-4 sm:pt-6">
            <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
              {t('errorLoadingMetrics')}: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) return null

  const metricsData = [
    {
      title: t('totalItems'),
      value: formatNumber(metrics.totalItems),
      description: t('itemsInInventory'),
      icon: Package,
      trend: t('realTimeData')
    },
    {
      title: t('totalValue'),
      value: formatCurrency(metrics.totalValue),
      description: t('inventoryValue'),
      icon: DollarSign,
      trend: t('realTimeData'),
      isClickable: true
    },
    {
      title: t('lowStock'),
      value: formatNumber(metrics.lowStockCount),
      description: t('itemsNeedRestocking'),
      icon: AlertTriangle,
      trend: t('requiresAttention'),
      isAlert: metrics.lowStockCount > 0
    },
    {
      title: t('categories'),
      value: formatNumber(metrics.categoriesCount),
      description: t('productCategories'),
      icon: FolderOpen,
      trend: t('activeCategories')
    }
  ]

  return (
    <>
      {metricsData.map((metric, index) => (
        <Card 
          key={index} 
          className={`${metric.isAlert ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20' : ''} ${metric.isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={metric.isClickable ? () => setIsTotalValueModalOpen(true) : undefined}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${metric.isAlert ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-base sm:text-lg md:text-2xl font-bold leading-tight">
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-tight mt-1">
              {metric.description}
            </p>
            <p className={`text-xs mt-1 leading-tight ${
              metric.trend.includes('+') ? 'text-green-600 dark:text-green-300' : 
              metric.trend.includes('-') ? 'text-red-600 dark:text-red-300' : 
              'text-muted-foreground'
            }`}>
              {metric.trend}
            </p>
            {metric.isClickable && (
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400 leading-tight">
                Click para ver detalles
              </p>
            )}
          </CardContent>
        </Card>
      ))}
      <TotalValueModal 
        isOpen={isTotalValueModalOpen}
        onClose={() => setIsTotalValueModalOpen(false)}
      />
    </>
  )
}