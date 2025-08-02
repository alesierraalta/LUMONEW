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
import { useTranslations } from 'next-intl'

interface AuditFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

export function AuditFilters({ filters, onFiltersChange }: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
  const t = useTranslations('audit.filters')

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
      {/* Search Filter - Full Width on Mobile */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">🔍 Buscar en registros</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por usuario, acción, tabla..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Advanced Filters - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Action Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground block mb-2">
            ⚡ Tipo de Acción
          </Label>
          <Select
            value={localFilters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="created">
                <span className="flex items-center gap-2">
                  <span>➕</span>
                  <span>Creado</span>
                </span>
              </SelectItem>
              <SelectItem value="updated">
                <span className="flex items-center gap-2">
                  <span>✏️</span>
                  <span>Actualizado</span>
                </span>
              </SelectItem>
              <SelectItem value="deleted">
                <span className="flex items-center gap-2">
                  <span>🗑️</span>
                  <span>Eliminado</span>
                </span>
              </SelectItem>
              <SelectItem value="imported">
                <span className="flex items-center gap-2">
                  <span>📥</span>
                  <span>Importado</span>
                </span>
              </SelectItem>
              <SelectItem value="exported">
                <span className="flex items-center gap-2">
                  <span>📤</span>
                  <span>Exportado</span>
                </span>
              </SelectItem>
              <SelectItem value="bulk_operation">
                <span className="flex items-center gap-2">
                  <span>👥</span>
                  <span>Operación Masiva</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground block mb-2">
            📊 Tipo de Entidad
          </Label>
          <Select
            value={localFilters.category || 'all'}
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las entidades</SelectItem>
              <SelectItem value="item">
                <span className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Inventario</span>
                </span>
              </SelectItem>
              <SelectItem value="category">
                <span className="flex items-center gap-2">
                  <span>🏷️</span>
                  <span>Categorías</span>
                </span>
              </SelectItem>
              <SelectItem value="location">
                <span className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Ubicaciones</span>
                </span>
              </SelectItem>
              <SelectItem value="user">
                <span className="flex items-center gap-2">
                  <span>👤</span>
                  <span>Usuarios</span>
                </span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Sistema</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-transparent block mb-2">
            Acciones
          </Label>
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {/* Date Range Filters - Mobile Responsive */}
      <div className="space-y-4">
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-medium mb-4 text-foreground">
            📅 Filtrar por Período de Tiempo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-foreground block">
                Fecha de Inicio
              </Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={localFilters.dateRange?.start ? 
                  new Date(localFilters.dateRange.start.getTime() - localFilters.dateRange.start.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-foreground block">
                Fecha de Fin
              </Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={localFilters.dateRange?.end ? 
                  new Date(localFilters.dateRange.end.getTime() - localFilters.dateRange.end.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="text-sm w-full"
              />
            </div>
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