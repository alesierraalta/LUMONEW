'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Settings, 
  Trash2, 
  Archive, 
  ArrowRightLeft, 
  DollarSign, 
  Tag, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { InventoryItem, BulkOperation, Category, Location } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

// Bulk operation schemas
const bulkUpdateSchema = z.object({
  operationType: z.enum(['price_update', 'category_change', 'status_change', 'location_transfer']),
  // Price update fields
  priceAdjustment: z.object({
    type: z.enum(['fixed', 'percentage']),
    value: z.number().min(0),
    applyTo: z.enum(['price', 'cost', 'both'])
  }).optional(),
  // Category change fields
  newCategoryId: z.string().optional(),
  // Status change fields
  newStatus: z.enum(['active', 'inactive', 'discontinued']).optional(),
  // Location transfer fields
  newLocationId: z.string().optional(),
  // Common fields
  reason: z.string().min(1, 'Debe proporcionar una razón para la operación'),
  notes: z.string().optional(),
  requiresApproval: z.boolean().default(false)
})

const bulkDeleteSchema = z.object({
  confirmDelete: z.boolean().refine((val: boolean) => val === true, {
    message: 'Debe confirmar la eliminación'
  }),
  reason: z.string().min(1, 'Debe proporcionar una razón para la eliminación'),
  notes: z.string().optional()
})

const bulkArchiveSchema = z.object({
  reason: z.string().min(1, 'Debe proporcionar una razón para el archivado'),
  notes: z.string().optional(),
  archiveDate: z.date().optional()
})

type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>
type BulkDeleteFormData = z.infer<typeof bulkDeleteSchema>
type BulkArchiveFormData = z.infer<typeof bulkArchiveSchema>

interface BulkOperationsProps {
  selectedItems: InventoryItem[]
  isOpen: boolean
  onClose: () => void
  onBulkOperation: (operation: BulkOperation) => void
  categories: Category[]
  locations: Location[]
}

export function BulkOperations({
  selectedItems,
  isOpen,
  onClose,
  onBulkOperation,
  categories,
  locations
}: BulkOperationsProps) {
  const [operationType, setOperationType] = useState<'update' | 'delete' | 'archive'>('update')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [operationStatus, setOperationStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle')

  // Forms for different operation types
  const updateForm = useForm<BulkUpdateFormData>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      operationType: 'price_update',
      priceAdjustment: {
        type: 'percentage',
        value: 0,
        applyTo: 'price'
      },
      reason: '',
      notes: '',
      requiresApproval: false
    }
  })

  const deleteForm = useForm<BulkDeleteFormData>({
    resolver: zodResolver(bulkDeleteSchema),
    defaultValues: {
      confirmDelete: false,
      reason: '',
      notes: ''
    }
  })

  const archiveForm = useForm<BulkArchiveFormData>({
    resolver: zodResolver(bulkArchiveSchema),
    defaultValues: {
      reason: '',
      notes: '',
      archiveDate: new Date()
    }
  })

  const handleOperationTypeChange = (type: 'update' | 'delete' | 'archive') => {
    setOperationType(type)
    // Reset forms when switching operation types
    updateForm.reset()
    deleteForm.reset()
    archiveForm.reset()
    setOperationStatus('idle')
    setProgress(0)
  }

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setOperationStatus('completed')
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const onUpdateSubmit = async (data: BulkUpdateFormData) => {
    setIsProcessing(true)
    setOperationStatus('processing')
    
    try {
      const operation: BulkOperation = {
        id: `bulk_${Date.now()}`,
        type: 'update',
        entityType: 'items',
        targetIds: selectedItems.map(item => item.id),
        totalTargets: selectedItems.length,
        parameters: data,
        status: 'pending',
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
        userId: 'current_user',
        userName: 'Current User',
        requiresApproval: data.requiresApproval,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Log the bulk operation (simplified)
      console.log('Bulk operation:', {
        operationType: data.operationType,
        affectedCount: selectedItems.length,
        reason: data.reason
      })

      simulateProgress()
      onBulkOperation(operation)
      
      // Reset form after successful submission
      setTimeout(() => {
        updateForm.reset()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error processing bulk update:', error)
      setOperationStatus('error')
      setIsProcessing(false)
    }
  }

  const onDeleteSubmit = async (data: BulkDeleteFormData) => {
    setIsProcessing(true)
    setOperationStatus('processing')
    
    try {
      const operation: BulkOperation = {
        id: `bulk_${Date.now()}`,
        type: 'delete',
        entityType: 'items',
        targetIds: selectedItems.map(item => item.id),
        totalTargets: selectedItems.length,
        parameters: data,
        status: 'pending',
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
        userId: 'current_user',
        userName: 'Current User',
        requiresApproval: true, // Delete operations always require approval
        createdAt: new Date(),
        updatedAt: new Date()
      }

      simulateProgress()
      onBulkOperation(operation)
      
      setTimeout(() => {
        deleteForm.reset()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error processing bulk delete:', error)
      setOperationStatus('error')
      setIsProcessing(false)
    }
  }

  const onArchiveSubmit = async (data: BulkArchiveFormData) => {
    setIsProcessing(true)
    setOperationStatus('processing')
    
    try {
      const operation: BulkOperation = {
        id: `bulk_${Date.now()}`,
        type: 'archive',
        entityType: 'items',
        targetIds: selectedItems.map(item => item.id),
        totalTargets: selectedItems.length,
        parameters: data,
        status: 'pending',
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        errors: [],
        userId: 'current_user',
        userName: 'Current User',
        requiresApproval: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      simulateProgress()
      onBulkOperation(operation)
      
      setTimeout(() => {
        archiveForm.reset()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error processing bulk archive:', error)
      setOperationStatus('error')
      setIsProcessing(false)
    }
  }

  const getOperationIcon = (type: 'update' | 'delete' | 'archive') => {
    switch (type) {
      case 'update':
        return <Settings className="h-4 w-4" />
      case 'delete':
        return <Trash2 className="h-4 w-4" />
      case 'archive':
        return <Archive className="h-4 w-4" />
    }
  }

  const getStatusIcon = () => {
    switch (operationStatus) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const totalValue = selectedItems.reduce((sum, item) => sum + (item.price * item.currentStock), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOperationIcon(operationType)}
            Operaciones Masivas
          </DialogTitle>
          <DialogDescription>
            Realizar operaciones en {selectedItems.length} elementos seleccionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Items Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Elementos Seleccionados ({selectedItems.length})</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Valor Total:</span>
                <span className="font-medium ml-2">{formatCurrency(totalValue)}</span>
              </div>
              <div>
                <span className="text-gray-600">Stock Total:</span>
                <span className="font-medium ml-2">
                  {selectedItems.reduce((sum, item) => sum + item.currentStock, 0)} unidades
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedItems.slice(0, 5).map(item => (
                <Badge key={item.id} variant="secondary" className="text-xs">
                  {item.name}
                </Badge>
              ))}
              {selectedItems.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedItems.length - 5} más
                </Badge>
              )}
            </div>
          </div>

          {/* Operation Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={operationType === 'update' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleOperationTypeChange('update')}
              disabled={isProcessing}
            >
              <Settings className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button
              type="button"
              variant={operationType === 'archive' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleOperationTypeChange('archive')}
              disabled={isProcessing}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archivar
            </Button>
            <Button
              type="button"
              variant={operationType === 'delete' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => handleOperationTypeChange('delete')}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>

          {/* Progress Bar */}
          {operationStatus === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">Procesando operación...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-600">
                Procesando {Math.floor((progress / 100) * selectedItems.length)} de {selectedItems.length} elementos
              </p>
            </div>
          )}

          {/* Success Message */}
          {operationStatus === 'completed' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Operación completada exitosamente</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Se procesaron {selectedItems.length} elementos correctamente.
              </p>
            </div>
          )}

          {/* Error Message */}
          {operationStatus === 'error' && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Error en la operación</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Ocurrió un error al procesar la operación. Inténtelo nuevamente.
              </p>
            </div>
          )}

          {/* Update Form */}
          {operationType === 'update' && operationStatus === 'idle' && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="operationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Actualización</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de actualización" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="price_update">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Actualizar Precios
                            </div>
                          </SelectItem>
                          <SelectItem value="category_change">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Cambiar Categoría
                            </div>
                          </SelectItem>
                          <SelectItem value="status_change">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Cambiar Estado
                            </div>
                          </SelectItem>
                          <SelectItem value="location_transfer">
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="h-4 w-4" />
                              Transferir Ubicación
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price Update Fields */}
                {updateForm.watch('operationType') === 'price_update' && (
                  <>
                    <FormField
                      control={updateForm.control}
                      name="priceAdjustment.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Ajuste</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje</SelectItem>
                              <SelectItem value="fixed">Valor Fijo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="priceAdjustment.value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Valor {updateForm.watch('priceAdjustment.type') === 'percentage' ? '(%)' : '($)'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            {updateForm.watch('priceAdjustment.type') === 'percentage' 
                              ? 'Porcentaje de aumento/descuento'
                              : 'Valor fijo a sumar/restar'
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="priceAdjustment.applyTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aplicar a</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="price">Solo Precio de Venta</SelectItem>
                              <SelectItem value="cost">Solo Costo</SelectItem>
                              <SelectItem value="both">Precio y Costo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Category Change Fields */}
                {updateForm.watch('operationType') === 'category_change' && (
                  <FormField
                    control={updateForm.control}
                    name="newCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Status Change Fields */}
                {updateForm.watch('operationType') === 'status_change' && (
                  <FormField
                    control={updateForm.control}
                    name="newStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nuevo Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                            <SelectItem value="discontinued">Descontinuado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Location Transfer Fields */}
                {updateForm.watch('operationType') === 'location_transfer' && (
                  <FormField
                    control={updateForm.control}
                    name="newLocationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Ubicación</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ubicación" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location.id} value={location.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {location.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={updateForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón de la Operación *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Actualización de precios por inflación, Reorganización de inventario..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre la operación..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Requiere Aprobación
                        </FormLabel>
                        <FormDescription>
                          La operación requerirá aprobación antes de ejecutarse
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}

          {/* Delete Form */}
          {operationType === 'delete' && operationStatus === 'idle' && (
            <Form {...deleteForm}>
              <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Advertencia: Eliminación Permanente</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Esta acción eliminará permanentemente {selectedItems.length} elementos del inventario. 
                    Esta operación no se puede deshacer.
                  </p>
                </div>

                <FormField
                  control={deleteForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón de la Eliminación *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Productos obsoletos, Elementos duplicados, Limpieza de inventario..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deleteForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre la eliminación..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deleteForm.control}
                  name="confirmDelete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-red-700">
                          Confirmo que deseo eliminar permanentemente estos elementos
                        </FormLabel>
                        <FormDescription>
                          Esta acción no se puede deshacer
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}

          {/* Archive Form */}
          {operationType === 'archive' && operationStatus === 'idle' && (
            <Form {...archiveForm}>
              <form onSubmit={archiveForm.handleSubmit(onArchiveSubmit)} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Archive className="h-4 w-4" />
                    <span className="font-medium">Archivar Elementos</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Los elementos archivados se mantendrán en el sistema pero no aparecerán en las listas activas. 
                    Pueden ser restaurados posteriormente.
                  </p>
                </div>

                <FormField
                  control={archiveForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón del Archivado *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Productos fuera de temporada, Elementos inactivos, Reorganización..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={archiveForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional sobre el archivado..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          {operationType === 'update' && operationStatus === 'idle' && (
            <Button
              type="submit"
              onClick={updateForm.handleSubmit(onUpdateSubmit)}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Actualizar Elementos
            </Button>
          )}
          {operationType === 'archive' && operationStatus === 'idle' && (
            <Button
              type="submit"
              onClick={archiveForm.handleSubmit(onArchiveSubmit)}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archivar Elementos
            </Button>
          )}
          {operationType === 'delete' && operationStatus === 'idle' && (
            <Button
              type="submit"
              onClick={deleteForm.handleSubmit(onDeleteSubmit)}
              disabled={isProcessing || !deleteForm.watch('confirmDelete')}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Elementos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}