'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  Search,
  Plus,
  Minus
} from 'lucide-react'
import { formatCurrency, formatDate, getStockStatus } from '@/lib/utils'
import { InventoryItem, FilterOptions, QuickStockOperation } from '@/lib/types'
import { QuickStockOperations } from './quick-stock-operations'
import { BulkOperations } from './bulk-operations'
import { StockWarnings } from './stock-warnings'

// Mock data - in a real app, this would come from an API
const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    sku: 'WH-001',
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones',
    categoryId: '1',
    price: 199.99,
    cost: 120.00,
    margin: 39.99,
    currentStock: 5,
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
    autoReorderQuantity: 50
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
    currentStock: 12,
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
    autoReorderQuantity: 100
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
    currentStock: 0,
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
    autoReorderQuantity: 30
  },
  {
    id: '4',
    sku: 'PC-004',
    name: 'Phone Case',
    description: 'Protective silicone phone case',
    categoryId: '3',
    price: 19.99,
    cost: 5.00,
    margin: 74.99,
    currentStock: 8,
    minimumLevel: 25,
    status: 'active',
    locationId: '1',
    tags: ['accessories', 'phone', 'protection'],
    images: ['/images/phone-case.jpg'],
    lastUpdated: new Date('2024-01-12'),
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-12'),
    createdBy: 'admin',
    updatedBy: 'manager1',
    syncStatus: 'synced',
    autoReorder: false
  }
]

interface InventoryTableProps {
  filters: FilterOptions
}

export function InventoryTable({ filters }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof InventoryItem>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false)
  const [items, setItems] = useState<InventoryItem[]>(mockInventoryItems)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isBulkOperationsOpen, setIsBulkOperationsOpen] = useState(false)

  // Handle stock updates
  const handleStockUpdate = (itemId: string, newStock: number, operation: QuickStockOperation) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, currentStock: newStock, lastUpdated: new Date() }
          : item
      )
    )
    console.log('Stock operation completed:', operation)
  }

  const handleQuickStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsQuickStockOpen(true)
  }

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(sortedItems.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  const handleBulkOperationComplete = () => {
    setSelectedItems([])
    setIsBulkOperationsOpen(false)
    // In a real app, you would refresh the data from the API
    console.log('Bulk operation completed, refreshing data...')
  }

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id))

  // Helper function to get inventory stock status
  const getInventoryStockStatus = (currentStock: number, minimumLevel: number) => {
    if (currentStock === 0) return 'out_of_stock'
    if (currentStock < minimumLevel) return 'low_stock'
    return 'good_stock'
  }

  // Filter and sort data
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !filters.status || item.status === filters.status
    const matchesLowStock = !filters.lowStock || getInventoryStockStatus(item.currentStock, item.minimumLevel) === 'low_stock'
    
    // Enhanced stock status filtering
    let matchesStockStatus = true
    if (filters.stockStatus) {
      const itemStockStatus = getInventoryStockStatus(item.currentStock, item.minimumLevel)
      matchesStockStatus = itemStockStatus === filters.stockStatus
    }
    
    return matchesSearch && matchesStatus && matchesLowStock && matchesStockStatus
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    // Handle undefined values
    if (aVal === undefined && bVal === undefined) return 0
    if (aVal === undefined) return 1
    if (bVal === undefined) return -1
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStockBadge = (item: InventoryItem) => {
    const status = getInventoryStockStatus(item.currentStock, item.minimumLevel)
    
    if (status === 'out_of_stock') {
      return <Badge variant="destructive">Agotado</Badge>
    }
    if (status === 'low_stock') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Bajo Stock</Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">En Stock</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Stock Warnings */}
      <StockWarnings items={items} />
      
      {/* Search and Bulk Operations */}
      <div className="flex items-center justify-between space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {selectedItems.length > 0 && (
          <Button
            onClick={() => setIsBulkOperationsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Operaciones Masivas ({selectedItems.length})
          </Button>
        )}
      </div>

      {/* Bulk Operations Component */}
      {selectedItems.length > 0 && (
        <BulkOperations
          selectedItems={selectedItemsData}
          isOpen={isBulkOperationsOpen}
          onClose={() => setIsBulkOperationsOpen(false)}
          onBulkOperation={(operation) => {
            console.log('Bulk operation:', operation)
            // Handle bulk operation here
            setSelectedItems([])
            setIsBulkOperationsOpen(false)
          }}
          categories={[
            {
              id: '1',
              name: 'Electrónicos',
              description: 'Productos electrónicos',
              level: 0,
              path: [],
              itemCount: 0,
              totalValue: 0,
              isActive: true,
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'system',
              updatedBy: 'system',
              syncStatus: 'synced'
            },
            {
              id: '2',
              name: 'Ropa',
              description: 'Artículos de vestir',
              level: 0,
              path: [],
              itemCount: 0,
              totalValue: 0,
              isActive: true,
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'system',
              updatedBy: 'system',
              syncStatus: 'synced'
            },
            {
              id: '3',
              name: 'Hogar',
              description: 'Artículos para el hogar',
              level: 0,
              path: [],
              itemCount: 0,
              totalValue: 0,
              isActive: true,
              sortOrder: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'system',
              updatedBy: 'system',
              syncStatus: 'synced'
            }
          ]}
          locations={[
            { id: '1', name: 'Almacén Principal', description: 'Almacén central', itemQuantity: 0 },
            { id: '2', name: 'Tienda Centro', description: 'Tienda del centro', itemQuantity: 0 },
            { id: '3', name: 'Depósito Norte', description: 'Depósito secundario', itemQuantity: 0 }
          ]}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Checkbox
                    checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('sku')}
                  >
                    SKU
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('price')}
                  >
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('currentStock')}
                  >
                    Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Last Updated
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      aria-label={`Seleccionar ${item.name}`}
                    />
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{item.sku}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{formatCurrency(item.price)}</div>
                    <div className="text-sm text-muted-foreground">
                      Cost: {formatCurrency(item.cost)}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{item.currentStock}</div>
                    <div className="text-sm text-muted-foreground">
                      Min: {item.minimumLevel}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {getStockBadge(item)}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{formatDate(item.lastUpdated)}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickStock(item)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Ajuste rápido de stock"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Ver detalles">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedItems.length === 0 && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No items found matching your criteria.</p>
        </div>
      )}

      {/* Quick Stock Operations Modal */}
      {selectedItem && (
        <QuickStockOperations
          item={selectedItem}
          isOpen={isQuickStockOpen}
          onClose={() => {
            setIsQuickStockOpen(false)
            setSelectedItem(null)
          }}
          onStockUpdate={handleStockUpdate}
        />
      )}
    </div>
  )
}