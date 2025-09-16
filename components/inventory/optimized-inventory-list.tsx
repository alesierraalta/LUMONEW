'use client'

import React, { useMemo, useCallback, useState } from 'react'
import { useInventory, useInventorySearch, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '@/lib/hooks/use-inventory'
import { useInventoryStore, inventorySelectors } from '@/lib/stores/inventory.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Package,
  MapPin,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import type { InventoryItem, InventoryFormData } from '@/lib/types'

/**
 * Optimized Inventory List Component
 * Implements microservice architecture with advanced performance optimizations
 */
export function OptimizedInventoryList() {
  // State management with Zustand
  const {
    items,
    filters,
    loading,
    error,
    selectedItems,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    setFilters,
    setSelectedItems,
    toggleItemSelection,
    clearSelection,
    setPage,
    setItemsPerPage,
    fetchItems,
    clearError
  } = useInventoryStore()

  // React Query hooks for data fetching
  const { 
    data: inventoryData, 
    isLoading: isInventoryLoading, 
    error: inventoryError,
    refetch: refetchInventory
  } = useInventory(filters)

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const { 
    data: searchResults, 
    isLoading: isSearchLoading 
  } = useInventorySearch(searchQuery, filters)

  // Mutations
  const createItemMutation = useCreateInventoryItem()
  const updateItemMutation = useUpdateInventoryItem()
  const deleteItemMutation = useDeleteInventoryItem()

  // Local state
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Memoized data for performance
  const displayItems = useMemo(() => {
    if (searchQuery && searchResults) {
      return searchResults.items || []
    }
    return inventoryData || items
  }, [searchQuery, searchResults, inventoryData, items])

  const selectedItemsData = useMemo(() => {
    return displayItems.filter(item => selectedItems.includes(item.id))
  }, [displayItems, selectedItems])

  const lowStockItems = useMemo(() => {
    return displayItems.filter(item => item.currentStock <= item.minimumLevel)
  }, [displayItems])

  const outOfStockItems = useMemo(() => {
    return displayItems.filter(item => item.currentStock === 0)
  }, [displayItems])

  // Optimized callbacks
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (query.length >= 2) {
      // Search is handled by React Query hook
    } else {
      setSearchQuery('')
    }
  }, [])

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters({ [key]: value })
  }, [setFilters])

  const handleItemSelect = useCallback((itemId: string) => {
    toggleItemSelection(itemId)
  }, [toggleItemSelection])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === displayItems.length) {
      clearSelection()
    } else {
      setSelectedItems(displayItems.map(item => item.id))
    }
  }, [selectedItems.length, displayItems, clearSelection, setSelectedItems])

  const handleCreateItem = useCallback(async (itemData: InventoryFormData) => {
    try {
      await createItemMutation.mutateAsync(itemData)
      setShowCreateDialog(false)
      // Refresh data
      refetchInventory()
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }, [createItemMutation, refetchInventory])

  const handleUpdateItem = useCallback(async (id: string, updates: Partial<InventoryFormData>) => {
    try {
      await updateItemMutation.mutateAsync({ id, updates })
      setEditingItem(null)
      // Refresh data
      refetchInventory()
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }, [updateItemMutation, refetchInventory])

  const handleDeleteItem = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItemMutation.mutateAsync(id)
        // Refresh data
        refetchInventory()
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }, [deleteItemMutation, refetchInventory])

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      try {
        // This would use a bulk delete mutation
        await Promise.all(selectedItems.map(id => deleteItemMutation.mutateAsync(id)))
        clearSelection()
        refetchInventory()
      } catch (error) {
        console.error('Failed to bulk delete items:', error)
      }
    }
  }, [selectedItems, deleteItemMutation, clearSelection, refetchInventory])

  // Loading state
  if (isInventoryLoading && !inventoryData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (inventoryError || error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {inventoryError?.message || error || 'Failed to load inventory items'}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={() => {
              clearError()
              refetchInventory()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">
            {totalCount} items • {lowStockItems.length} low stock • {outOfStockItems.length} out of stock
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchInventory()}
            disabled={isInventoryLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isInventoryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Inventory Item</DialogTitle>
              </DialogHeader>
              {/* Create item form would go here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items by name or SKU..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {showFilters && (
          <div className="flex items-center space-x-2">
            <Select value={filters.category || ''} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {/* Category options would be populated from API */}
              </SelectContent>
            </Select>
            <Select value={filters.location || ''} onValueChange={(value) => handleFilterChange('location', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {/* Location options would be populated from API */}
              </SelectContent>
            </Select>
            <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleteItemMutation.isPending}
          >
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Inventory Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayItems.map((item) => (
          <Card 
            key={item.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleItemSelect(item.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {item.currentStock <= item.minimumLevel && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low Stock
                    </Badge>
                  )}
                  {item.currentStock === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{item.currentStock} in stock</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{item.location?.name || 'No location'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>{item.category?.name || 'No category'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${item.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-1">
                  {item.currentStock > item.minimumLevel ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Min: {item.minimumLevel}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingItem(item)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteItem(item.id)
                    }}
                    disabled={deleteItemMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            {/* Edit form would go here */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}