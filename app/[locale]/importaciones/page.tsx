'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { WorkflowItemTracker } from '@/components/projects/workflow-item-tracker'
import { 
  Search, 
  Filter,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Plane,
  Ship
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface WorkflowItem {
  id: string
  projectId: string
  productType: 'CL' | 'IMP'
  productName: string
  currentStep: string
  stepData: Record<string, any>
  createdAt: string
  updatedAt: string
}

const IMP_STEPS = [
  { id: 'imp_step1', name: 'Pagar PI a Proveedor', color: 'bg-blue-500' },
  { id: 'imp_step2', name: 'Enviar Etiqueta', color: 'bg-indigo-500' },
  { id: 'imp_step3', name: 'Decisión Envío', color: 'bg-purple-500' },
  { id: 'imp_step4a', name: 'Pagar Flete Aéreo', color: 'bg-yellow-500' },
  { id: 'imp_step4b', name: 'Pagar Flete Marítimo', color: 'bg-orange-500' },
  { id: 'imp_step5', name: 'Coordinar Envío', color: 'bg-red-500' },
  { id: 'imp_step6', name: 'Pagar Arancel', color: 'bg-pink-500' },
  { id: 'imp_step7', name: 'Recibido', color: 'bg-green-500' }
]

export default function ImportacionesPage() {
  const t = useTranslations()
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stepFilter, setStepFilter] = useState<string>('all')
  const [shippingFilter, setShippingFilter] = useState<string>('all')

  useEffect(() => {
    fetchIMPItems()
  }, [])

  const fetchIMPItems = async () => {
    try {
      const response = await fetch('/api/projects/workflow-items')
      const result = await response.json()
      
      if (result.success) {
        // Filter only IMP items and map to correct property names
        const impItems = result.data
          .filter((item: any) => item.product_type === 'IMP')
          .map((item: any) => ({
            id: item.id,
            projectId: item.project_id,
            productType: item.product_type,
            productName: item.product_name,
            currentStep: item.current_step,
            stepData: item.step_data,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }))
        setItems(impItems)
      }
    } catch (error) {
      console.error('Error fetching IMP items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStepComplete = async (itemId: string, nextStepId: string, stepData: any) => {
    try {
      const response = await fetch(`/api/projects/workflow-items`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemId,
          currentStep: nextStepId,
          stepData: stepData
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchIMPItems() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating workflow item:', error)
    }
  }

  const handleItemUpdate = async (itemId: string) => {
    // Simply refresh the list when an item is updated
    await fetchIMPItems()
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStep = stepFilter === 'all' || item.currentStep === stepFilter
    const matchesShipping = shippingFilter === 'all' || 
      (shippingFilter === 'aereo' && item.stepData?.shippingType === 'aereo') ||
      (shippingFilter === 'maritimo' && item.stepData?.shippingType === 'maritimo') ||
      (shippingFilter === 'pending' && !item.stepData?.shippingType)
    
    return matchesSearch && matchesStep && matchesShipping
  })

  const getStepStats = () => {
    const stats = IMP_STEPS.map(step => ({
      ...step,
      count: items.filter(item => item.currentStep === step.id).length
    }))
    return stats
  }

  const getShippingStats = () => {
    const aereo = items.filter(item => item.stepData?.shippingType === 'aereo').length
    const maritimo = items.filter(item => item.stepData?.shippingType === 'maritimo').length
    const pending = items.filter(item => !item.stepData?.shippingType).length
    
    return { aereo, maritimo, pending }
  }

  const completedItems = items.filter(item => item.currentStep === 'imp_step7').length
  const totalValue = items.reduce((sum, item) => {
    const piAmount = item.stepData?.piAmount || 0
    const freightCost = item.stepData?.airFreightCost || item.stepData?.seaFreightCost || 0
    const customsDuty = item.stepData?.customsDutyAmount || 0
    return sum + piAmount + freightCost + customsDuty
  }, 0)

  const shippingStats = getShippingStats()

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard de Importaciones</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
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
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard de Importaciones</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona todos los procesos de importación (IMP)
          </p>
        </div>
      </div>

      {/* Metrics Cards - Mobile Responsive Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Items en proceso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-600">{completedItems}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Items recibidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {items.length - completedItems}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Items activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Costo total importaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Type Stats - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Tipos de Envío</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
                <Plane className="h-4 w-4 md:h-6 md:w-6" />
              </div>
              <p className="text-xs md:text-sm font-medium">Aéreo</p>
              <p className="text-lg md:text-2xl font-bold text-blue-600">{shippingStats.aereo}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
                <Ship className="h-4 w-4 md:h-6 md:w-6" />
              </div>
              <p className="text-xs md:text-sm font-medium">Marítimo</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{shippingStats.maritimo}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
                <Clock className="h-4 w-4 md:h-6 md:w-6" />
              </div>
              <p className="text-xs md:text-sm font-medium">Pendiente</p>
              <p className="text-lg md:text-2xl font-bold text-gray-600">{shippingStats.pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Progress - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Progreso por Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {getStepStats().map((step) => (
              <div key={step.id} className="text-center">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${step.color} flex items-center justify-center text-white font-bold mx-auto mb-2 text-xs md:text-sm`}>
                  {step.count}
                </div>
                <p className="text-xs font-medium line-clamp-2">{step.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((step.count / items.length) * 100) || 0}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters - Mobile Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={stepFilter} onValueChange={setStepFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por paso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pasos</SelectItem>
            {IMP_STEPS.map(step => (
              <SelectItem key={step.id} value={step.id}>
                {step.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={shippingFilter} onValueChange={setShippingFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo de envío" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="aereo">Aéreo</SelectItem>
            <SelectItem value="maritimo">Marítimo</SelectItem>
            <SelectItem value="pending">Pendiente decisión</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List - Mobile Responsive */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card className="shadow-sm md:shadow-lg">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay items de importación
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || stepFilter !== 'all' || shippingFilter !== 'all'
                  ? 'No se encontraron items que coincidan con los filtros'
                  : 'Crea tu primer item de importación desde un proyecto'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border shadow-sm">
                <WorkflowItemTracker
                  item={item}
                  onStepComplete={handleStepComplete}
                  onItemUpdate={handleItemUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 