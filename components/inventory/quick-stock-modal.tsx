'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModal } from '@/components/ui/modal'
import { Plus, Minus, Save, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { auditedInventoryService } from '@/lib/database-with-audit'
import { useAuth } from '@/lib/auth/auth-context'

interface InventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  min_stock: number
}

interface QuickStockModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  onStockUpdated: () => void
  initialOperation?: 'add' | 'subtract'
}

interface StockAdjustment {
  id: string
  itemId: string
  itemName: string
  itemSku: string
  operation: 'add' | 'subtract'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  userId: string
  userName: string
  timestamp: Date
}

export function QuickStockModal({ isOpen, onClose, item, onStockUpdated, initialOperation = 'add' }: QuickStockModalProps) {
  const [operation, setOperation] = useState<'add' | 'subtract'>(initialOperation)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()
  const { user } = useAuth()
  const { openModal, closeModal } = useModal()

  const handleClose = () => {
    setQuantity('')
    setReason('')
    setOperation(initialOperation)
    closeModal()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!item || !quantity || !reason.trim()) {
      addToast({
        type: 'error',
        title: 'Error de validación',
        description: 'Por favor completa todos los campos requeridos'
      })
      return
    }

    const adjustmentQuantity = parseInt(quantity)
    if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
      addToast({
        type: 'error',
        title: 'Error de validación',
        description: 'La cantidad debe ser un número positivo'
      })
      return
    }

    // Check if subtraction would result in negative stock
    if (operation === 'subtract' && adjustmentQuantity > item.quantity) {
      addToast({
        type: 'error',
        title: 'Stock insuficiente',
        description: `No puedes restar ${adjustmentQuantity} unidades. Stock actual: ${item.quantity}`
      })
      return
    }

    setIsSubmitting(true)

    try {
      const previousStock = item.quantity
      const newStock = operation === 'add' 
        ? previousStock + adjustmentQuantity 
        : previousStock - adjustmentQuantity

      // Update the inventory item
      await auditedInventoryService.update(item.id, {
        quantity: newStock
      })

      // Create stock adjustment record for history
      const stockAdjustment: Omit<StockAdjustment, 'id'> = {
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        operation,
        quantity: adjustmentQuantity,
        previousStock,
        newStock,
        reason: reason.trim(),
        userId: user?.id || 'unknown',
        userName: user?.user_metadata?.full_name || user?.email || 'Usuario',
        timestamp: new Date()
      }

      // Save to localStorage for now (in a real app, this would go to a database)
      const existingHistory = JSON.parse(localStorage.getItem('stockAdjustmentHistory') || '[]')
      const newRecord = {
        ...stockAdjustment,
        id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      existingHistory.unshift(newRecord)
      
      // Keep only last 1000 records
      if (existingHistory.length > 1000) {
        existingHistory.splice(1000)
      }
      
      localStorage.setItem('stockAdjustmentHistory', JSON.stringify(existingHistory))

      addToast({
        type: 'success',
        title: 'Stock actualizado',
        description: `${operation === 'add' ? 'Agregadas' : 'Restadas'} ${adjustmentQuantity} unidades de ${item.name}`
      })

      onStockUpdated()
      handleClose()
    } catch (error) {
      console.error('Error updating stock:', error)
      addToast({
        type: 'error',
        title: 'Error al actualizar stock',
        description: 'No se pudo actualizar el stock. Por favor intenta de nuevo.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset operation when modal opens with new item
  React.useEffect(() => {
    if (isOpen && item) {
      setOperation(initialOperation)
    }
  }, [isOpen, item, initialOperation])

  // Open modal when isOpen changes
  React.useEffect(() => {
    if (isOpen && item) {
      openModal(
        <QuickStockModalContent
          item={item}
          operation={operation}
          setOperation={setOperation}
          quantity={quantity}
          setQuantity={setQuantity}
          reason={reason}
          setReason={setReason}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />,
        { size: 'md' }
      )
    } else if (!isOpen) {
      closeModal()
    }
  }, [isOpen, item, operation, quantity, reason, isSubmitting])

  return null
}

interface QuickStockModalContentProps {
  item: InventoryItem
  operation: 'add' | 'subtract'
  setOperation: (op: 'add' | 'subtract') => void
  quantity: string
  setQuantity: (q: string) => void
  reason: string
  setReason: (r: string) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

function QuickStockModalContent({
  item,
  operation,
  setOperation,
  quantity,
  setQuantity,
  reason,
  setReason,
  isSubmitting,
  onSubmit,
  onClose
}: QuickStockModalContentProps) {
  const reasonOptions = [
    { value: 'received', label: 'Mercancía recibida' },
    { value: 'sold', label: 'Venta realizada' },
    { value: 'damaged', label: 'Producto dañado' },
    { value: 'expired', label: 'Producto vencido' },
    { value: 'found', label: 'Inventario encontrado' },
    { value: 'lost', label: 'Inventario perdido' },
    { value: 'adjustment', label: 'Ajuste de inventario' },
    { value: 'return', label: 'Devolución' },
    { value: 'other', label: 'Otro motivo' }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ajuste Rápido de Stock</h2>
      </div>
      
      <div className="space-y-6">
        {/* Item Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-600">SKU: {item.sku}</p>
          <p className="text-sm text-gray-600">Stock actual: <span className="font-medium">{item.quantity}</span></p>
          {item.quantity <= item.min_stock && (
            <p className="text-sm text-yellow-600 font-medium">⚠️ Stock bajo (mínimo: {item.min_stock})</p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Operation Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Operación</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={operation === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperation('add')}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Stock
              </Button>
              <Button
                type="button"
                variant={operation === 'subtract' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperation('subtract')}
                className="flex-1"
              >
                <Minus className="mr-2 h-4 w-4" />
                Restar Stock
              </Button>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Cantidad *
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ingresa la cantidad"
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium text-gray-700">
              Motivo *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar motivo</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {quantity && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Vista previa:</strong> {item.quantity} → {
                  operation === 'add' 
                    ? item.quantity + parseInt(quantity || '0')
                    : item.quantity - parseInt(quantity || '0')
                } unidades
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={operation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {operation === 'add' ? 'Agregar' : 'Restar'} Stock
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}