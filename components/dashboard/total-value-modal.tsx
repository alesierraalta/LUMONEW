'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, Search, Filter } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit_price: number
  category_id?: string
  location_id?: string
  status: string
  min_stock?: number
  max_stock?: number
}

interface TotalValueModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TotalValueModal({ isOpen, onClose }: TotalValueModalProps) {
  const t = useTranslations('dashboard')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'quantity'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems()
    }
  }, [isOpen])

  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      // Fetch all inventory items by setting a high limit to avoid pagination issues
      const response = await fetch('/api/inventory/items?limit=999999')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items')
      }
      
      const data = await response.json()
      const inventoryItems = Array.isArray(data) ? data : (data.data || [])
      setItems(inventoryItems)
    } catch (error) {
      console.error('Error fetching inventory items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedItems = items
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'value':
          aValue = a.quantity * a.unit_price
          bValue = b.quantity * b.unit_price
          break
        case 'quantity':
          aValue = a.quantity
          bValue = b.quantity
          break
        default:
          aValue = a.quantity * a.unit_price
          bValue = b.quantity * b.unit_price
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const totalItems = items.length
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { status: 'out', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    if (item.quantity <= (item.min_stock || 0)) return { status: 'low', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' }
    return { status: 'good', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Sin stock'
      case 'low': return 'Stock bajo'
      case 'good': return 'Stock óptimo'
      default: return 'Desconocido'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Desglose del Valor Total del Inventario
          </DialogTitle>
          <DialogDescription>
            Lista detallada de todos los productos con sus precios y valores individuales
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor total del inventario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(totalItems)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Artículos en inventario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cantidad Total</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(totalQuantity)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unidades en stock
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'value' | 'quantity')}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="value">Ordenar por valor</option>
                <option value="name">Ordenar por nombre</option>
                <option value="quantity">Ordenar por cantidad</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                <Filter className="h-4 w-4" />
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Items List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando inventario...</p>
                </div>
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos en el inventario'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAndSortedItems.map((item) => {
                    const itemValue = item.quantity * item.unit_price
                    const stockStatus = getStockStatus(item)
                    
                    return (
                      <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                              </div>
                              <Badge className={stockStatus.color}>
                                {getStockStatusText(stockStatus.status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground">Cantidad</p>
                              <p className="font-medium">{formatNumber(item.quantity)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-muted-foreground">Precio unitario</p>
                              <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-muted-foreground">Valor total</p>
                              <p className="font-bold text-green-600">{formatCurrency(itemValue)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredAndSortedItems.length} de {totalItems} productos
            </p>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}