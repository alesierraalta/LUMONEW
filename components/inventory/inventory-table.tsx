'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown,
  Search,
  Plus,
  Minus,
  Image as ImageIcon,
  Filter,
  X
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { categoryService, locationService } from '@/lib/database'
import { QuickStockModal } from './quick-stock-modal'
import { BulkActions } from './bulk-actions'

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Genera mensaje de confirmación para eliminación de elementos
 */
function getDeleteMessage(item: any, type: string = 'inventory'): string {
  if (!item || typeof item !== 'object') {
    return '¿Estás seguro de que quieres eliminar este elemento?'
  }
  
  const name = escapeHtml(item.name || 'Sin nombre')
  const sku = escapeHtml(item.sku || 'Sin SKU')
  
  switch(type) {
    case 'inventory':
      return `¿Estás seguro de que quieres eliminar el artículo ${sku} (${name})? Esta acción no se puede deshacer.`
    case 'category':
      return `¿Estás seguro de que quieres eliminar la categoría '${name}'? Esta acción no se puede deshacer.`
    case 'location':
      return `¿Estás seguro de que quieres eliminar la ubicación '${name}'? Esta acción no se puede deshacer.`
    default:
      return `¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.`
  }
}

/**
 * Genera mensaje de éxito después de eliminación
 */
function getSuccessMessage(item: any, type: string = 'inventory'): string {
  if (!item || typeof item !== 'object') {
    return '✅ Elemento eliminado exitosamente'
  }
  
  const name = escapeHtml(item.name || 'Sin nombre')
  const sku = escapeHtml(item.sku || 'Sin SKU')
  
  if (type === 'inventory') {
    return `✅ Artículo ${sku} (${name}) eliminado exitosamente`
  }
  return `✅ Elemento eliminado exitosamente`
}

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
  images: string[]
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

interface Category {
  id: string
  name: string
  color: string
}

interface Location {
  id: string
  name: string
  address?: string
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
  const router = useRouter()
  const t = useTranslations('inventory')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof InventoryItem>('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quickStockModal, setQuickStockModal] = useState<{
    isOpen: boolean
    item: InventoryItem | null
    initialOperation: 'add' | 'subtract'
  }>({ isOpen: false, item: null, initialOperation: 'add' })
  
  // New filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  // Fetch inventory data and filter options
  useEffect(() => {
    fetchInventory()
    fetchFilterOptions()
  }, [])

  // Fetch categories and locations for filters
  const fetchFilterOptions = async () => {
    try {
      const [categoriesData, locationsData] = await Promise.all([
        categoryService.getAll(),
        locationService.getAll()
      ])
      setCategories(categoriesData || [])
      setLocations(locationsData || [])
    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
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

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedLocation('all')
    setSearchTerm('')
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
    
    // New category and location filters
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || item.category_id === selectedCategory
    const matchesLocation = !selectedLocation || selectedLocation === 'all' || item.location_id === selectedLocation
    
    return matchesSearch && matchesStatus && matchesLowStock && matchesStockStatus && matchesCategory && matchesLocation
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
      return <Badge variant="destructive">{t('table.stockStatus.outOfStock')}</Badge>
    }
    if (status === 'low_stock') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">{t('table.stockStatus.lowStock')}</Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">{t('table.stockStatus.inStock')}</Badge>
  }

  const handleEdit = async (item: InventoryItem) => {
    router.push(`/inventory/edit/${item.id}`)
  }

  const handleQuickStock = (item: InventoryItem) => {
    setQuickStockModal({ isOpen: true, item, initialOperation: 'add' })
  }

  const handleQuickStockSubtract = (item: InventoryItem) => {
    setQuickStockModal({ isOpen: true, item, initialOperation: 'subtract' })
  }

  const handleQuickStockClose = () => {
    setQuickStockModal({ isOpen: false, item: null, initialOperation: 'add' })
  }

  const handleStockUpdated = () => {
    // Refresh the inventory data
    fetchInventory()
  }

  // Move fetchInventory function outside useEffect so it can be reused
  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/items?limit=999999')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items')
      }
      const data = await response.json()
      
      // Handle both old format (array) and new format (pagination object)
      if (Array.isArray(data)) {
        setItems(data)
      } else if (data && data.data && Array.isArray(data.data)) {
        // New pagination format
        setItems(data.data)
      } else {
        setItems([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoadingInventory'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    const deleteMessage = getDeleteMessage(item, 'inventory')
    if (confirm(deleteMessage)) {
      try {
        const response = await fetch(`/api/inventory?id=${item.id}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error('Failed to delete item')
        }
        setItems(prev => prev.filter(i => i.id !== item.id))
        
        // Mostrar mensaje de éxito
        const successMessage = getSuccessMessage(item, 'inventory')
        alert(successMessage)
      } catch (err) {
        console.error('Failed to delete item:', err)
      }
    }
  }

  // Bulk action handlers
  const handleBulkDelete = async (itemIds: string[]) => {
    try {
      const deletePromises = itemIds.map(id => 
        fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
      )
      
      const responses = await Promise.all(deletePromises)
      const failedDeletes = responses.filter(r => !r.ok)
      
      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} items`)
      }
      
      setItems(prev => prev.filter(item => !itemIds.includes(item.id)))
      alert(`✅ ${itemIds.length} items eliminados exitosamente`)
    } catch (err) {
      console.error('Failed to delete items:', err)
      throw err
    }
  }

  const handleBulkExport = async (itemIds: string[]) => {
    try {
      const selectedItemsData = items.filter(item => itemIds.includes(item.id))
      
      // Create CSV content
      const headers = ['SKU', 'Nombre', 'Categoría', 'Ubicación', 'Stock', 'Precio', 'Estado']
      const csvContent = [
        headers.join(','),
        ...selectedItemsData.map(item => [
          item.sku,
          `"${item.name}"`,
          item.categories?.name || 'Sin categoría',
          item.locations?.name || 'Sin ubicación',
          item.quantity,
          item.unit_price,
          item.status
        ].join(','))
      ].join('\n')
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert(`✅ ${itemIds.length} items exportados exitosamente`)
    } catch (err) {
      console.error('Failed to export items:', err)
      throw err
    }
  }

  const handleBulkUpdate = async (itemIds: string[], updates: any) => {
    try {
      const updatePromises = itemIds.map(id => 
        fetch(`/api/inventory?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
      )
      
      const responses = await Promise.all(updatePromises)
      const failedUpdates = responses.filter(r => !r.ok)
      
      if (failedUpdates.length > 0) {
        throw new Error(`Failed to update ${failedUpdates.length} items`)
      }
      
      // Refresh inventory data
      await fetchInventory()
      alert(`✅ ${itemIds.length} items actualizados exitosamente`)
    } catch (err) {
      console.error('Failed to update items:', err)
      throw err
    }
  }

  const handleBulkStockAdjustment = async (itemIds: string[], adjustment: number, reason: string) => {
    try {
      const selectedItemsData = items.filter(item => itemIds.includes(item.id))
      
      const updatePromises = selectedItemsData.map(item => {
        const newQuantity = Math.max(0, item.quantity + adjustment)
        return fetch(`/api/inventory?id=${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            quantity: newQuantity,
            // Add audit note
            notes: `Ajuste en lote: ${adjustment > 0 ? '+' : ''}${adjustment} (${reason})`
          })
        })
      })
      
      const responses = await Promise.all(updatePromises)
      const failedUpdates = responses.filter(r => !r.ok)
      
      if (failedUpdates.length > 0) {
        throw new Error(`Failed to adjust stock for ${failedUpdates.length} items`)
      }
      
      // Refresh inventory data
      await fetchInventory()
      alert(`✅ Stock ajustado para ${itemIds.length} items exitosamente`)
    } catch (err) {
      console.error('Failed to adjust stock:', err)
      throw err
    }
  }

  // Render item image
  const renderItemImage = (item: InventoryItem) => {
    if (item.images && item.images.length > 0) {
      return (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )
    }
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }

  // Check if any filters are active
  const hasActiveFilters = selectedCategory || selectedLocation || searchTerm

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="relative flex-1 max-w-sm">
            <div className="h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="rounded-md border">
          <div className="p-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 py-4 animate-pulse">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="w-12 h-12 bg-muted rounded"></div>
                <div className="w-20 h-4 bg-muted rounded"></div>
                <div className="w-32 h-4 bg-muted rounded"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
                <div className="w-12 h-4 bg-muted rounded"></div>
                <div className="w-20 h-4 bg-muted rounded"></div>
                <div className="w-24 h-4 bg-muted rounded"></div>
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
        <p className="text-red-600">{t('errorLoadingInventory')}: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 xs:space-y-3 sm:space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-2 xs:gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2 xs:top-2.5 h-3 w-3 xs:h-4 xs:w-4 text-muted-foreground" />
          <Input
            placeholder={t('table.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-6 xs:pl-8 h-8 xs:h-9 sm:h-10 text-xs xs:text-sm"
          />
        </div>
        
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-8 xs:h-9 sm:h-10 text-xs xs:text-sm">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Location Filter */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px] h-8 xs:h-9 sm:h-10 text-xs xs:text-sm">
              <SelectValue placeholder="Todas las ubicaciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ubicaciones</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 xs:h-9 sm:h-10 text-xs xs:text-sm"
            >
              <X className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
        
        {/* Selection Counter and Bulk Actions */}
        <BulkActions
          selectedItems={selectedItems}
          totalItems={sortedItems.length}
          onClearSelection={() => setSelectedItems([])}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onBulkUpdate={handleBulkUpdate}
          onBulkStockAdjustment={handleBulkStockAdjustment}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] xs:min-w-[800px] sm:min-w-[900px]">
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
                  Imagen
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('sku')}
                  >
                    {t('table.headers.sku')}
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
                    {t('table.headers.name')}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('table.headers.category')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('table.headers.location')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('unit_price')}
                  >
                    {t('table.headers.price')}
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
                    {t('table.headers.stock')}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('table.headers.status')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('updated_at')}
                  >
                    {t('table.headers.lastUpdated')}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('table.headers.actions')}
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
                    {renderItemImage(item)}
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
                      <span className="text-sm">{item.categories?.name || t('table.unknown')}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{item.locations?.name || t('table.unknown')}</div>
                    <div className="text-xs text-muted-foreground">{item.locations?.type}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{formatCurrency(item.unit_price)}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{item.quantity}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('minStock')}: {item.min_stock}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {getStockBadge(item)}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{formatDate(new Date(item.updated_at))}</div>
                  </td>
                  <td className="p-2 xs:p-3 sm:p-4 align-middle">
                    <div className="flex items-center space-x-0.5 xs:space-x-1 min-w-[100px] xs:min-w-[120px] sm:min-w-[140px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('table.actions.addStock')}
                        onClick={() => handleQuickStock(item)}
                        className="text-green-600 hover:text-green-700 h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Plus className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('table.actions.subtractStock')}
                        onClick={() => handleQuickStockSubtract(item)}
                        className="text-orange-600 hover:text-orange-700 h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Minus className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('table.actions.edit')}
                        onClick={() => handleEdit(item)}
                        className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('table.actions.delete')}
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-700 h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
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
          <p className="text-visible-dark">
            {hasActiveFilters 
              ? 'No se encontraron items con los filtros aplicados' 
              : t('table.noItemsFound')
            }
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-2"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Quick Stock Modal */}
      <QuickStockModal
        isOpen={quickStockModal.isOpen}
        onClose={handleQuickStockClose}
        item={quickStockModal.item}
        onStockUpdated={handleStockUpdated}
        initialOperation={quickStockModal.initialOperation}
      />
    </div>
  )
}