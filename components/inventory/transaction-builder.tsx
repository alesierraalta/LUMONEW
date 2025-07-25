'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Plus,
  Minus,
  X,
  Search,
  ShoppingCart,
  Package,
  Scan,
  Save,
  Calculator,
  GripVertical,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { InventoryItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { auditedInventoryService } from '@/lib/database-with-audit'

// Transaction line item interface
interface TransactionLineItem {
  id: string
  product: InventoryItem
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

// Transaction interface
interface Transaction {
  id: string
  type: 'sale' | 'stock_addition'
  lineItems: TransactionLineItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  notes?: string
  createdAt: Date
  createdBy: string
}

interface TransactionBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: Transaction) => void
  initialMode?: 'sale' | 'stock_addition'
}

// Transform database inventory item to Transaction Builder format
const transformInventoryItem = (dbItem: any): InventoryItem => {
  return {
    id: dbItem.id,
    sku: dbItem.sku,
    name: dbItem.name,
    description: dbItem.description || '',
    categoryId: dbItem.category_id,
    category: dbItem.categories ? {
      id: dbItem.categories.id,
      name: dbItem.categories.name,
      color: dbItem.categories.color,
      description: '',
      parentId: undefined,
      level: 0,
      path: [],
      itemCount: 0,
      totalValue: 0,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
      updatedBy: '',
      syncStatus: 'synced'
    } : undefined,
    price: dbItem.unit_price,
    cost: dbItem.unit_price * 0.6, // Estimate cost as 60% of price if not available
    margin: dbItem.unit_price * 0.4, // Estimate margin as 40% of price
    currentStock: dbItem.quantity,
    minimumLevel: dbItem.min_stock,
    maximumLevel: dbItem.max_stock,
    status: dbItem.status as 'active' | 'inactive' | 'discontinued' | 'pending',
    locationId: dbItem.location_id,
    location: dbItem.locations ? {
      id: dbItem.locations.id,
      name: dbItem.locations.name,
      description: dbItem.locations.type,
      itemQuantity: 0
    } : undefined,
    tags: [],
    images: [],
    lastUpdated: new Date(dbItem.updated_at),
    createdAt: new Date(dbItem.created_at),
    updatedAt: new Date(dbItem.updated_at),
    createdBy: 'system',
    updatedBy: 'system',
    syncStatus: 'synced',
    autoReorder: false,
    barcode: dbItem.sku // Use SKU as barcode if no specific barcode field
  }
}

export function TransactionBuilder({ isOpen, onClose, onSave, initialMode = 'sale' }: TransactionBuilderProps) {
  const [transactionType, setTransactionType] = useState<'sale' | 'stock_addition'>(initialMode)
  const [lineItems, setLineItems] = useState<TransactionLineItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [taxRate, setTaxRate] = useState(0.16) // 16% tax rate
  const [notes, setNotes] = useState('')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      if (!isOpen) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await auditedInventoryService.getAll()
        const transformedProducts = data.map(transformInventoryItem)
        setProducts(transformedProducts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
        console.error('Error fetching inventory:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [isOpen])

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    )
  }, [searchTerm, products])

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const tax = subtotal * taxRate
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }, [lineItems, taxRate])

  // Add product to transaction
  const addProduct = useCallback((product: InventoryItem, quantity: number = 1) => {
    const existingItemIndex = lineItems.findIndex(item => item.product.id === product.id)
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...lineItems]
      const existingItem = updatedItems[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity
      const unitPrice = transactionType === 'sale' ? product.price : product.cost
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newQuantity * unitPrice
      }
      setLineItems(updatedItems)
    } else {
      // Add new item
      const unitPrice = transactionType === 'sale' ? product.price : product.cost
      const newItem: TransactionLineItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice
      }
      setLineItems([...lineItems, newItem])
    }
    
    setSearchTerm('')
    setShowProductSearch(false)
  }, [lineItems, transactionType])

  // Update quantity for line item
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeLineItem(itemId)
      return
    }
    
    setLineItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          : item
      )
    )
  }, [])

  // Update unit price for line item
  const updateUnitPrice = useCallback((itemId: string, newUnitPrice: number) => {
    if (newUnitPrice < 0) return
    
    setLineItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, unitPrice: newUnitPrice, totalPrice: item.quantity * newUnitPrice }
          : item
      )
    )
  }, [])

  // Remove line item
  const removeLineItem = useCallback((itemId: string) => {
    setLineItems(items => items.filter(item => item.id !== itemId))
  }, [])

  // Handle SKU scan/input
  const handleSkuInput = useCallback((sku: string) => {
    const product = products.find(p => p.sku === sku)
    if (product) {
      addProduct(product)
      setBarcodeInput('')
    } else {
      // Show error or not found message
      console.log('Product not found for SKU:', sku)
      setError(`Product not found for SKU: ${sku}`)
    }
  }, [addProduct, products])

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetItemId) return
    
    const draggedIndex = lineItems.findIndex(item => item.id === draggedItem)
    const targetIndex = lineItems.findIndex(item => item.id === targetItemId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newItems = [...lineItems]
    const [draggedItemData] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItemData)
    
    setLineItems(newItems)
    setDraggedItem(null)
  }

  // Save transaction
  const handleSave = useCallback(() => {
    if (lineItems.length === 0) return
    
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: transactionType,
      lineItems,
      subtotal: calculations.subtotal,
      tax: calculations.tax,
      taxRate,
      total: calculations.total,
      notes,
      createdAt: new Date(),
      createdBy: 'current-user' // In real app, get from auth context
    }
    
    onSave(transaction)
    
    // Reset form
    setLineItems([])
    setNotes('')
    setSearchTerm('')
    onClose()
  }, [lineItems, transactionType, calculations, taxRate, notes, onSave, onClose])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLineItems([])
      setNotes('')
      setSearchTerm('')
      setShowProductSearch(false)
      setBarcodeInput('')
      setError(null)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transactionType === 'sale' ? (
              <>
                <ShoppingCart className="h-5 w-5" />
                Transaction Builder - Sale
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Transaction Builder - Stock Addition
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {transactionType === 'sale' 
              ? 'Create a new sales transaction by adding products and quantities.'
              : 'Add stock to inventory by selecting products and quantities to receive.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Mode Toggle and Controls */}
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <Select value={transactionType} onValueChange={(value: 'sale' | 'stock_addition') => setTransactionType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Sale Transaction
                    </div>
                  </SelectItem>
                  <SelectItem value="stock_addition">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Stock Addition
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* SKU Scanner Input */}
              <div className="flex items-center gap-2">
                <Scan className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Scan or enter SKU"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && barcodeInput) {
                      handleSkuInput(barcodeInput)
                    }
                  }}
                  className="w-48"
                />
              </div>
            </div>

            <Button
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>

          {/* Product Search */}
          {showProductSearch && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, SKU, or barcode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading products...</div>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                        </div>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => addProduct(product)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                <Badge variant="outline">{product.sku}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{product.description}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm">
                                  Stock: <span className="font-medium">{product.currentStock}</span>
                                </span>
                                <span className="text-sm">
                                  Price: <span className="font-medium">{formatCurrency(product.price)}</span>
                                </span>
                                {transactionType === 'stock_addition' && (
                                  <span className="text-sm">
                                    Cost: <span className="font-medium">{formatCurrency(product.cost)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Line Items */}
          <div className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Transaction Items ({lineItems.length})</span>
                  {lineItems.length > 0 && (
                    <Badge variant="secondary">
                      {formatCurrency(calculations.total)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {lineItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No items added yet</p>
                      <p className="text-sm text-muted-foreground">
                        Use the search above or scan a barcode to add products
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-96">
                    {lineItems.map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item.id)}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.product.name}</span>
                            <Badge variant="outline">{item.product.sku}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Stock: {item.product.currentStock}</span>
                            <span>Original: {formatCurrency(transactionType === 'sale' ? item.product.price : item.product.cost)}</span>
                          </div>
                        </div>

                        {/* Unit Price Controls */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Unit Price</label>
                          <Input
                            type="number"
                            value={item.unitPrice.toFixed(2)}
                            onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-center"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Quantity</label>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center h-8"
                              min="1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="text-right min-w-24">
                          <div className="text-xs text-muted-foreground mb-1">Total</div>
                          <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLineItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          {lineItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                      <span className="font-medium">{formatCurrency(calculations.tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculations.total)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Tax Rate (%)</label>
                      <Input
                        type="number"
                        value={(taxRate * 100).toFixed(1)}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                        step="0.1"
                        min="0"
                        max="100"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add transaction notes..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lineItems.length > 0 && (
                <>
                  <AlertCircle className="h-4 w-4" />
                  {lineItems.length} item{lineItems.length !== 1 ? 's' : ''} • {formatCurrency(calculations.total)}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={lineItems.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Transaction
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}