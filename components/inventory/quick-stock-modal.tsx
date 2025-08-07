'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModal } from '@/components/ui/modal'
import { Plus, Minus, Save, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
// Removed direct database import - now using API endpoint
import { useAuth } from '@/lib/auth/auth-context'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('inventory.quickStock')
  const tCommon = useTranslations('common')

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
        title: t('validationError'),
        description: t('completeAllFields')
      })
      return
    }

    const adjustmentQuantity = parseInt(quantity)
    if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
      addToast({
        type: 'error',
        title: t('validationError'),
        description: t('quantityMustBePositive')
      })
      return
    }

    // Check if subtraction would result in negative stock
    if (operation === 'subtract' && adjustmentQuantity > item.quantity) {
      addToast({
        type: 'error',
        title: t('insufficientStock'),
        description: t('cannotSubtractUnits', { quantity: adjustmentQuantity, currentStock: item.quantity })
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
      const response = await fetch(`/api/inventory?id=${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: newStock
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update inventory item')
      }

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
        userName: user?.user_metadata?.full_name || user?.email || t('user'),
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
        title: t('stockUpdated'),
        description: t('stockUpdateSuccess', {
          operation: operation === 'add' ? t('added') : t('subtracted'),
          quantity: adjustmentQuantity,
          itemName: item.name
        })
      })

      onStockUpdated()
      handleClose()
    } catch (error) {
      console.error('Error updating stock:', error)
      addToast({
        type: 'error',
        title: t('updateError'),
        description: t('updateErrorMessage')
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
  const t = useTranslations('inventory.quickStock')
  const tCommon = useTranslations('common')
  
  const reasonOptions = [
    { value: 'received', label: t('reasons.received') },
    { value: 'sold', label: t('reasons.sold') },
    { value: 'damaged', label: t('reasons.damaged') },
    { value: 'expired', label: t('reasons.expired') },
    { value: 'found', label: t('reasons.found') },
    { value: 'lost', label: t('reasons.lost') },
    { value: 'adjustment', label: t('reasons.adjustment') },
    { value: 'return', label: t('reasons.return') },
    { value: 'other', label: t('reasons.other') }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('title')}</h2>
      </div>
      
      <div className="space-y-6">
        {/* Item Info */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium text-foreground">{item.name}</h3>
          <p className="text-sm text-visible-dark">{t('sku')}: {item.sku}</p>
          <p className="text-sm text-visible-dark">{t('currentStock')}: <span className="font-medium text-foreground">{item.quantity}</span></p>
          {item.quantity <= item.min_stock && (
            <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">⚠️ {t('lowStock', { minimum: item.min_stock })}</p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Operation Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('operation')}</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={operation === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperation('add')}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('addStock')}
              </Button>
              <Button
                type="button"
                variant={operation === 'subtract' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperation('subtract')}
                className="flex-1"
              >
                <Minus className="mr-2 h-4 w-4" />
                {t('subtractStock')}
              </Button>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium text-foreground">
              {t('quantity')} *
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('enterQuantity')}
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium text-foreground">
              {t('reason')} *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              required
            >
              <option value="">{t('selectReason')}</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {quantity && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{t('preview')}:</strong> {item.quantity} → {
                  operation === 'add'
                    ? item.quantity + parseInt(quantity || '0')
                    : item.quantity - parseInt(quantity || '0')
                } {t('units')}
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
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={operation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('processing')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {operation === 'add' ? t('add') : t('subtract')} {t('stock')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}