'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  Trash2,
  Download,
  Edit,
  Package,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface BulkActionsProps {
  selectedItems: string[]
  totalItems: number
  onClearSelection: () => void
  onBulkDelete: (itemIds: string[]) => Promise<void>
  onBulkExport: (itemIds: string[]) => Promise<void>
  onBulkUpdate: (itemIds: string[], updates: any) => Promise<void>
  onBulkStockAdjustment: (itemIds: string[], adjustment: number, reason: string) => Promise<void>
}

export function BulkActions({
  selectedItems,
  totalItems,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkUpdate,
  onBulkStockAdjustment
}: BulkActionsProps) {
  const t = useTranslations('inventory')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState('')
  const [stockReason, setStockReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    try {
      await onBulkDelete(selectedItems)
      setShowDeleteDialog(false)
      onClearSelection()
    } catch (error) {
      console.error('Error in bulk delete:', error)
      alert('Error al eliminar items. Por favor, inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkExport = async () => {
    setIsProcessing(true)
    try {
      await onBulkExport(selectedItems)
    } catch (error) {
      console.error('Error in bulk export:', error)
      alert('Error al exportar items. Por favor, inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkStockAdjustment = async () => {
    if (!stockAdjustment || !stockReason) {
      alert('Por favor, completa todos los campos')
      return
    }

    const adjustment = parseFloat(stockAdjustment)
    if (isNaN(adjustment)) {
      alert('Por favor, ingresa un número válido para el ajuste')
      return
    }

    setIsProcessing(true)
    try {
      await onBulkStockAdjustment(selectedItems, adjustment, stockReason)
      setShowStockDialog(false)
      setStockAdjustment('')
      setStockReason('')
      onClearSelection()
    } catch (error) {
      console.error('Error in bulk stock adjustment:', error)
      alert('Error al ajustar stock. Por favor, inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedItems.length} {selectedItems.length === 1 ? 'item seleccionado' : 'items seleccionados'}
          </span>
          {selectedItems.length !== totalItems && (
            <Badge variant="outline" className="text-xs">
              de {totalItems} visibles
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Deseleccionar todo
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                <MoreHorizontal className="h-3 w-3 mr-1" />
                Acciones en lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowStockDialog(true)}>
                <Package className="h-4 w-4 mr-2" />
                Ajustar Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajuste de Stock en Lote</DialogTitle>
            <DialogDescription>
              Ajustar el stock de {selectedItems.length} items seleccionados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment" className="text-right">
                Ajuste
              </Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="ej: +10 o -5"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Razón
              </Label>
              <Input
                id="reason"
                placeholder="ej: Inventario físico"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStockDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkStockAdjustment}
              disabled={isProcessing || !stockAdjustment || !stockReason}
            >
              {isProcessing ? 'Procesando...' : 'Aplicar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar {selectedItems.length} items seleccionados?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}