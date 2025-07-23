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

interface DashboardData {
  lowStockItems: any[]
  recentActivity: any[]
  totalItems: number
  categories: string[]
  criticalAlerts: number
}

export function Dashboard() {
  const t = useTranslations('dashboard')
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('businessIntelligenceDashboard')}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('businessIntelligenceDashboard')}</h2>
        <QuickActions />
      </div>
      
      {/* Information Cards */}
      <DashboardCards />
      
      {/* Metrics Cards */}
      <MetricsCards />
      
      {/* Tabbed Analytics Interface */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('tabs.inventory')}</TabsTrigger>
          <TabsTrigger value="sales">{t('tabs.sales')}</TabsTrigger>
          <TabsTrigger value="locations">{t('tabs.locations')}</TabsTrigger>
          <TabsTrigger value="financial">{t('tabs.financial')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('tabs.alerts')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Overview Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t('cards.inventoryOverview')}</CardTitle>
                <CardDescription>
                  {t('cards.inventoryOverviewDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <InventoryChart />
              </CardContent>
            </Card>
            
            <div className="col-span-3">
              <RecentActivities />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventoryTurnoverChart />
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <SalesVelocityMetrics />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <LocationPerformance />
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-4">
          <FinancialKPIs />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}