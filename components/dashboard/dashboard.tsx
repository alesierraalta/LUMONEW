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

// Mock data for demonstration
const mockDashboardData = {
  lowStockItems: [
    { id: '1', nombre: 'Producto A', stock: 5, stockMinimo: 10 },
    { id: '2', nombre: 'Producto B', stock: 2, stockMinimo: 15 },
    { id: '3', nombre: 'Producto C', stock: 1, stockMinimo: 8 }
  ],
  recentActivity: [
    { id: '1', action: 'Stock actualizado', product: 'Producto X', timestamp: new Date() },
    { id: '2', action: 'Nuevo producto agregado', product: 'Producto Y', timestamp: new Date() }
  ],
  totalItems: 150,
  categories: ['Electrónicos', 'Ropa', 'Hogar'],
  criticalAlerts: 3
}

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState(mockDashboardData)
  
  // Use the page cards hook to generate contextual cards
  usePageCards('dashboard', dashboardData)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h2>
        <QuickActions />
      </div>
      
      {/* Information Cards */}
      <DashboardCards />
      
      {/* Metrics Cards */}
      <MetricsCards />
      
      {/* Tabbed Analytics Interface */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Overview Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>
                  Total inventory value and stock levels over time
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