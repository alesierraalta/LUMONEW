'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterOptions } from '@/lib/types'
import { Search, Filter, X } from 'lucide-react'

interface AuditFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export function AuditFilters({ filters, onFiltersChange }: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const currentRange = localFilters.dateRange || { start: new Date(), end: new Date() }
    const newRange = {
      ...currentRange,
      [type]: new Date(value)
    }
    handleFilterChange('dateRange', newRange)
  }

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof FilterOptions]
    return value !== undefined && value !== '' && value !== null
  })

  return (
    <div className="space-y-4">
      {/* Search and Action Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar en registros..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label>Acción</Label>
          <Select
            value={localFilters.status || ''}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las acciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="created">Creado</SelectItem>
              <SelectItem value="updated">Actualizado</SelectItem>
              <SelectItem value="deleted">Eliminado</SelectItem>
              <SelectItem value="stock_adjusted">Ajuste de Stock</SelectItem>
              <SelectItem value="bulk_operation">Operación Masiva</SelectItem>
              <SelectItem value="quick_stock">Stock Rápido</SelectItem>
              <SelectItem value="transferred">Transferido</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
              <SelectItem value="restored">Restaurado</SelectItem>
              <SelectItem value="imported">Importado</SelectItem>
              <SelectItem value="exported">Exportado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="space-y-2">
          <Label>Tipo de Entidad</Label>
          <Select
            value={localFilters.category || ''}
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="item">Producto</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
              <SelectItem value="location">Ubicación</SelectItem>
              <SelectItem value="user">Usuario</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={localFilters.location || ''}
            onValueChange={(value) => handleFilterChange('location', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="success">Exitoso</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Fecha de Inicio</Label>
          <Input
            id="start-date"
            type="datetime-local"
            value={localFilters.dateRange?.start ? 
              new Date(localFilters.dateRange.start.getTime() - localFilters.dateRange.start.getTimezoneOffset() * 60000)
                .toISOString().slice(0, 16) : ''}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">Fecha de Fin</Label>
          <Input
            id="end-date"
            type="datetime-local"
            value={localFilters.dateRange?.end ? 
              new Date(localFilters.dateRange.end.getTime() - localFilters.dateRange.end.getTimezoneOffset() * 60000)
                .toISOString().slice(0, 16) : ''}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtros activos aplicados</span>
        </div>
      )}
    </div>
  )
}