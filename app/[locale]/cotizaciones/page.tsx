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
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Plus,
  X
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

const CL_STEPS = [
  { id: 'cl_step1', name: 'Solicitar Cotización', color: 'bg-blue-500' },
  { id: 'cl_step2', name: 'Pagar Cotización', color: 'bg-yellow-500' },
  { id: 'cl_step3', name: 'Coordinar Envío', color: 'bg-orange-500' },
  { id: 'cl_step4', name: 'Recibido', color: 'bg-green-500' }
]

export default function CotizacionesPage() {
  const t = useTranslations()
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stepFilter, setStepFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemForm, setNewItemForm] = useState({
    projectId: '',
    productName: '',
    supplierName: '',
    supplierEmail: '',
    description: '',
    quantity: 1,
    estimatedCost: 0
  })

  useEffect(() => {
    fetchCLItems()
  }, [])

  const fetchCLItems = async () => {
    try {
      const response = await fetch('/api/projects/workflow-items')
      const result = await response.json()
      
      if (result.success) {
        // Filter only CL items and map to correct property names
        const clItems = result.data
          .filter((item: any) => item.product_type === 'CL')
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
        setItems(clItems)
      }
    } catch (error) {
      console.error('Error fetching CL items:', error)
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
        await fetchCLItems() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating workflow item:', error)
    }
  }

  const handleItemUpdate = async (itemId: string) => {
    // Simply refresh the list when an item is updated
    await fetchCLItems()
  }

  const handleAddNewItem = async () => {
    try {
      const response = await fetch('/api/projects/workflow-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: newItemForm.projectId,
          productType: 'CL',
          productName: newItemForm.productName,
          currentStep: 'cl_step1',
          stepData: {
            supplierName: newItemForm.supplierName,
            supplierEmail: newItemForm.supplierEmail,
            description: newItemForm.description,
            quantity: newItemForm.quantity,
            estimatedCost: newItemForm.estimatedCost
          }
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Reset form and hide it
        setNewItemForm({
          projectId: '',
          productName: '',
          supplierName: '',
          supplierEmail: '',
          description: '',
          quantity: 1,
          estimatedCost: 0
        })
        setShowAddForm(false)
        await fetchCLItems() // Refresh the list
      }
    } catch (error) {
      console.error('Error creating new CL item:', error)
    }
  }

  const handleCancelAdd = () => {
    setNewItemForm({
      projectId: '',
      productName: '',
      supplierName: '',
      supplierEmail: '',
      description: '',
      quantity: 1,
      estimatedCost: 0
    })
    setShowAddForm(false)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStep = stepFilter === 'all' || item.currentStep === stepFilter
    return matchesSearch && matchesStep
  })

  const getStepStats = () => {
    const stats = CL_STEPS.map(step => ({
      ...step,
      count: items.filter(item => item.currentStep === step.id).length
    }))
    return stats
  }

  const getStepName = (stepId: string) => {
    const step = CL_STEPS.find(s => s.id === stepId)
    return step?.name || stepId
  }

  const getStepColor = (stepId: string) => {
    const step = CL_STEPS.find(s => s.id === stepId)
    return step?.color || 'bg-gray-500'
  }

  const completedItems = items.filter(item => item.currentStep === 'cl_step4').length
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.stepData?.quotationAmount || 0)
  }, 0)

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard de Cotizaciones</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard de Cotizaciones</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona todos los procesos de cotización (CL)
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showAddForm ? 'Cancelar' : 'Nueva Cotización'}
        </Button>
      </div>

      {/* Metrics Cards - Mobile Responsive Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
              Cotizaciones pagadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Item Form - Inline */}
      {showAddForm && (
        <Card className="shadow-sm md:shadow-lg border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl">Nueva Cotización (CL)</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancelAdd}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre del Producto *</label>
                <Input
                  placeholder="Ej: Laptop Dell XPS 13"
                  value={newItemForm.productName}
                  onChange={(e) => setNewItemForm({...newItemForm, productName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">ID del Proyecto *</label>
                <Input
                  placeholder="Ej: proj_123"
                  value={newItemForm.projectId}
                  onChange={(e) => setNewItemForm({...newItemForm, projectId: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre del Proveedor</label>
                <Input
                  placeholder="Ej: Dell Technologies"
                  value={newItemForm.supplierName}
                  onChange={(e) => setNewItemForm({...newItemForm, supplierName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email del Proveedor</label>
                <Input
                  type="email"
                  placeholder="Ej: ventas@dell.com"
                  value={newItemForm.supplierEmail}
                  onChange={(e) => setNewItemForm({...newItemForm, supplierEmail: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descripción</label>
              <Input
                placeholder="Descripción detallada del producto..."
                value={newItemForm.description}
                onChange={(e) => setNewItemForm({...newItemForm, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cantidad</label>
                <Input
                  type="number"
                  min="1"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm({...newItemForm, quantity: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Costo Estimado ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItemForm.estimatedCost}
                  onChange={(e) => setNewItemForm({...newItemForm, estimatedCost: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                onClick={handleAddNewItem}
                className="flex-1"
                disabled={!newItemForm.productName || !newItemForm.projectId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Cotización
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelAdd}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Progress - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Progreso por Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getStepStats().map((step, index) => (
              <div key={step.id} className="text-center">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${step.color} flex items-center justify-center text-white font-bold mx-auto mb-2`}>
                  {step.count}
                </div>
                <p className="text-xs md:text-sm font-medium line-clamp-2">{step.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((step.count / items.length) * 100) || 0}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters - Mobile Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
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
            {CL_STEPS.map(step => (
              <SelectItem key={step.id} value={step.id}>
                {step.name}
              </SelectItem>
            ))}
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
                No hay items de cotización
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || stepFilter !== 'all' 
                  ? 'No se encontraron items que coincidan con los filtros'
                  : 'Crea tu primer item de cotización desde un proyecto'
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