'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  FileText, 
  Plane, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  TrendingUp,
  Building2,
  ShoppingCart,
  Truck
} from 'lucide-react'

interface InventoryMetrics {
  lu: {
    total: number
    available: number
    selected: number
    percentage: number
  }
  cl: {
    total: number
    quotationPending: number
    paymentPending: number
    shippingPending: number
    completed: number
    percentage: number
  }
  imp: {
    total: number
    piPaymentPending: number
    shippingPending: number
    customsPending: number
    coordinationPending: number
    completed: number
    percentage: number
  }
}

interface InventoryDashboardProps {
  projectId?: string
  onAddLU: () => void
  onAddCL: () => void
  onAddIMP: () => void
  addingItems?: boolean
}

export function InventoryDashboard({ 
  projectId, 
  onAddLU, 
  onAddCL, 
  onAddIMP,
  addingItems = false
}: InventoryDashboardProps) {
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    lu: { total: 0, available: 0, selected: 0, percentage: 0 },
    cl: { total: 0, quotationPending: 0, paymentPending: 0, shippingPending: 0, completed: 0, percentage: 0 },
    imp: { total: 0, piPaymentPending: 0, shippingPending: 0, customsPending: 0, coordinationPending: 0, completed: 0, percentage: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      fetchInventoryMetrics()
    } else {
      // Global metrics
      fetchGlobalInventoryMetrics()
    }
  }, [projectId])

  const fetchInventoryMetrics = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/inventory-metrics`)
      const data = await response.json()
      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Error fetching inventory metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalInventoryMetrics = async () => {
    try {
      const response = await fetch('/api/projects/inventory-metrics')
      const data = await response.json()
      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Error fetching global inventory metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {projectId ? 'Inventario del Proyecto' : 'Gestión de Inventario'}
          </h2>
          <p className="text-gray-600 mt-1">
            Administra productos de stock (LU), cotizaciones (CL) e importaciones (IMP)
          </p>
        </div>
      </div>

      {/* Inventory Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LU - Inventario (Stock VLN) - Enhanced Design */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-lg transition-all duration-300 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold">Inventario Local</div>
                  <div className="text-xs text-emerald-600 font-normal">Stock VLN Disponible</div>
                </div>
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                Inmediato
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Enhanced Metrics Display */}
              <div className="bg-white/50 rounded-xl p-4 border border-emerald-100">
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-emerald-700 mb-1">{metrics.lu.total}</div>
                  <div className="text-sm text-emerald-600 font-medium">Productos en Stock</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs text-emerald-700 font-medium">Disponibles</span>
                    </div>
                    <div className="text-lg font-bold text-emerald-800">{metrics.lu.available}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-700 font-medium">Seleccionados</span>
                    </div>
                    <div className="text-lg font-bold text-blue-800">{metrics.lu.selected}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progreso de selección</span>
                    <span className="font-medium">{metrics.lu.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={metrics.lu.percentage} className="h-3" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-20"></div>
                  </div>
                </div>
              </div>

              {/* Quick Access Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Ventajas del Stock Local
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Entrega inmediata</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>Sin costos extra</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Building2 className="w-3 h-3 text-green-500" />
                    <span>Calidad verificada</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Package className="w-3 h-3 text-green-500" />
                    <span>Stock garantizado</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Button */}
              <div className="pt-2">
                <Button 
                  onClick={onAddLU}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] font-semibold"
                  size="sm"
                  disabled={addingItems}
                >
                  {addingItems ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Explorar Inventario
                    </>
                  )}
                </Button>
                
                {/* Quick Stats */}
                <div className="mt-2 text-center">
                  <span className="text-xs text-emerald-600 font-medium">
                    🚀 Selección rápida y eficiente
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CL - Cotizaciones */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <FileText className="w-5 h-5" />
                Cotizaciones (CL)
              </CardTitle>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                Por Cotizar
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">{metrics.cl.total}</div>
                <div className="text-sm text-blue-600">Productos en proceso</div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cotización pendiente</span>
                  <span className="font-medium text-yellow-600">{metrics.cl.quotationPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pago pendiente</span>
                  <span className="font-medium text-orange-600">{metrics.cl.paymentPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío pendiente</span>
                  <span className="font-medium text-purple-600">{metrics.cl.shippingPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completados</span>
                  <span className="font-medium text-green-600">{metrics.cl.completed}</span>
                </div>
                <Progress value={metrics.cl.percentage} className="h-2 mt-2" />
              </div>

              <div className="pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-700 mb-3">
                  📋 Requiere proceso de cotización
                </p>
                <Button 
                  onClick={onAddCL}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Solicitar Cotización
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IMP - Importaciones */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                <Plane className="w-5 h-5" />
                Importaciones (IMP)
              </CardTitle>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                Importación
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">{metrics.imp.total}</div>
                <div className="text-sm text-purple-600">Productos importados</div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pago PI pendiente</span>
                  <span className="font-medium text-yellow-600">{metrics.imp.piPaymentPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío pendiente</span>
                  <span className="font-medium text-orange-600">{metrics.imp.shippingPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aduanas pendiente</span>
                  <span className="font-medium text-red-600">{metrics.imp.customsPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coordinación</span>
                  <span className="font-medium text-blue-600">{metrics.imp.coordinationPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completados</span>
                  <span className="font-medium text-green-600">{metrics.imp.completed}</span>
                </div>
                <Progress value={metrics.imp.percentage} className="h-2 mt-2" />
              </div>

              <div className="pt-2 border-t border-purple-200">
                <p className="text-xs text-purple-700 mb-3">
                  🌍 Proceso completo de importación
                </p>
                <Button 
                  onClick={onAddIMP}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Iniciar Importación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-green-200 hover:bg-green-50 disabled:opacity-50"
              onClick={onAddLU}
              disabled={addingItems}
            >
              {addingItems ? (
                <>
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  <div className="text-center">
                    <div className="font-medium">Agregando...</div>
                    <div className="text-xs text-gray-500">Procesando items</div>
                  </div>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <div className="text-center">
                    <div className="font-medium">Agregar del Stock</div>
                    <div className="text-xs text-gray-500">Productos VLN disponibles</div>
                  </div>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-blue-200 hover:bg-blue-50"
              onClick={onAddCL}
            >
              <FileText className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Nueva Cotización</div>
                <div className="text-xs text-gray-500">Solicitar precio a proveedor</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-purple-200 hover:bg-purple-50"
              onClick={onAddIMP}
            >
              <Plane className="w-6 h-6 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">Nueva Importación</div>
                <div className="text-xs text-gray-500">Proceso completo de importación</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}