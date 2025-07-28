'use client'

import { useState, useEffect } from 'react'
import { ProjectDashboard } from '@/components/projects/project-dashboard'
import { ProjectForm } from '@/components/projects/project-form'
import { WorkflowTracker } from '@/components/projects/workflow-tracker'
import { LUImportModal } from '@/components/projects/lu-import-modal'
import { AddItemModal } from '@/components/projects/add-item-modal'
import { WorkflowItemsList } from '@/components/projects/workflow-item-tracker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  FileText,
  Receipt
} from 'lucide-react'
import { Project, ProjectFormData, ProjectItem } from '@/lib/types'
import { RecentProjects } from '@/components/projects/recent-projects'

export default function ProjectsPage() {
  const [view, setView] = useState<'dashboard' | 'list' | 'details'>('dashboard')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showLUImportModal, setShowLUImportModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // TODO: Get current user from auth context
  // For now, we'll use a placeholder - this should be replaced with actual auth
  const currentUser = {
    id: '00000000-0000-0000-0000-000000000000', // This should come from Supabase auth
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

  const handleCreateProject = async (formData: ProjectFormData) => {
    try {
      console.log('🚀 Creating project with data:', formData)
      
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
      console.log('📡 API Response:', data)
      
      if (data.success) {
        console.log('✅ Project created successfully')
        setProjects([data.data, ...projects])
        setShowCreateModal(false)
        // Optionally switch to project details view
        setSelectedProject(data.data)
        setView('details')
      } else {
        console.error('❌ API Error:', data.error)
        throw new Error(data.error || 'Error desconocido al crear el proyecto')
      }
    } catch (error) {
      console.error('❌ Network/Client Error:', error)
      throw error // Re-throw to be handled by the form
    }
  }

  const handleAddProjectItem = async (projectId: string, itemData: any) => {
    try {
      const response = await fetch('/api/projects/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...itemData,
          projectId,
          createdBy: currentUser.id
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh project details
        if (selectedProject && selectedProject.id === projectId) {
          const updatedProject = await fetchProjectDetails(projectId)
          setSelectedProject(updatedProject)
        }
        setShowItemModal(false)
      }
    } catch (error) {
      console.error('Error adding project item:', error)
    }
  }

  const handleLUImport = async (items: { inventoryItemId: string; quantity: number; unitPrice: number }[]) => {
    if (!selectedProject) return

    try {
      // Import each selected inventory item as a project item
      for (const item of items) {
        const response = await fetch('/api/projects/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: selectedProject.id,
            productType: 'LU',
            productName: 'Producto del Inventario', // This will be updated with actual product name
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            inventoryItemId: item.inventoryItemId,
            createdBy: currentUser.id
          }),
        })

        const data = await response.json()
        if (!data.success) {
          console.error('Error importing item:', data.error)
        }
      }

      // Refresh project data
      const updatedProject = await fetchProjectDetails(selectedProject.id)
      setSelectedProject(updatedProject)
      setShowItemModal(false)
    } catch (error) {
      console.error('Error importing LU items:', error)
    }
  }

  const handleCLStart = async (data: any) => {
    if (!selectedProject) return

    try {
      // Create a new workflow item for CL type
      const response = await fetch('/api/projects/workflow-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          productType: 'CL',
          productName: data.productName,
          currentStep: 'cl_step2', // Move to step 2 after completing step 1
          stepData: {
            ...data,
            completedSteps: ['cl_step1']
          },
          createdBy: currentUser.id
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Refresh project data
        const updatedProject = await fetchProjectDetails(selectedProject.id)
        setSelectedProject(updatedProject)
      } else {
        console.error('Error creating CL workflow item:', result.error)
      }
    } catch (error) {
      console.error('Error creating CL workflow item:', error)
    }
  }

  const handleIMPStart = async (data: any) => {
    if (!selectedProject) return

    try {
      // Create a new workflow item for IMP type
      const response = await fetch('/api/projects/workflow-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          productType: 'IMP',
          productName: data.productName,
          currentStep: 'imp_step2', // Move to step 2 after completing step 1
          stepData: {
            ...data,
            completedSteps: ['imp_step1']
          },
          createdBy: currentUser.id
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Refresh project data
        const updatedProject = await fetchProjectDetails(selectedProject.id)
        setSelectedProject(updatedProject)
      } else {
        console.error('Error creating IMP workflow item:', result.error)
      }
    } catch (error) {
      console.error('Error creating IMP workflow item:', error)
    }
  }

  const handleStepComplete = async (itemId: string, nextStepId: string, stepData: any) => {
    try {
      const response = await fetch(`/api/projects/workflow-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentStep: nextStepId,
          stepData: stepData,
          updatedBy: currentUser.id
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Refresh project data
        if (selectedProject) {
          const updatedProject = await fetchProjectDetails(selectedProject.id)
          setSelectedProject(updatedProject)
        }
      } else {
        console.error('Error updating workflow step:', result.error)
      }
    } catch (error) {
      console.error('Error updating workflow step:', error)
    }
  }

  const handleItemUpdate = async (itemId: string) => {
    // Refresh project data when an item is updated
    if (selectedProject) {
      const updatedProject = await fetchProjectDetails(selectedProject.id)
      setSelectedProject(updatedProject)
    }
  }

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      if (data.success) {
        return data.data
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
    }
    return null
  }

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'LU': return <Package className="w-4 h-4 text-green-600" />
      case 'CL': return <FileText className="w-4 h-4 text-blue-600" />
      case 'MP': return <Receipt className="w-4 h-4 text-purple-600" />
      default: return <Package className="w-4 h-4 text-gray-600" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'on_hold': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="space-y-6">
        <ProjectDashboard onCreateProject={() => setShowCreateModal(true)} />
        
        <RecentProjects onSelectProject={(project) => {
          setSelectedProject(project)
          setView('details')
        }} />
        
        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={() => setView('list')}
            variant="outline"
          >
            Ver Todos los Proyectos
          </Button>
        </div>

        {/* Create Project Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl">
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Project List View
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Proyectos</h1>
            <p className="text-gray-600">Gestiona todos tus proyectos y su progreso</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="on_hold">En pausa</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge className={`text-xs ${getPriorityColor(project.priority)} text-white`}>
                      {project.priority}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(project.status)} text-white`}>
                      {project.status}
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
                   <span>Items: {project.totalItems}</span>
                   <span>Estado: {project.status}</span>
                 </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProject(project)
                      setView('details')
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron proyectos con los filtros aplicados'
                : 'No hay proyectos aún. ¡Crea tu primer proyecto!'
              }
            </p>
          </Card>
        )}

        {/* Create Project Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl">
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Project Details View
  if (view === 'details' && selectedProject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
              <Badge className={`${getStatusColor(selectedProject.status)} text-white`}>
                {selectedProject.status}
              </Badge>
              <Badge className={`${getPriorityColor(selectedProject.priority)} text-white`}>
                {selectedProject.priority}
              </Badge>
            </div>
            <p className="text-gray-600 mt-2">{selectedProject.description}</p>
                         <div className="flex gap-6 mt-4 text-sm text-gray-600">
               <span>Progreso: {selectedProject.progress}%</span>
               <span>Items: {selectedProject.totalItems}</span>
               <span>Estado: {selectedProject.status}</span>
             </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setView('list')}
            >
              Volver a Lista
            </Button>
            <Button 
              onClick={() => setShowLUImportModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Importar del Inventario
            </Button>
            <Button 
              onClick={() => setShowItemModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Item
            </Button>
          </div>
        </div>

        {/* Project Items */}
        <div className="space-y-6">
          {(selectedProject as any).project_items && (selectedProject as any).project_items.length > 0 ? (
            (selectedProject as any).project_items.map((item: ProjectItem) => (
              <WorkflowTracker
                key={item.id}
                item={item}
                onStatusUpdate={async () => {
                  // TODO: Implement status update for legacy items
                  console.log('Status update needed')
                }}
              />
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                Este proyecto no tiene items aún. ¡Agrega el primer item!
              </p>
              <Button 
                onClick={() => setShowItemModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Item
              </Button>
            </Card>
          )}
        </div>

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={showItemModal}
          onClose={() => setShowItemModal(false)}
          onLUImport={handleLUImport}
          onCLStart={handleCLStart}
          onIMPStart={handleIMPStart}
          projectId={selectedProject?.id || ''}
        />

        {/* Workflow Items Section */}
        {selectedProject && (selectedProject as any).workflowItems && (selectedProject as any).workflowItems.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Items en Proceso</h3>
              <div className="text-sm text-gray-500">
                {(selectedProject as any).workflowItems.filter((item: any) => item.currentStep !== 'completed').length} en progreso, {' '}
                {(selectedProject as any).workflowItems.filter((item: any) => item.currentStep === 'completed').length} completados
              </div>
            </div>
            
            <WorkflowItemsList
              items={(selectedProject as any).workflowItems || []}
              onStepComplete={handleStepComplete}
              onItemUpdate={handleItemUpdate}
            />
          </div>
        )}

        {/* LU Import Modal */}
        <LUImportModal
          isOpen={showLUImportModal}
          onClose={() => setShowLUImportModal(false)}
          onImport={handleLUImport}
          projectId={selectedProject?.id || ''}
        />
      </div>
    )
  }

  return null
} 