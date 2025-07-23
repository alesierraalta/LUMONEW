'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
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
  reason: z.string().min(1),
  notes: z.string().optional(),
  requiresApproval: z.boolean().default(false)
})

const bulkDeleteSchema = z.object({
  confirmDelete: z.boolean().refine((val: boolean) => val === true, {
    message: 'Must confirm deletion'
  }),
  reason: z.string().min(1),
  notes: z.string().optional()
})

const bulkArchiveSchema = z.object({
  reason: z.string().min(1),
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
  const t = useTranslations('inventory.bulkOperations')
  const tCommon = useTranslations('common')
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
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description', { count: selectedItems.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Items Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">{t('selectedItems', { count: selectedItems.length })}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('totalValue')}:</span>
                <span className="font-medium ml-2">{formatCurrency(totalValue)}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('totalStock')}:</span>
                <span className="font-medium ml-2">
                  {selectedItems.reduce((sum, item) => sum + item.currentStock, 0)} {t('units')}
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
                  +{selectedItems.length - 5} {t('more')}
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
              {t('update')}
            </Button>
            <Button
              type="button"
              variant={operationType === 'archive' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleOperationTypeChange('archive')}
              disabled={isProcessing}
            >
              <Archive className="h-4 w-4 mr-2" />
              {t('archive')}
            </Button>
            <Button
              type="button"
              variant={operationType === 'delete' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => handleOperationTypeChange('delete')}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('delete')}
            </Button>
          </div>

          {/* Progress Bar */}
          {operationStatus === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{t('processing')}</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-600">
                {t('processingProgress', {
                  current: Math.floor((progress / 100) * selectedItems.length),
                  total: selectedItems.length
                })}
              </p>
            </div>
          )}

          {/* Success Message */}
          {operationStatus === 'completed' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">{t('operationCompleted')}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {t('operationSuccess', { count: selectedItems.length })}
              </p>
            </div>
          )}

          {/* Error Message */}
          {operationStatus === 'error' && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{t('operationError')}</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {t('operationErrorMessage')}
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
                      <FormLabel>{t('updateType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectUpdateType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="price_update">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              {t('updatePrices')}
                            </div>
                          </SelectItem>
                          <SelectItem value="category_change">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              {t('changeCategory')}
                            </div>
                          </SelectItem>
                          <SelectItem value="status_change">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              {t('changeStatus')}
                            </div>
                          </SelectItem>
                          <SelectItem value="location_transfer">
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="h-4 w-4" />
                              {t('transferLocation')}
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
                          <FormLabel>{t('adjustmentType')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">{t('percentage')}</SelectItem>
                              <SelectItem value="fixed">{t('fixedValue')}</SelectItem>
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
                            {t('value')} {updateForm.watch('priceAdjustment.type') === 'percentage' ? '(%)' : '($)'}
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
                              ? t('percentageDescription')
                              : t('fixedValueDescription')
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
                          <FormLabel>{t('applyTo')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="price">{t('priceOnly')}</SelectItem>
                              <SelectItem value="cost">{t('costOnly')}</SelectItem>
                              <SelectItem value="both">{t('priceAndCost')}</SelectItem>
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
                        <FormLabel>{t('newCategory')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectCategory')} />
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
                        <FormLabel>{t('newStatus')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">{t('active')}</SelectItem>
                            <SelectItem value="inactive">{t('inactive')}</SelectItem>
                            <SelectItem value="discontinued">{t('discontinued')}</SelectItem>
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
                        <FormLabel>{t('newLocation')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectLocation')} />
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
                      <FormLabel>{t('operationReason')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('operationReasonPlaceholder')}
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
                      <FormLabel>{t('additionalNotes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('additionalNotesPlaceholder')}
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
                          {t('requiresApproval')}
                        </FormLabel>
                        <FormDescription>
                          {t('requiresApprovalDescription')}
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
                    <span className="font-medium">{t('permanentDeleteWarning')}</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {t('permanentDeleteMessage', { count: selectedItems.length })}
                  </p>
                </div>

                <FormField
                  control={deleteForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deleteReason')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('deleteReasonPlaceholder')}
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
                      <FormLabel>{t('additionalNotes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('deleteNotesPlaceholder')}
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
                          {t('confirmDelete')}
                        </FormLabel>
                        <FormDescription>
                          {t('cannotBeUndone')}
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
                    <span className="font-medium">{t('archiveElements')}</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {t('archiveMessage')}
                  </p>
                </div>

                <FormField
                  control={archiveForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('archiveReason')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('archiveReasonPlaceholder')}
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
                      <FormLabel>{t('additionalNotes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('archiveNotesPlaceholder')}
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
            {tCommon('cancel')}
          </Button>
          {operationType === 'update' && operationStatus === 'idle' && (
            <Button
              type="submit"
              onClick={updateForm.handleSubmit(onUpdateSubmit)}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('updateElements')}
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
              {t('archiveElements')}
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
              {t('deleteElements')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}