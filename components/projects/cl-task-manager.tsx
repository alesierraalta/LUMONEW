'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable
} from '@dnd-kit/core'
import { 
  CheckCircle, 
  Clock, 
  Plus,
  Search,
  Filter,
  User,
  Calendar as CalendarIcon,
  MessageSquare,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  FileText,
  CreditCard,
  Truck,
  MoreHorizontal,
  Edit3,
  Trash2,
  ArrowRight,
  X
} from 'lucide-react'
import { ProjectItem, WORKFLOW_CONFIGS } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CLTask {
  id: string
  workflowItemId: string
  stepKey: string
  title: string
  description: string
  assignedTo?: string
  assignedToName?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  notes: string[]
  attachments: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

interface CLTaskManagerProps {
  item: ProjectItem
  onStatusUpdate: (itemId: string, newStatus: string, notes?: string, cost?: number) => Promise<void>
  readonly?: boolean
}

export function CLTaskManager({ item, onStatusUpdate, readonly = false }: CLTaskManagerProps) {
  const [tasks, setTasks] = useState<CLTask[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<CLTask | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  
  // Drag & Drop states
  const [activeTask, setActiveTask] = useState<CLTask | null>(null)
  
  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedToName: '',
    dueDate: undefined as Date | undefined,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: ''
  })

  const workflowConfig = WORKFLOW_CONFIGS.CL
  
  // Tareas específicas del workflow CL
  const clWorkflowTasks = [
    {
      stepKey: 'solicitar_cotizacion',
      title: 'Solicitar cotización',
      description: 'Contactar proveedores y solicitar cotizaciones para el producto',
      priority: 'high' as const
    },
    {
      stepKey: 'pagar_cotizacion',
      title: 'Pagar cotización',
      description: 'Procesar el pago de la cotización seleccionada',
      priority: 'high' as const
    },
    {
      stepKey: 'coordinar_envio_pagar_flete',
      title: 'Coordinar envío y pagar flete',
      description: 'Coordinar el envío del producto y gestionar el pago del flete',
      priority: 'medium' as const
    },
    {
      stepKey: 'recibido',
      title: 'Recibido',
      description: 'Confirmar la recepción del producto y verificar el estado',
      priority: 'medium' as const
    }
  ]
  
  // Real users from database
  const [availableUsers, setAvailableUsers] = useState<{id: string, name: string}[]>([])
  
  // Load real users from database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users')
        const data = await response.json()
        if (data.success) {
          setAvailableUsers(data.data.map((user: any) => ({
            id: user.id,
            name: user.email.split('@')[0] // Use email prefix as name for now
          })))
        } else {
          // Fallback to single real user
          setAvailableUsers([
            { id: '3d665a99-7636-4ef9-9316-f8065d010b26', name: 'alesierraalta' }
          ])
        }
      } catch (error) {
        console.error('Error loading users:', error)
        // Fallback to single real user
        setAvailableUsers([
          { id: '3d665a99-7636-4ef9-9316-f8065d010b26', name: 'alesierraalta' }
        ])
      }
    }
    loadUsers()
  }, [])

  // Task status columns for Kanban view
  const taskColumns = [
    { key: 'pending', label: 'Pendiente', color: 'bg-gray-100 dark:bg-gray-800', count: 0 },
    { key: 'in_progress', label: 'En Progreso', color: 'bg-blue-100 dark:bg-blue-900/30', count: 0 },
    { key: 'blocked', label: 'Bloqueado', color: 'bg-red-100 dark:bg-red-900/30', count: 0 },
    { key: 'completed', label: 'Completado', color: 'bg-green-100 dark:bg-green-900/30', count: 0 }
  ]

  useEffect(() => {
    loadTasks()
  }, [item.id])

  // Función para crear tareas automáticas del workflow
  const createWorkflowTasks = async () => {
    try {
      // Verificar si ya existen tareas para este item
      if (tasks.length > 0) {
        return // Ya hay tareas creadas
      }

      // Crear tareas para cada paso del workflow CL
      for (const workflowTask of clWorkflowTasks) {
        await fetch('/api/cl-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowItemId: item.id,
            stepKey: workflowTask.stepKey,
            title: workflowTask.title,
            description: workflowTask.description,
            priority: workflowTask.priority,
            createdBy: availableUsers[0]?.id || '3d665a99-7636-4ef9-9316-f8065d010b26' // Real user ID
          })
        })
      }

      // Recargar las tareas después de crearlas
      await loadTasks()
    } catch (error) {
      console.error('Error creating workflow tasks:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/cl-tasks?workflowItemId=${item.id}`)
      const data = await response.json()
      
      if (data.success) {
        // Convert API response to component format
        const formattedTasks: CLTask[] = data.data.map((task: any) => ({
          id: task.id,
          workflowItemId: task.workflowItemId,
          stepKey: task.stepKey,
          title: task.title,
          description: task.description,
          assignedTo: task.assignedTo,
          assignedToName: task.assignedToName,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          priority: task.priority,
          status: task.status,
          notes: task.notes?.map((note: any) => note.content) || [],
          attachments: task.attachments || [],
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          createdBy: task.createdBy,
          updatedBy: task.createdBy
        }))
        setTasks(formattedTasks)
      } else {
        console.error('Error loading tasks:', data.error)
        // Fall back to empty array if API fails
        setTasks([])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      // Fall back to empty array if API fails
      setTasks([])
    }
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  // Calculate metrics
  const metrics = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  }

  // Update column counts
  taskColumns.forEach(column => {
    column.count = filteredTasks.filter(task => task.status === column.key).length
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <PlayCircle className="w-4 h-4 text-blue-600" />
      case 'blocked': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const isOverdue = (task: CLTask) => {
    return task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
  }

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/cl-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowItemId: item.id,
          stepKey: item.currentStatus,
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          assignedTo: taskForm.assignedTo,
          assignedToName: availableUsers.find(u => u.id === taskForm.assignedTo)?.name,
          dueDate: taskForm.dueDate?.toISOString(),
          createdBy: 'current-user' // Replace with actual current user ID
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Add initial note if provided
        if (taskForm.notes) {
          await fetch(`/api/cl-tasks/${data.data.id}/notes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: taskForm.notes,
              createdBy: 'current-user',
              createdByName: 'Usuario Actual'
            }),
          })
        }
        
        // Reload tasks to get updated data
        await loadTasks()
        setShowTaskModal(false)
        resetTaskForm()
      } else {
        console.error('Error creating task:', data.error)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      assignedToName: '',
      dueDate: undefined,
      priority: 'medium',
      notes: ''
    })
    setSelectedTask(null)
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/cl-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Reload tasks to get updated data
        await loadTasks()
      } else {
        console.error('Error updating task status:', data.error)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  // Estados para panel lateral de trabajo
  const [workPanelOpen, setWorkPanelOpen] = useState(false)
  const [selectedTaskForWork, setSelectedTaskForWork] = useState<CLTask | null>(null)

  // Función para abrir el panel de trabajo
  const openWorkPanel = (task: CLTask) => {
    setSelectedTaskForWork(task)
    setWorkPanelOpen(true)
  }

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveTask(null)
      return
    }
    
    const taskId = active.id as string
    const newStatus = over.id as string
    const task = tasks.find(t => t.id === taskId)
    
    if (!task || task.status === newStatus) {
      setActiveTask(null)
      return
    }
    
    // Optimistic update - update local state immediately for smooth UX
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus as any } : t
      )
    )
    
    setActiveTask(null)
    
    // Update task status via API in background
    try {
      await handleTaskStatusChange(taskId, newStatus)
    } catch (error) {
      // If API call fails, revert the optimistic update
      console.error('Failed to update task status:', error)
      await loadTasks() // Reload from server to get correct state
    }
  }

  // Draggable Task Card Component
  const DraggableTaskCard = ({ task }: { task: CLTask }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({ id: task.id })

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <Card className={`mb-3 cursor-grab hover:shadow-md transition-shadow bg-card dark:bg-card ${
          isOverdue(task) 
            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
            : ''
        } ${isDragging ? 'shadow-lg rotate-3 scale-105' : ''}`}>
          <CardContent className="p-4">
            {/* Drag Handle */}
            <div {...listeners} className="mb-3 flex justify-center py-2">
              <div className="w-12 h-2 bg-muted-foreground/40 rounded-full hover:bg-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing shadow-sm" />
            </div>
            
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 break-words">{task.title}</h4>
            <p className="text-xs text-muted-foreground mb-2 break-words">{task.description}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getStatusIcon(task.status)}
            <Button variant="ghost" size="sm" className="p-1 min-h-[32px] min-w-[32px]">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
          <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-1 w-fit`}>
            {task.priority}
          </Badge>
          {task.assignedToName && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{task.assignedToName}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${
              isOverdue(task) 
                ? 'text-red-600 dark:text-red-400 font-medium' 
                : 'text-muted-foreground'
            }`}>
              <CalendarIcon className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">{format(task.dueDate, 'dd/MM', { locale: es })}</span>
            </div>
          )}
          {task.notes.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              <span>{task.notes.length}</span>
            </div>
          )}
        </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-3 py-2 min-h-[36px] flex-1 sm:flex-none"
                onClick={() => openWorkPanel(task)}
              >
                <span className="hidden sm:inline">
                  📋 Abrir Panel de Trabajo
                </span>
                <span className="sm:hidden">
                  📋 Panel
                </span>
              </Button>
              {task.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 py-2 min-h-[36px] flex-1 sm:flex-none"
                  onClick={() => handleTaskStatusChange(task.id, 'completed')}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Completar</span>
                  <span className="sm:hidden">✓</span>
                </Button>
              )}
              {task.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 py-2 min-h-[36px] flex-1 sm:flex-none"
                  onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                >
                  <PlayCircle className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Iniciar</span>
                  <span className="sm:hidden">▶</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Static Task Card for drag overlay
  const TaskCard = ({ task }: { task: CLTask }) => (
    <Card className={`mb-3 cursor-pointer hover:shadow-md transition-shadow bg-card dark:bg-card ${
      isOverdue(task)
        ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
        : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 break-words">{task.title}</h4>
            <p className="text-xs text-muted-foreground mb-2 break-words">{task.description}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getStatusIcon(task.status)}
          </div>
        </div>
        <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-1 w-fit`}>
          {task.priority}
        </Badge>
      </CardContent>
    </Card>
  )

  // Droppable Column Component
  const DroppableColumn = ({ column, tasks }: { 
    column: { key: string; label: string; color: string; count: number }; 
    tasks: CLTask[] 
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: column.key,
    })

    return (
      <Card 
        ref={setNodeRef}
        className={`${column.color} bg-card dark:bg-card transition-all duration-200 ${
          isOver ? 'ring-2 ring-blue-500 ring-opacity-50 scale-[1.02]' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{column.label}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {column.count}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
            isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-500' : ''
          }`}>
            {tasks.map(task => (
              <DraggableTaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className={`text-center py-8 text-muted-foreground text-sm transition-all ${
                isOver ? 'text-blue-600 dark:text-blue-400' : ''
              }`}>
                {isOver ? '📋 Suelta aquí la tarea' : 'No hay tareas'}
              </div>
            )}
            {/* Drop indicator at the bottom for columns with tasks */}
            {tasks.length > 0 && isOver && (
              <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 text-center">
                <div className="text-lg mb-1">📋</div>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Suelta aquí
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Componente del Panel de Trabajo para cada tarea CL
  const CLTaskWorkPanel = ({ task, onComplete }: { task: CLTask, onComplete?: () => void }) => {
    const [workData, setWorkData] = useState({
      executionDate: new Date().toISOString().split('T')[0],
      executedBy: availableUsers[0]?.name || '',
      executedById: availableUsers[0]?.id || '',
      notes: '',
      attachments: [] as File[],
      specificData: {} as any
    })

    const renderSpecificFields = () => {
      switch (task.stepKey) {
        case 'solicitar_cotizacion':
          return (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">💰 Datos de la Cotización</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Proveedor Contactado</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={workData.specificData.supplier || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, supplier: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Método de Contacto</Label>
                  <Select
                    value={workData.specificData.contactMethod || ''}
                    onValueChange={(value) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, contactMethod: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="telefono">Teléfono</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Precio Cotizado</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={workData.specificData.quotedPrice || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, quotedPrice: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Tiempo de Entrega</Label>
                  <Input
                    placeholder="Ej: 5-7 días"
                    value={workData.specificData.deliveryTime || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, deliveryTime: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )

        case 'pagar_cotizacion':
          return (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">💳 Datos del Pago</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Monto Pagado</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={workData.specificData.amount || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, amount: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Método de Pago</Label>
                  <Select
                    value={workData.specificData.paymentMethod || ''}
                    onValueChange={(value) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, paymentMethod: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Referencia</Label>
                  <Input
                    placeholder="Ref. del pago"
                    value={workData.specificData.reference || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, reference: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Proveedor</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={workData.specificData.supplier || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, supplier: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )

        case 'coordinar_envio_pagar_flete':
          return (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">🚚 Coordinación de Envío</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Empresa de Transporte</Label>
                  <Input
                    placeholder="Nombre de la empresa"
                    value={workData.specificData.shippingCompany || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, shippingCompany: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Costo del Flete</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={workData.specificData.shippingCost || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, shippingCost: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Número de Tracking</Label>
                  <Input
                    placeholder="Tracking number"
                    value={workData.specificData.trackingNumber || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, trackingNumber: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Fecha Estimada de Llegada</Label>
                  <Input
                    type="date"
                    value={workData.specificData.estimatedArrival || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, estimatedArrival: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )

        case 'recibido':
          return (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">✅ Confirmación de Recepción</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Recepción</Label>
                  <Input
                    type="date"
                    value={workData.specificData.receivedDate || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, receivedDate: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Persona que Recibió</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={workData.specificData.receivedBy || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, receivedBy: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Estado del Producto</Label>
                  <Select
                    value={workData.specificData.condition || ''}
                    onValueChange={(value) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, condition: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado del producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perfect">Perfecto Estado</SelectItem>
                      <SelectItem value="good">Buen Estado</SelectItem>
                      <SelectItem value="damaged">Dañado</SelectItem>
                      <SelectItem value="missing">Faltante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cantidad Recibida</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={workData.specificData.quantityReceived || ''}
                    onChange={(e) => setWorkData(prev => ({
                      ...prev,
                      specificData: { ...prev.specificData, quantityReceived: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )

        default:
          return (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">📋 Datos Generales de la Tarea</h4>
              <div>
                <Label>Detalles del Trabajo Realizado</Label>
                <Textarea
                  placeholder="Describe el trabajo realizado..."
                  value={workData.specificData.workDetails || ''}
                  onChange={(e) => setWorkData(prev => ({
                    ...prev,
                    specificData: { ...prev.specificData, workDetails: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
            </div>
          )
      }
    }

    const handleSaveWorkData = async () => {
      try {
        const response = await fetch(`/api/cl-tasks/${task.id}/work-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workData)
        })

        const data = await response.json()
        if (data.success) {
          // Actualizar el estado de la tarea a completada si es necesario
          if (task.status !== 'completed') {
            await handleTaskStatusChange(task.id, 'completed')
          }
          // Recargar tareas
          await loadTasks()
          // Llamar callback de completado (para cerrar panel lateral)
          if (onComplete) {
            onComplete()
          }
        } else {
          console.error('Error saving work data:', data.error)
        }
      } catch (error) {
        console.error('Error saving work data:', error)
      }
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Fecha de Ejecución</Label>
            <Input
              type="date"
              value={workData.executionDate}
              onChange={(e) => setWorkData(prev => ({ ...prev, executionDate: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <Label>Ejecutado por</Label>
            <Select
              value={workData.executedById}
              onValueChange={(value) => {
                const user = availableUsers.find(u => u.id === value)
                setWorkData(prev => ({
                  ...prev,
                  executedById: value,
                  executedBy: user?.name || ''
                }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {renderSpecificFields()}

        <div>
          <Label>Notas Adicionales</Label>
          <Textarea
            placeholder="Notas sobre el trabajo realizado..."
            value={workData.notes}
            onChange={(e) => setWorkData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onComplete && onComplete()}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveWorkData}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px]"
          >
            💾 Guardar y Completar Tarea
          </Button>
        </div>
      </div>
    )
  }

  // Componente del Panel Lateral de Trabajo
  const WorkPanel = ({ 
    isOpen, 
    onClose, 
    task, 
    availableUsers, 
    onTaskUpdated 
  }: {
    isOpen: boolean
    onClose: () => void
    task: CLTask | null
    availableUsers: any[]
    onTaskUpdated: () => void
  }) => {
    if (!task) return null

    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={onClose}
          />
        )}
        
        {/* Panel Lateral */}
        <div className={`
          fixed top-0 right-0 h-full w-full sm:w-96 lg:w-[480px] 
          bg-background border-l border-border shadow-2xl z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-y-auto
        `}>
          {/* Header del Panel */}
          <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  Panel de Trabajo CL
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {task.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contenido del Panel */}
          <div className="p-4">
            {/* Información de la Tarea */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(task.status)}
                <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-1`}>
                  {task.priority}
                </Badge>
              </div>
              <h3 className="font-medium text-sm mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
              )}
              {task.assignedToName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>Asignado a: {task.assignedToName}</span>
                </div>
              )}
            </div>

            {/* Formulario de Trabajo */}
            <CLTaskWorkPanel 
              task={task} 
              onComplete={() => {
                onTaskUpdated()
                onClose()
              }}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard Header */}
      <Card className="bg-card dark:bg-card border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  Dashboard de Tareas CL
                </CardTitle>
                <p className="text-foreground font-medium">
                  {item.productName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Estado: {workflowConfig.statuses.find(s => s.key === item.currentStatus)?.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-card dark:bg-card border-blue-200 dark:border-blue-700">
                <FileText className="w-3 h-3 mr-1" />
                {item.productType}
              </Badge>
              {!readonly && (
                <div className="flex gap-2">
                  {tasks.length === 0 && (
                    <Button
                      onClick={createWorkflowTasks}
                      className="bg-green-600 hover:bg-green-700 shadow-lg"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Crear Tareas del Workflow
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowTaskModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Progreso del Workflow:</span>
              <Badge variant="secondary">
                {workflowConfig.statuses.findIndex(s => s.key === item.currentStatus) + 1} de {workflowConfig.statuses.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {workflowConfig.statuses.map((status, index) => {
                const isCurrent = status.key === item.currentStatus
                const isCompleted = workflowConfig.statuses.findIndex(s => s.key === item.currentStatus) > index
                
                return (
                  <div key={status.key} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < workflowConfig.statuses.length - 1 && (
                      <div
                        className={`w-12 h-1 mx-1 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Metrics Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card dark:bg-card border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total}</div>
            <div className="text-sm text-muted-foreground font-medium">Total Tareas</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card dark:bg-card border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.completed}</div>
            <div className="text-sm text-muted-foreground font-medium">Completadas</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% del total
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card dark:bg-card border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <PlayCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.inProgress}</div>
            <div className="text-sm text-muted-foreground font-medium">En Progreso</div>
            <div className="text-xs text-muted-foreground mt-1">
              Activas ahora
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card dark:bg-card border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.overdue}</div>
            <div className="text-sm text-muted-foreground font-medium">Vencidas</div>
            <div className="text-xs text-muted-foreground mt-1">
              Requieren atención
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card dark:bg-card border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.blocked}</div>
            <div className="text-sm text-muted-foreground font-medium">Bloqueadas</div>
            <div className="text-xs text-muted-foreground mt-1">
              Necesitan resolución
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="bg-card dark:bg-card shadow-sm border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            
            {/* Filter Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Estado
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📋 Todos los estados</SelectItem>
                    <SelectItem value="pending">⏳ Pendiente</SelectItem>
                    <SelectItem value="in_progress">🔄 En Progreso</SelectItem>
                    <SelectItem value="blocked">🚫 Bloqueado</SelectItem>
                    <SelectItem value="completed">✅ Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Prioridad
                </Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filtrar por prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🎯 Todas las prioridades</SelectItem>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                    <SelectItem value="high">🟠 Alta</SelectItem>
                    <SelectItem value="medium">🟡 Media</SelectItem>
                    <SelectItem value="low">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Asignado a
                </Label>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filtrar por persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 Todas las personas</SelectItem>
                    {availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>👤 {user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all') && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                <div className="flex gap-1 flex-wrap">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Búsqueda: &quot;{searchTerm}&quot;
                    </Badge>
                  )}
                  {filterStatus !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Estado: {filterStatus}
                    </Badge>
                  )}
                  {filterPriority !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Prioridad: {filterPriority}
                    </Badge>
                  )}
                  {filterAssignee !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Asignado: {availableUsers.find(u => u.id === filterAssignee)?.name}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterStatus('all')
                      setFilterPriority('all')
                      setFilterAssignee('all')
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drag & Drop Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {taskColumns.map(column => (
            <DroppableColumn
              key={column.key}
              column={column}
              tasks={filteredTasks.filter(task => task.status === column.key)}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Panel Lateral de Trabajo */}
      <WorkPanel 
        isOpen={workPanelOpen}
        onClose={() => setWorkPanelOpen(false)}
        task={selectedTaskForWork}
        availableUsers={availableUsers}
        onTaskUpdated={loadTasks}
      />

      {/* Task Creation Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Selector de Tareas Predefinidas del Workflow */}
            <div>
              <Label>Tareas del Workflow CL</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {clWorkflowTasks.map((workflowTask) => (
                  <Button
                    key={workflowTask.stepKey}
                    variant="outline"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => {
                      setTaskForm(prev => ({
                        ...prev,
                        title: workflowTask.title,
                        description: workflowTask.description,
                        priority: workflowTask.priority
                      }))
                    }}
                  >
                    <div>
                      <div className="font-medium">{workflowTask.title}</div>
                      <div className="text-sm text-muted-foreground">{workflowTask.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="title">Título de la Tarea</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Contactar proveedor para cotización"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe los detalles de la tarea..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Asignar a</Label>
                <Select
                  value={taskForm.assignedTo}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assignedTo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: any) => setTaskForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={taskForm.dueDate ? taskForm.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setTaskForm(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas Iniciales</Label>
              <Textarea
                id="notes"
                value={taskForm.notes}
                onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Agregar notas o comentarios iniciales..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTaskModal(false)
                  resetTaskForm()
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTask}
              >
                {selectedTask ? 'Actualizar Tarea' : 'Crear Tarea'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}