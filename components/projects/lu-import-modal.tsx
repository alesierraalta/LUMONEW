'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Search, Package, Plus, ShoppingCart } from 'lucide-react'
// Removed direct database import - now using API endpoint
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
      const response = await fetch('/api/inventory/items?withStock=true')
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`Failed to fetch inventory items: ${response.status} ${errorText}`)
      }
      const items = await response.json()
      console.log('Fetched inventory items:', items)
      
      // Validate items structure
      if (!Array.isArray(items)) {
        console.error('Invalid response format - expected array:', items)
        throw new Error('Invalid response format from API')
      }
      
      setInventoryItems(items)
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      // Set empty array on error to prevent crashes
      setInventoryItems([])
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
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col bg-card">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-xl">
              <Package className="w-6 h-6 text-foreground/70" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">Inventario Local VLN</div>
              <div className="text-sm text-muted-foreground font-normal">Selecciona productos del stock disponible</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Enhanced Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              placeholder="🔍 Buscar por nombre, SKU o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 text-base border-input focus:border-ring focus:ring-ring bg-card"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Enhanced Selected Items Summary */}
          {selectedItems.size > 0 && (
            <Card className="p-4 bg-muted/40 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {selectedItems.size} producto{selectedItems.size !== 1 ? 's' : ''} seleccionado{selectedItems.size !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Listo para agregar al proyecto
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(
                      Array.from(selectedItems.values()).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Valor total</div>
                </div>
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
                const totalValue = selectedData ? selectedData.quantity * selectedData.unitPrice : 0
                
                return (
                  <Card key={item.id} className={`p-4 transition-all duration-200 hover:shadow ${
                    isSelected 
                      ? 'ring-2 ring-ring shadow-md' 
                      : 'bg-card'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleItemSelect(item, checked as boolean)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground text-base">{item.name}</h4>
                          <Badge variant="outline" className="text-xs font-mono bg-muted text-foreground/90">
                            {item.sku}
                          </Badge>
                          {item.categories && (
                            <div className="flex items-center gap-1 bg-muted rounded-full px-2 py-1 border border-border">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.categories.color || '#gray' }}
                              />
                              <span className="text-xs font-medium text-muted-foreground">{item.categories.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                            <Package className="w-4 h-4 text-foreground/70" />
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Stock</div>
                              <div className="font-bold text-foreground">{item.quantity}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                            <span className="text-foreground/70">💰</span>
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Precio</div>
                              <div className="font-bold text-foreground">{formatCurrency(item.unit_price)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                            <span className="text-foreground/70">📍</span>
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Ubicación</div>
                              <div className="font-bold text-foreground truncate">{item.locations?.name || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="bg-muted rounded-lg p-3 border border-border">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-foreground">Cantidad:</label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={selectedData?.quantity || 1}
                                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                  className="w-24 h-10 text-center font-bold border-input focus:border-ring focus:ring-ring"
                                />
                                <span className="text-xs text-muted-foreground">/ {item.quantity} disponibles</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground font-medium">Subtotal</div>
                                <div className="text-lg font-bold text-foreground">
                                  {formatCurrency(totalValue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Enhanced Actions */}
          <div className="flex flex-col justify-start items-stretch gap-3 pt-4 border-t border-border bg-muted/40 rounded-t-xl -mx-6 -mb-6 px-6 py-4 w-full">
            <div className="text-sm text-muted-foreground w-full text-left">
              {filteredItems.length > 0 && (
                <span>
                  {(() => {
                    const availableCount = filteredItems.length
                    const noun = availableCount === 1 ? 'producto' : 'productos'
                    const adj = availableCount === 1 ? 'disponible' : 'disponibles'
                    return `📦 ${availableCount} ${noun} ${adj}`
                  })()}
                  {selectedItems.size > 0 && (
                    <span className="ml-2 text-foreground font-medium">
                      • {selectedItems.size} seleccionados
                    </span>
                  )}
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="border-border hover:bg-accent w-full"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={selectedItems.size === 0}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:shadow-none w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {selectedItems.size === 0 
                  ? 'Selecciona productos' 
                  : `Agregar ${selectedItems.size} Producto${selectedItems.size !== 1 ? 's' : ''} al Proyecto`
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}