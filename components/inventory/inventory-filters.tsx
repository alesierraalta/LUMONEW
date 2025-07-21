'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'
import { FilterOptions } from '@/lib/types'

interface InventoryFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export function InventoryFilters({ filters, onFiltersChange }: InventoryFiltersProps) {
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Clear
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.status === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('status', filters.status === 'active' ? undefined : 'active')}
        >
          Active Items
        </Button>
        
        <Button
          variant={filters.status === 'inactive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('status', filters.status === 'inactive' ? undefined : 'inactive')}
        >
          Inactive Items
        </Button>
        
        {/* Enhanced Stock Status Filters */}
        <Button
          variant={filters.stockStatus === 'good_stock' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('stockStatus', filters.stockStatus === 'good_stock' ? undefined : 'good_stock')}
          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          Buen Stock
        </Button>
        
        <Button
          variant={filters.stockStatus === 'low_stock' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('stockStatus', filters.stockStatus === 'low_stock' ? undefined : 'low_stock')}
          className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
        >
          Stock Bajo
        </Button>
        
        <Button
          variant={filters.stockStatus === 'out_of_stock' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('stockStatus', filters.stockStatus === 'out_of_stock' ? undefined : 'out_of_stock')}
          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
          Agotado
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('status', undefined)}
              />
            </Badge>
          )}
          
          {filters.stockStatus && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Stock: {filters.stockStatus === 'good_stock' ? 'Buen Stock' :
                     filters.stockStatus === 'low_stock' ? 'Stock Bajo' : 'Agotado'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('stockStatus', undefined)}
              />
            </Badge>
          )}
          
          {filters.lowStock && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Low Stock
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('lowStock', false)}
              />
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('category', undefined)}
              />
            </Badge>
          )}
          
          {filters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Location: {filters.location}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('location', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}