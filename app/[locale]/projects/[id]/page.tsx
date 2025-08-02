'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { WorkflowTracker } from '@/components/projects/workflow-tracker'
import { AddItemModal } from '@/components/projects/add-item-modal'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  ArrowLeft,
  X,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  FileText,
  Share2,
  Settings,
  Plane
} from 'lucide-react'
import { Project } from '@/lib/types'

interface ProjectPageProps {
  params: {
    id: string
    locale: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddItemModal, setShowAddItemModal] = useState(false)

  // Mock current user - replace with actual auth
  const currentUser = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Usuario Admin'
  }

  useEffect(() => {
    fetchProjectDetails()
  }, [params.id])

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setProject(data.data)
      } else {
        // Redirect to projects if project not found
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleLUImport = async (data: any) => {
    if (!project) return

    try {
      const response = await fetch('/api/projects/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          inventoryId: data.inventoryId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          notes: data.notes,
          createdBy: currentUser.id
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchProjectDetails() // Refresh project data
        setShowAddItemModal(false)
      } else {
        console.error('Error importing LU item:', result.error)
      }
    } catch (error) {
      console.error('Error importing LU item:', error)
    }
  }

  const handleCLStart = async (data: any) => {
    if (!project) return

    try {
      const response = await fetch('/api/projects/workflow-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          productType: 'CL',
          productName: data.productName,
          currentStep: 'cl_step2',
          stepData: {
            ...data,
            completedSteps: ['cl_step1']
          },
          createdBy: currentUser.id
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchProjectDetails()
        setShowAddItemModal(false)
      } else {
        console.error('Error creating CL workflow item:', result.error)
      }
    } catch (error) {
      console.error('Error creating CL workflow item:', error)
    }
  }

  const handleIMPStart = async (data: any) => {
    if (!project) return

    try {
      const response = await fetch('/api/projects/workflow-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          productType: 'IMP',
          productName: data.productName,
          currentStep: 'imp_step2',
          stepData: {
            ...data,
            completedSteps: ['imp_step1']
          },
          createdBy: currentUser.id
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchProjectDetails()
        setShowAddItemModal(false)
      } else {
        console.error('Error creating IMP workflow item:', result.error)
      }
    } catch (error) {
      console.error('Error creating IMP workflow item:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'on_hold': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cargando Proyecto...</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h2>
          <Button onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Proyectos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver a Proyectos</span>
            <span className="sm:hidden">Volver</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">{project.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                {project.status}
              </Badge>
              <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                {project.priority}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {project.progress}% completado
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Share2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Compartir</span>
            <span className="sm:hidden">Share</span>
          </Button>
          <Button 
            onClick={() => setShowAddItemModal(true)}
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Project Details Content - Mobile Responsive */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Resumen</TabsTrigger>
            <TabsTrigger value="products" className="text-xs md:text-sm">Productos</TabsTrigger>
            <TabsTrigger value="workflows" className="text-xs md:text-sm">Workflows</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm">Analíticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Project Overview Cards - Mobile Responsive */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Progreso General</p>
                      <p className="text-lg md:text-2xl font-bold text-foreground">{project.progress}%</p>
                    </div>
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <Progress value={project.progress} className="mt-2 md:mt-4" />
                </CardContent>
              </Card>

              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Productos</p>
                      <p className="text-lg md:text-2xl font-bold text-foreground">
                        {((project as any).project_items?.length || 0) + ((project as any).workflow_items?.length || 0)}
                      </p>
                    </div>
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Presupuesto</p>
                      <p className="text-lg md:text-2xl font-bold text-foreground">
                        ${((project as any).budget || 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Estado</p>
                      <p className="text-base md:text-lg font-bold text-foreground capitalize">{project.status}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Types Overview - Mobile Responsive */}
            <Card className="shadow-sm md:shadow-lg">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Tipos de Productos en este Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-green-800 text-sm md:text-base">Inventario (LU)</h3>
                      <p className="text-xs md:text-sm text-green-600">Productos del stock VLN</p>
                      <p className="text-xs text-green-500 mt-1">Disponibles inmediatamente</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-blue-800 text-sm md:text-base">Cotizaciones (CL)</h3>
                      <p className="text-xs md:text-sm text-blue-600">Productos por cotizar</p>
                      <p className="text-xs text-blue-500 mt-1">Requiere proceso de cotización</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
                    <Plane className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-purple-800 text-sm md:text-base">Importaciones (IMP)</h3>
                      <p className="text-xs md:text-sm text-purple-600">Productos importados</p>
                      <p className="text-xs text-purple-500 mt-1">Proceso completo de importación</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Description */}
            <Card className="shadow-sm md:shadow-lg">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Descripción del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description || 'Sin descripción disponible'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="shadow-sm md:shadow-lg">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Productos del Inventario (LU)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(project as any).project_items?.length > 0 ? (
                    (project as any).project_items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{item.name || 'Producto'}</h4>
                          <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                        </div>
                        <Badge variant="outline">LU</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay productos de inventario en este proyecto
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <Card className="shadow-sm md:shadow-lg">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Workflows (CL/IMP)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(project as any).workflow_items?.length > 0 ? (
                    (project as any).workflow_items.map((item: any) => (
                      <WorkflowTracker
                        key={item.id}
                        item={{
                          id: item.id,
                          projectId: item.project_id,
                          productType: item.product_type,
                          productName: item.product_name,
                          currentStatus: item.current_step,
                          quantity: 1,
                          statusHistory: [],
                          attachments: [],
                          isCompleted: false,
                          createdAt: item.created_at,
                          updatedAt: item.updated_at,
                          createdBy: 'system',
                          updatedBy: 'system'
                        }}
                        onStatusUpdate={async (itemId: string, newStatus: string, notes?: string, cost?: number) => {
                          await fetchProjectDetails()
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay workflows en este proyecto
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-sm md:shadow-lg">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Estadísticas del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Productos por Tipo</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Inventario (LU)</span>
                        <span className="font-medium">{(project as any).project_items?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Workflows (CL/IMP)</span>
                        <span className="font-medium">{(project as any).workflow_items?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Estado General</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Progreso</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Extra padding for mobile scroll */}
        <div className="h-12 md:h-16"></div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Agregar Producto al Proyecto</h2>
              <Button
                variant="ghost"
                onClick={() => setShowAddItemModal(false)}
                size="sm"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
            <AddItemModal
              isOpen={true}
              onClose={() => setShowAddItemModal(false)}
              onLUImport={handleLUImport}
              onCLStart={handleCLStart}
              onIMPStart={handleIMPStart}
              projectId={project.id}
            />
          </div>
        </div>
      )}
    </div>
  )
} 