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

// Mock products data - in real app this would come from API
const mockProducts: InventoryItem[] = [
  {
    id: '1',
    sku: 'WH-001',
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones',
    categoryId: '1',
    price: 199.99,
    cost: 120.00,
    margin: 39.99,
    currentStock: 25,
    minimumLevel: 20,
    status: 'active',
    locationId: '1',
    tags: ['electronics', 'audio', 'wireless'],
    images: ['/images/headphones.jpg'],
    lastUpdated: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
    updatedBy: 'admin',
    syncStatus: 'synced',
    autoReorder: true,
    autoReorderQuantity: 50,
    barcode: '1234567890123'
  },
  {
    id: '2',
    sku: 'UC-002',
    name: 'USB-C Cable',
    description: 'High-speed USB-C charging cable 2m',
    categoryId: '2',
    price: 24.99,
    cost: 8.50,
    margin: 65.99,
    currentStock: 150,
    minimumLevel: 50,
    status: 'active',
    locationId: '1',
    tags: ['cables', 'usb-c', 'charging'],
    images: ['/images/usb-cable.jpg'],
    lastUpdated: new Date('2024-01-14'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-14'),
    createdBy: 'admin',
    updatedBy: 'manager1',
    syncStatus: 'synced',
    autoReorder: true,
    autoReorderQuantity: 100,
    barcode: '1234567890124'
  },
  {
    id: '3',
    sku: 'BS-003',
    name: 'Bluetooth Speaker',
    description: 'Portable waterproof Bluetooth speaker',
    categoryId: '1',
    price: 89.99,
    cost: 45.00,
    margin: 49.99,
    currentStock: 8,
    minimumLevel: 15,
    status: 'active',
    locationId: '2',
    tags: ['electronics', 'audio', 'bluetooth', 'waterproof'],
    images: ['/images/speaker.jpg'],
    lastUpdated: new Date('2024-01-13'),
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-13'),
    createdBy: 'admin',
    updatedBy: 'employee1',
    syncStatus: 'synced',
    autoReorder: true,
    autoReorderQuantity: 30,
    barcode: '1234567890125'
  }
]

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

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return mockProducts
    return mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    )
  }, [searchTerm])

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

  // Handle barcode scan/input
  const handleBarcodeInput = useCallback((barcode: string) => {
    const product = mockProducts.find(p => p.barcode === barcode)
    if (product) {
      addProduct(product)
      setBarcodeInput('')
    } else {
      // Show error or not found message
      console.log('Product not found for barcode:', barcode)
    }
  }, [addProduct])

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

              {/* Barcode Scanner Input */}
              <div className="flex items-center gap-2">
                <Scan className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Scan or enter barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && barcodeInput) {
                      handleBarcodeInput(barcodeInput)
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
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, SKU, or barcode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredProducts.map((product) => (
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
                    ))}
                  </div>
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