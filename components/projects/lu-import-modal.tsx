'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Search, Package, Plus } from 'lucide-react'
import { auditedInventoryService } from '@/lib/database-with-audit'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  unit_price: number
  categories: {
    name: string
    color: string
  }
  locations: {
    name: string
  }
}

interface LUImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: { inventoryItemId: string; quantity: number; unitPrice: number }[]) => void
  projectId: string
}

export function LUImportModal({ isOpen, onClose, onImport, projectId }: LUImportModalProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; unitPrice: number }>>(new Map())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems()
    }
  }, [isOpen])

  const fetchInventoryItems = async () => {
    setLoading(true)
    try {
      const items = await auditedInventoryService.getAll()
      // Filter only items with stock > 0
      const availableItems = items.filter((item: any) => item.quantity > 0)
      setInventoryItems(availableItems)
    } catch (error) {
      console.error('Error fetching inventory items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleItemSelect = (item: InventoryItem, checked: boolean) => {
    const newSelectedItems = new Map(selectedItems)
    
    if (checked) {
      newSelectedItems.set(item.id, {
        quantity: 1,
        unitPrice: item.unit_price
      })
    } else {
      newSelectedItems.delete(item.id)
    }
    
    setSelectedItems(newSelectedItems)
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelectedItems = new Map(selectedItems)
    const currentItem = newSelectedItems.get(itemId)
    
    if (currentItem && quantity > 0) {
      newSelectedItems.set(itemId, {
        ...currentItem,
        quantity: Math.min(quantity, inventoryItems.find(item => item.id === itemId)?.quantity || 1)
      })
      setSelectedItems(newSelectedItems)
    }
  }

  const handleImport = () => {
    const itemsToImport = Array.from(selectedItems.entries()).map(([inventoryItemId, { quantity, unitPrice }]) => ({
      inventoryItemId,
      quantity,
      unitPrice
    }))
    
    onImport(itemsToImport)
    setSelectedItems(new Map())
    onClose()
  }

  const handleClose = () => {
    setSelectedItems(new Map())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Importar Productos del Inventario (LU)
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar productos en inventario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Items Summary */}
          {selectedItems.size > 0 && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedItems.size} producto{selectedItems.size !== 1 ? 's' : ''} seleccionado{selectedItems.size !== 1 ? 's' : ''}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-300">
                  Total: {formatCurrency(
                    Array.from(selectedItems.values()).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                  )}
                </span>
              </div>
            </Card>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles en inventario'}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id)
                const selectedData = selectedItems.get(item.id)
                
                return (
                  <Card key={item.id} className={`p-4 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemSelect(item, checked as boolean)}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.sku}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.categories?.color || '#gray' }}
                            />
                            <span className="text-xs text-gray-500">{item.categories?.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Stock disponible: {item.quantity}</span>
                          <span>Precio: {formatCurrency(item.unit_price)}</span>
                          <span>Ubicación: {item.locations?.name}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Cantidad:</label>
                          <Input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={selectedData?.quantity || 1}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={selectedItems.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Importar {selectedItems.size} Producto{selectedItems.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 