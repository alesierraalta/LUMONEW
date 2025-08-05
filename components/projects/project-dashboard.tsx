'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  Package,
  FileText,
  Receipt,
  CheckCircle
} from 'lucide-react'
import { ProjectMetrics } from '@/lib/types'

interface ProjectDashboardProps {
  onCreateProject: () => void
}

export function ProjectDashboard({ onCreateProject }: ProjectDashboardProps) {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsResponse = await fetch('/api/projects/metrics')
        const metricsData = await metricsResponse.json()

        if (metricsData.success) {
          setMetrics(metricsData.data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Proyectos</h1>
          <Button onClick={onCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Proyectos</h1>
        <Button onClick={onCreateProject} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proyectos Activos</p>
              <p className="text-3xl font-bold text-blue-600">{metrics?.activeProjects || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proyectos Completados</p>
              <p className="text-3xl font-bold text-green-600">{metrics?.completedProjects || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Pausa</p>
              <p className="text-3xl font-bold text-yellow-600">{metrics?.onHoldProjects || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
              <p className="text-3xl font-bold text-purple-600">
                {metrics?.totalProjects || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Product Type Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Productos LU (Inventario)</h3>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-medium">{metrics?.luItems.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Usados:</span>
              <span className="font-medium text-green-600">{metrics?.luItems.completed || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Productos CL (Cotización)</h3>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-medium">{metrics?.clItems.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completados:</span>
              <span className="font-medium text-green-600">{metrics?.clItems.completed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">En Proceso:</span>
              <span className="font-medium text-blue-600">
                {(metrics?.clItems.quotationPending || 0) + 
                 (metrics?.clItems.paymentPending || 0) + 
                 (metrics?.clItems.shippingPending || 0)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Productos MP (Proveedor)</h3>
            <Receipt className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-medium">{metrics?.impItems.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completados:</span>
              <span className="font-medium text-green-600">{metrics?.impItems.completed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">En Proceso:</span>
              <span className="font-medium text-purple-600">
                {(metrics?.impItems.piPaymentPending || 0) + 
                 (metrics?.impItems.shippingPending || 0) + 
                 (metrics?.impItems.customsPending || 0) + 
                 (metrics?.impItems.coordinationPending || 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 