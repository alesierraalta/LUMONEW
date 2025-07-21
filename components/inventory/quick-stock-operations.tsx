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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Package, AlertTriangle } from 'lucide-react'
import { InventoryItem, QuickStockOperation, InventoryMovement } from '@/lib/types'
import { formatCurrency, getStockStatus, getStatusColor } from '@/lib/utils'

const quickStockSchema = z.object({
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  reason: z.string().min(1, 'Debe proporcionar una razón para el ajuste'),
  notes: z.string().optional(),
})

type QuickStockFormData = z.infer<typeof quickStockSchema>

interface QuickStockOperationsProps {
  item: InventoryItem
  isOpen: boolean
  onClose: () => void
  onStockUpdate: (itemId: string, newStock: number, operation: QuickStockOperation) => void
}

export function QuickStockOperations({
  item,
  isOpen,
  onClose,
  onStockUpdate,
}: QuickStockOperationsProps) {
  const [operationType, setOperationType] = useState<'add' | 'subtract'>('add')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuickStockFormData>({
    resolver: zodResolver(quickStockSchema),
    defaultValues: {
      quantity: 1,
      reason: '',
      notes: '',
    },
  })

  const handleOperation = async (type: 'add' | 'subtract') => {
    setOperationType(type)
    // Reset form when switching operation type
    form.reset({
      quantity: 1,
      reason: '',
      notes: '',
    })
  }

  const onSubmit = async (data: QuickStockFormData) => {
    setIsSubmitting(true)
    
    try {
      const adjustmentQuantity = operationType === 'add' ? data.quantity : -data.quantity
      const newStock = Math.max(0, item.currentStock + adjustmentQuantity)
      
      // Validate that subtraction doesn't result in negative stock
      if (operationType === 'subtract' && newStock < 0) {
        form.setError('quantity', {
          message: `No se puede restar ${data.quantity}. Stock disponible: ${item.currentStock}`,
        })
        setIsSubmitting(false)
        return
      }

      // Create the operation record
      const operation: QuickStockOperation = {
        id: `qso_${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        locationId: item.locationId,
        locationName: item.location?.name || 'Unknown',
        operation: operationType,
        quantity: data.quantity,
        reason: 'adjustment', // Map to valid enum value
        notes: data.notes,
        previousStock: item.currentStock,
        newStock,
        userId: 'current_user', // In real app, get from auth context
        userName: 'Current User',
        requiresApproval: false,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      }

      // Log the stock adjustment (simplified)
      console.log('Stock adjustment:', {
        itemId: item.id,
        itemName: item.name,
        previousStock: item.currentStock,
        newStock,
        operation: operationType,
        reason: data.reason,
        notes: data.notes
      })

      // Call the parent component's update handler
      onStockUpdate(item.id, newStock, operation)
      
      // Reset form and close dialog
      form.reset()
      onClose()
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStockStatus = getStockStatus(item.currentStock, item.minimumLevel)
  const projectedStock = operationType === 'add'
    ? item.currentStock + (form.watch('quantity') || 0)
    : Math.max(0, item.currentStock - (form.watch('quantity') || 0))
  const projectedStatus = getStockStatus(projectedStock, item.minimumLevel)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajuste Rápido de Stock
          </DialogTitle>
          <DialogDescription>
            Sumar o restar stock rápidamente para: <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Stock Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Stock Actual:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{item.currentStock}</span>
                <Badge className={getStatusColor(currentStockStatus)}>
                  {currentStockStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Nivel Mínimo: {item.minimumLevel}</span>
              <span>Precio: {formatCurrency(item.price)}</span>
            </div>
          </div>

          {/* Operation Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={operationType === 'add' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleOperation('add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sumar Stock
            </Button>
            <Button
              type="button"
              variant={operationType === 'subtract' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleOperation('subtract')}
            >
              <Minus className="h-4 w-4 mr-2" />
              Restar Stock
            </Button>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cantidad a {operationType === 'add' ? 'sumar' : 'restar'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={operationType === 'subtract' ? item.currentStock : undefined}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {operationType === 'subtract' &&
                        `Máximo disponible: ${item.currentStock}`
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón del ajuste *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Recepción de mercancía, Venta directa, Ajuste de inventario..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Información adicional sobre el ajuste..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Projected Stock Preview */}
              {form.watch('quantity') > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Vista Previa del Cambio
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">
                      Stock después del ajuste:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-800">{projectedStock}</span>
                      <Badge className={getStatusColor(projectedStatus)}>
                        {projectedStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {projectedStatus === 'bajo_stock' && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ El stock resultante estará por debajo del nivel mínimo
                    </p>
                  )}
                  {projectedStatus === 'agotado' && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ El producto quedará agotado
                    </p>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={operationType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isSubmitting ? 'Procesando...' : (
              <>
                {operationType === 'add' ? (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Sumar Stock
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 mr-2" />
                    Restar Stock
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}