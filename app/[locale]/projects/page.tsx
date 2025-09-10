'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ProjectDashboard } from '@/components/projects/project-dashboard'
import { ProjectForm } from '@/components/projects/project-form'
import { WorkflowTracker } from '@/components/projects/workflow-tracker'
import { LUImportModal } from '@/components/projects/lu-import-modal'
import { AddItemModal } from '@/components/projects/add-item-modal'
import { InventoryDashboard } from '@/components/projects/inventory-dashboard'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  FileText,
  Receipt,
  ArrowLeft,
  X,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Download,
  Upload,
  Share2,
  MessageSquare,
  Target,
  Zap,
  Activity,
  PieChart,
  CalendarDays,
  Columns,
  List,
  Grid3x3,
  Building2,
  ShoppingCart,
  Truck,
  Plane,
  HelpCircle
} from 'lucide-react'
import { Project, ProjectFormData, ProjectItem } from '@/lib/types'

// Dynamic import for tutorial overlay
const InventoryTutorial = lazy(() => import('@/components/inventory/inventory-tutorial').then(mod => ({ default: mod.InventoryTutorial })))

// Enhanced project management interface
export default function ProjectsPage() {
  const t = useTranslations()
  const router = useRouter()
  const [activeView, setActiveView] = useState<'overview' | 'inventory' | 'kanban' | 'timeline' | 'analytics'>('overview')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  // Mock current user - replace with actual auth
  const currentUser = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Usuario Admin'
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.success) {
        setProjects(data.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      if (data.success) {
        setSelectedProject(data.data)
        setShowProjectDetails(true)
        return data.data
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
    }
    return null
  }

  const handleLUImport = (items: { inventoryItemId: string; quantity: number; unitPrice: number }[]) => {
    try {
      // Handle LU import logic here
      console.log('LU Import:', items)
    } catch (error) {
      console.error('Error in LU import:', error)
    }
  }

  const handleCLStart = (data: any) => {
    try {
      // Handle CL start logic here
      console.log('CL Start:', data)
    } catch (error) {
      console.error('Error starting CL:', error)
    }
  }

  const handleIMPStart = (data: any) => {
    try {
      // Handle IMP start logic here
      console.log('IMP Start:', data)
    } catch (error) {
      console.error('Error starting IMP:', error)
    }
  }

  const handleCreateProject = async (formData: ProjectFormData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: currentUser.id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setProjects([data.data, ...projects])
        setShowCreateModal(false)
        // Navigate to the new project
        router.push(`/projects/${data.data.id}`)
      } else {
        throw new Error(data.error || 'Error creating project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
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

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'LU': return <Package className="w-5 h-5 text-green-600" />
      case 'CL': return <FileText className="w-5 h-5 text-blue-600" />
      case 'IMP': 
      case 'MP': return <Plane className="w-5 h-5 text-purple-600" />
      default: return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'LU': return 'bg-green-100 text-green-800 border-green-200'
      case 'CL': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IMP':
      case 'MP': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Calculate general project statistics
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
    overdue: projects.filter(p => {
      const dueDate = new Date((p as any).dueDate || '')
      return p.status === 'active' && dueDate < new Date()
    }).length,
    totalValue: projects.reduce((sum, p) => sum + ((p as any).budget || 0), 0),
    avgProgress: projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Proyectos</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Project Details Modal/Sidebar - This is where product types (LU, CL, IMP) are shown
  if (showProjectDetails && selectedProject) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowProjectDetails(false)
                setSelectedProject(null)
              }}
              className="flex items-center gap-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver a Proyectos</span>
              <span className="sm:hidden">Volver</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">{selectedProject.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`${getStatusColor(selectedProject.status)} text-white text-xs`}>
                  {selectedProject.status}
                </Badge>
                <Badge className={`${getPriorityColor(selectedProject.priority)} text-white text-xs`}>
                  {selectedProject.priority}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedProject.progress}% completado
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
                        <p className="text-lg md:text-2xl font-bold text-foreground">{selectedProject.progress}%</p>
                      </div>
                      <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    </div>
                    <Progress value={selectedProject.progress} className="mt-2 md:mt-4" />
                  </CardContent>
                </Card>

                <Card className="shadow-sm md:shadow-lg">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Productos</p>
                        <p className="text-lg md:text-2xl font-bold text-foreground">
                          {((selectedProject as any).project_items?.length || 0) + ((selectedProject as any).workflow_items?.length || 0)}
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
                          ${((selectedProject as any).budget || 0).toLocaleString()}
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
                        <p className="text-base md:text-lg font-bold text-foreground capitalize">{selectedProject.status}</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Descripción del Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedProject.description || 'Sin descripción disponible'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Productos del Proyecto</CardTitle>
                    <Button 
                      onClick={() => setShowAddItemModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Combine project_items and workflow_items
                    const projectItems = (selectedProject as any).project_items || []
                    const workflowItems = (selectedProject as any).workflow_items || []
                    
                    // Convert workflow_items to the same format as project_items
                    const normalizedWorkflowItems = workflowItems.map((item: any) => ({
                      id: item.id,
                      productType: item.product_type,
                      productName: item.product_name,
                      productDescription: item.step_data?.productDescription || 'Producto en workflow',
                      quantity: item.step_data?.quantity || 1,
                      unitPrice: item.step_data?.quotationAmount || item.step_data?.piAmount || 0,
                      totalPrice: (item.step_data?.quotationAmount || item.step_data?.piAmount || 0) * (item.step_data?.quantity || 1),
                      isCompleted: item.is_completed || false,
                      currentStep: item.current_step,
                      stepData: item.step_data
                    }))
                    
                    const allItems = [...projectItems, ...normalizedWorkflowItems]
                    
                    return allItems.length > 0 ? (
                      <div className="space-y-4">
                        {allItems.map((item: any) => (
                          <div key={`${item.productType}-${item.id}`} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {getProductTypeIcon(item.productType)}
                                <div>
                                  <h3 className="font-semibold">{item.productName}</h3>
                                  <p className="text-sm text-gray-600">{item.productDescription}</p>
                                  {item.currentStep && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Paso actual: {item.currentStep}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs border ${getProductTypeColor(item.productType)}`}>
                                  {item.productType}
                                </Badge>
                                <Badge variant={item.isCompleted ? "default" : "secondary"} className="text-xs">
                                  {item.isCompleted ? 'Completado' : 'En Proceso'}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Cantidad:</span>
                                <span className="ml-2 font-medium">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Precio Unit.:</span>
                                <span className="ml-2 font-medium">${item.unitPrice?.toLocaleString() || '0'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Total:</span>
                                <span className="ml-2 font-medium">${item.totalPrice?.toLocaleString() || '0'}</span>
                              </div>
                            </div>
                            {/* Show workflow-specific info for CL and IMP items */}
                            {(item.productType === 'CL' || item.productType === 'IMP') && item.stepData && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                  {item.productType === 'CL' && item.stepData.supplierName && (
                                    <span className="mr-4">Proveedor: {item.stepData.supplierName}</span>
                                  )}
                                  {item.productType === 'IMP' && item.stepData.supplierName && (
                                    <span className="mr-4">Proveedor: {item.stepData.supplierName}</span>
                                  )}
                                  {item.stepData.shippingType && (
                                    <span className="mr-4">Envío: {item.stepData.shippingType}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No hay productos aún</h3>
                        <p className="text-gray-500 mb-4">Agrega productos LU, CL o IMP a este proyecto</p>
                        <Button 
                          onClick={() => setShowAddItemModal(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Primer Producto
                        </Button>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows">
              <Card>
                <CardHeader>
                  <CardTitle>Workflows de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Combine project_items and workflow_items for workflows
                    const projectItems = (selectedProject as any).project_items || []
                    const workflowItems = (selectedProject as any).workflow_items || []
                    
                    // Convert workflow_items to the same format as project_items for WorkflowTracker
                    const normalizedWorkflowItems = workflowItems.map((item: any) => ({
                      id: item.id,
                      productType: item.product_type,
                      productName: item.product_name,
                      productDescription: item.step_data?.productDescription || 'Producto en workflow',
                      quantity: item.step_data?.quantity || 1,
                      unitPrice: item.step_data?.quotationAmount || item.step_data?.piAmount || 0,
                      totalPrice: (item.step_data?.quotationAmount || item.step_data?.piAmount || 0) * (item.step_data?.quantity || 1),
                      isCompleted: item.is_completed || false,
                      currentStep: item.current_step,
                      stepData: item.step_data,
                      isWorkflowItem: true // Flag to identify workflow items
                    }))
                    
                    const allItems = [...projectItems, ...normalizedWorkflowItems]
                    
                    return allItems.length > 0 ? (
                      <div className="space-y-6">
                        {allItems.map((item: any) => (
                          <WorkflowTracker
                            key={`${item.isWorkflowItem ? 'workflow' : 'project'}-${item.id}`}
                            item={item}
                            onStatusUpdate={async () => {
                              console.log('Status update needed for:', item.productName)
                              // Refresh project details after workflow update
                              if (selectedProject) {
                                const updatedProject = await fetchProjectDetails(selectedProject.id)
                                setSelectedProject(updatedProject)
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No hay workflows activos</h3>
                        <p className="text-gray-500">Los workflows aparecerán cuando agregues productos al proyecto</p>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Tipo de Producto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Inventario (LU)</span>
                        </div>
                        <span className="font-medium">
                          {(() => {
                            const projectLU = (selectedProject as any).project_items?.filter((item: any) => item.productType === 'LU').length || 0
                            const workflowLU = (selectedProject as any).workflow_items?.filter((item: any) => item.product_type === 'LU').length || 0
                            return projectLU + workflowLU
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Cotizaciones (CL)</span>
                        </div>
                        <span className="font-medium">
                          {(() => {
                            const projectCL = (selectedProject as any).project_items?.filter((item: any) => item.productType === 'CL').length || 0
                            const workflowCL = (selectedProject as any).workflow_items?.filter((item: any) => item.product_type === 'CL').length || 0
                            return projectCL + workflowCL
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-600">Importaciones (IMP)</span>
                        </div>
                        <span className="font-medium">
                          {(() => {
                            const projectIMP = (selectedProject as any).project_items?.filter((item: any) => item.productType === 'IMP' || item.productType === 'MP').length || 0
                            const workflowIMP = (selectedProject as any).workflow_items?.filter((item: any) => item.product_type === 'IMP' || item.product_type === 'MP').length || 0
                            return projectIMP + workflowIMP
                          })()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Completitud</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completados</span>
                        <span className="font-medium">
                          {(() => {
                            const projectCompleted = (selectedProject as any).project_items?.filter((item: any) => item.isCompleted).length || 0
                            const workflowCompleted = (selectedProject as any).workflow_items?.filter((item: any) => item.is_completed).length || 0
                            return projectCompleted + workflowCompleted
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">En Proceso</span>
                        <span className="font-medium">
                          {(() => {
                            const projectInProgress = (selectedProject as any).project_items?.filter((item: any) => !item.isCompleted).length || 0
                            const workflowInProgress = (selectedProject as any).workflow_items?.filter((item: any) => !item.is_completed).length || 0
                            return projectInProgress + workflowInProgress
                          })()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Extra padding for mobile scroll */}
          <div className="h-12 md:h-16"></div>
        </div>

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold text-foreground">Agregar Producto al Proyecto</h2>
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
                projectId={selectedProject?.id || ''}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main Projects Page - General project management view
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-12 md:pb-16 safe-area-pb overflow-y-auto min-h-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Proyectos</h2>
          <p className="text-muted-foreground text-sm">Administra y supervisa todos tus proyectos</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" id="proj-export">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" id="proj-import">
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTutorialOpen(true)} aria-label="Abrir tutorial de proyectos" id="proj-help">
            <HelpCircle className="w-4 h-4 mr-2" />
            Tutorial
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            id="proj-add"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Navigation Tabs - Mobile Responsive */}
      <div className="border-b border-border" id="proj-tabs">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex-shrink-0 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeView === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">Vista General</span>
              <span className="sm:hidden">General</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`flex-shrink-0 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeView === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="sm:hidden">Stock</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('kanban')}
            className={`flex-shrink-0 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeView === 'kanban'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4" />
              Kanban
            </div>
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex-shrink-0 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeView === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Cronograma</span>
              <span className="sm:hidden">Timeline</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex-shrink-0 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeView === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analíticas</span>
              <span className="sm:hidden">Analytics</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content - Mobile Responsive */}
      <div className="space-y-6 min-h-0 flex-1">
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards - Mobile Responsive Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Proyectos</p>
                      <p className="text-lg md:text-3xl font-bold text-foreground">{projectStats.total}</p>
                    </div>
                    <Building2 className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Activos</p>
                      <p className="text-lg md:text-3xl font-bold text-green-600">{projectStats.active}</p>
                    </div>
                    <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Completados</p>
                      <p className="text-lg md:text-3xl font-bold text-blue-600">{projectStats.completed}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm md:shadow-lg">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Atrasados</p>
                      <p className="text-lg md:text-3xl font-bold text-red-600">{projectStats.overdue}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search - Mobile Responsive */}
            <Card className="shadow-sm md:shadow-lg" id="proj-filters">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar proyectos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">Activo</option>
                      <option value="completed">Completado</option>
                      <option value="on_hold">En pausa</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    >
                      <option value="all">Todas las prioridades</option>
                      <option value="urgent">Urgente</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects Grid - Mobile Responsive */}
            <div className="w-full" id="proj-grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 auto-rows-fr">
                {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer shadow-sm h-full flex flex-col">
                  <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-lg text-foreground truncate">{project.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-3 flex-shrink-0">
                          <Badge className={`text-xs ${getStatusColor(project.status)} text-white`}>
                            {project.status}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(project.priority)} text-white`}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progreso</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{project.totalItems || 0} items</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${((project as any).budget || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t mt-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="flex-1 text-xs md:text-sm"
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          <span className="hidden sm:inline">Ver Detalles</span>
                          <span className="sm:hidden">Ver</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs md:text-sm"
                        >
                          <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>

            {filteredProjects.length === 0 && (
              <div className="w-full mb-12 md:mb-16">
                <Card className="shadow-sm md:shadow-lg">
                  <CardContent className="p-8 md:p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <Target className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg md:text-xl font-medium text-foreground mb-2">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'No se encontraron proyectos'
                          : 'No hay proyectos aún'
                        }
                      </h3>
                      <p className="text-gray-500 mb-6 text-sm md:text-base">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Crea tu primer proyecto para comenzar a gestionar tus tareas'
                        }
                      </p>
                      <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primer Proyecto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeView === 'inventory' && (
          <div className="space-y-6">
            <InventoryDashboard
              onAddLU={() => setShowAddItemModal(true)}
              onAddCL={() => setShowAddItemModal(true)}
              onAddIMP={() => setShowAddItemModal(true)}
            />
          </div>
        )}

        {/* Kanban Tab */}
        {activeView === 'kanban' && (
          <Card className="mb-12 md:mb-16">
            <CardContent className="p-8 md:p-12 text-center">
              <Columns className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-medium text-foreground mb-2">Vista Kanban</h3>
              <p className="text-gray-500 text-sm md:text-base">Próximamente disponible</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline Tab */}
        {activeView === 'timeline' && (
          <Card className="mb-12 md:mb-16">
            <CardContent className="p-8 md:p-12 text-center">
              <CalendarDays className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-medium text-foreground mb-2">Vista de Cronograma</h3>
              <p className="text-gray-500 text-sm md:text-base">Próximamente disponible</p>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeView === 'analytics' && (
          <div className="space-y-6 mb-12 md:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Activos</span>
                      <span className="font-medium">{projectStats.active}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completados</span>
                      <span className="font-medium">{projectStats.completed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">En pausa</span>
                      <span className="font-medium">{projectStats.onHold}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progreso Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {projectStats.avgProgress.toFixed(1)}%
                    </div>
                    <Progress value={projectStats.avgProgress} className="mb-4" />
                    <p className="text-sm text-gray-600">Progreso general de todos los proyectos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Valor Total de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ${projectStats.totalValue.toLocaleString()}
                  </div>
                  <p className="text-gray-600">Valor combinado de todos los proyectos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Extra padding for mobile scroll */}
        <div className="h-12 md:h-16"></div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-end mb-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                size="sm"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {isTutorialOpen && (
        <Suspense fallback={null}>
          <InventoryTutorial
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
            steps={[
              { id: 'add', target: '#proj-add', title: 'Nuevo proyecto', description: 'Crea un proyecto para organizar productos y workflows (LU, CL, IMP).', placement: 'bottom' },
              { id: 'import', target: '#proj-import', title: 'Importar proyectos', description: 'Carga proyectos desde un archivo para acelerar la configuración.', placement: 'bottom' },
              { id: 'export', target: '#proj-export', title: 'Exportar proyectos', description: 'Descarga tus proyectos para respaldo o análisis.', placement: 'bottom' },
              { id: 'tabs', target: '#proj-tabs', title: 'Vistas', description: 'Alterna entre General, Stock, Kanban, Cronograma y Analíticas.', placement: 'bottom' },
              { id: 'filters', target: '#proj-filters', title: 'Búsqueda y filtros', description: 'Filtra por estado, prioridad y busca por nombre o descripción.', placement: 'bottom' },
              { id: 'grid', target: '#proj-grid', title: 'Lista de proyectos', description: 'Explora y gestiona tus proyectos desde esta cuadrícula.', placement: 'top' }
            ]}
          />
        </Suspense>
      )}
    </div>
  )
} 