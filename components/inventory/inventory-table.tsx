'use client'

import { useState, useEffect } from 'react'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { auditedInventoryService } from '@/lib/database-with-audit'
import { categoryService, locationService } from '@/lib/database'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category_id: string
  location_id: string
  quantity: number
  min_stock: number
  max_stock: number
  unit_price: number
  status: 'active' | 'inactive' | 'discontinued'
  created_at: string
  updated_at: string
  categories: {
    id: string
    name: string
    color: string
  }
  locations: {
    id: string
    name: string
    type: string
  }
}

interface FilterOptions {
  status?: string
  lowStock?: boolean
  stockStatus?: string
}

interface InventoryTableProps {
  filters: FilterOptions
}

export function InventoryTable({ filters }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof InventoryItem>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch inventory data
  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true)
        const data = await auditedInventoryService.getAll()
        setItems(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [])

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
    const matchesLowStock = !filters.lowStock || getInventoryStockStatus(item.quantity, item.min_stock) === 'low_stock'
    
    // Enhanced stock status filtering
    let matchesStockStatus = true
    if (filters.stockStatus) {
      const itemStockStatus = getInventoryStockStatus(item.quantity, item.min_stock)
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
    const status = getInventoryStockStatus(item.quantity, item.min_stock)
    
    if (status === 'out_of_stock') {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (status === 'low_stock') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
  }

  const handleEdit = async (item: InventoryItem) => {
    // TODO: Implement edit functionality
    console.log('Edit item:', item)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        await auditedInventoryService.delete(item.id)
        setItems(prev => prev.filter(i => i.id !== item.id))
      } catch (err) {
        console.error('Failed to delete item:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="relative flex-1 max-w-sm">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="rounded-md border">
          <div className="p-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 py-4 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-600">Error loading inventory: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          <Button className="bg-blue-600 hover:bg-blue-700">
            Bulk Operations ({selectedItems.length})
          </Button>
        )}
      </div>

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
                    aria-label="Select all"
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
                  Category
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Location
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('unit_price')}
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
                    onClick={() => handleSort('quantity')}
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
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{item.sku}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{item.name}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.categories?.color || '#gray' }}
                      />
                      <span className="text-sm">{item.categories?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{item.locations?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{item.locations?.type}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{formatCurrency(item.unit_price)}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{item.quantity}</div>
                    <div className="text-sm text-muted-foreground">
                      Min: {item.min_stock}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {getStockBadge(item)}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{formatDate(new Date(item.updated_at))}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Edit"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Delete"
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-700"
                      >
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

      {sortedItems.length === 0 && !loading && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No items found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}