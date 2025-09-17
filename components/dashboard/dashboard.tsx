'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricsCards } from './metrics-cards'
import { InventoryChart } from './inventory-chart'
import RecentActivities from './recent-activities'
import { QuickActions } from './quick-actions'
import { InventoryTurnoverChart } from './inventory-turnover-chart'
import { SalesVelocityMetrics } from './sales-velocity-metrics'
import { LocationPerformance } from './location-performance'
import { FinancialKPIs } from './financial-kpis'
import { AlertsPanel } from './alerts-panel'
import { DashboardCards } from '@/components/cards/card-container'
import { usePageCards } from '@/components/cards/card-provider'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { analyticsService, inventoryService } from '@/lib/database'
import { auditService } from '@/lib/audit'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface DashboardData {
  lowStockItems: any[]
  recentActivity: any[]
  totalItems: number
  categories: string[]
  criticalAlerts: number
}

export function Dashboard() {
  const t = useTranslations('dashboard')
  const { theme } = useTheme()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Fetch real data from Supabase
        const [metrics, lowStockItems, recentActivity] = await Promise.all([
          analyticsService.getDashboardMetrics(),
          inventoryService.getLowStock(),
          auditService.getRecentLogs(5)
        ])

        const dashboardData = {
          lowStockItems: lowStockItems || [],
          recentActivity: recentActivity || [],
          totalItems: metrics.totalItems,
          categories: [], // Will be populated by other components
          criticalAlerts: (lowStockItems?.length || 0)
        }

        setDashboardData(dashboardData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Fallback to empty data structure
        setDashboardData({
          lowStockItems: [],
          recentActivity: [],
          totalItems: 0,
          categories: [],
          criticalAlerts: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])
  
  // Use the page cards hook to generate contextual cards
  usePageCards('dashboard', dashboardData || {})

  if (loading) {
    return (
      <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{t('businessIntelligenceDashboard')}</h2>
        </div>
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 sm:h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Enhanced Mobile-First Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center justify-center sm:justify-start">
            <Image 
              src="/logo.png" 
              alt="LUMO Logo" 
              width={440} 
              height={240} 
              className={cn(
                "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-30 lg:w-30 object-contain",
                (theme === 'dark' || theme === 'black') && "invert"
              )}
            />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center sm:text-left">
            {t('businessIntelligenceDashboard')}
          </h2>
        </div>
        <div className="flex justify-center sm:justify-end">
          <QuickActions />
        </div>
      </div>
      
      {/* Information Cards - Enhanced Mobile Layout */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        <DashboardCards />
      </div>
      
      {/* Metrics Cards - Enhanced Mobile Responsive */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <MetricsCards />
      </div>
      
      {/* Tabbed Analytics Interface - Enhanced Mobile Responsive */}
      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-1 sm:px-2">
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm py-2 px-1 sm:px-2">
            {t('tabs.inventory')}
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm py-2 px-1 sm:px-2">
            {t('tabs.sales')}
          </TabsTrigger>
          <TabsTrigger value="locations" className="hidden sm:block text-xs sm:text-sm py-2 px-1 sm:px-2">
            {t('tabs.locations')}
          </TabsTrigger>
          <TabsTrigger value="financial" className="hidden md:block text-xs sm:text-sm py-2 px-1 sm:px-2">
            {t('tabs.financial')}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="hidden md:block text-xs sm:text-sm py-2 px-1 sm:px-2">
            {t('tabs.alerts')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-3 sm:space-y-4">
          {/* Overview Charts - Enhanced Mobile Responsive */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg md:text-xl">
                  {t('cards.inventoryOverview')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('cards.inventoryOverviewDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-1 sm:pl-2">
                <InventoryChart />
              </CardContent>
            </Card>
            
            <div className="lg:col-span-3">
              <RecentActivities />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-3 sm:space-y-4">
          <InventoryTurnoverChart />
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-3 sm:space-y-4">
          <SalesVelocityMetrics />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-3 sm:space-y-4">
          <LocationPerformance />
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-3 sm:space-y-4">
          <FinancialKPIs />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-3 sm:space-y-4">
          <AlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}