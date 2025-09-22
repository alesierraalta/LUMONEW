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
import { Search, Filter, X, ChevronDown, ChevronUp, Settings, Save, Clock, User, AlertTriangle, Building, Calendar, Database } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AuditFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

// Predefined filter presets
const FILTER_PRESETS = [
  {
    id: 'recent_activity',
    name: 'Actividad Reciente',
    description: 'Últimas 24 horas',
    icon: Clock,
    filters: {
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      }
    }
  },
  {
    id: 'critical_operations',
    name: 'Operaciones Críticas',
    description: 'Eliminaciones y cambios importantes',
    icon: AlertTriangle,
    filters: {
      status: 'deleted',
      // Add impact level filter when available
    }
  },
  {
    id: 'user_management',
    name: 'Gestión de Usuarios',
    description: 'Cambios en usuarios y permisos',
    icon: User,
    filters: {
      category: 'user'
    }
  },
  {
    id: 'inventory_changes',
    name: 'Cambios de Inventario',
    description: 'Modificaciones de stock y productos',
    icon: Database,
    filters: {
      category: 'item'
    }
  },
  {
    id: 'system_operations',
    name: 'Operaciones del Sistema',
    description: 'Logins, exports, imports',
    icon: Settings,
    filters: {
      status: 'imported'
    }
  }
]

export function AuditFilters({ filters, onFiltersChange }: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const t = useTranslations('audit.filters')

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    setActivePreset(null) // Clear preset when manually changing filters
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
    setActivePreset(null)
  }

  const applyPreset = (preset: typeof FILTER_PRESETS[0]) => {
    const newFilters = { ...localFilters, ...preset.filters }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    setActivePreset(preset.id)
  }

  const hasActiveFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof FilterOptions]
    return value !== undefined && value !== '' && value !== null
  })

  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).filter(key => {
      const value = localFilters[key as keyof FilterOptions]
      return value !== undefined && value !== '' && value !== null
    }).length
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Filtros de Auditoría</h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters 
                ? `${getActiveFiltersCount()} filtro(s) activo(s)` 
                : 'Sin filtros aplicados'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            {showAdvancedFilters ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar Avanzados
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar Avanzados
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Filtros Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {FILTER_PRESETS.map((preset) => {
              const Icon = preset.icon
              const isActive = activePreset === preset.id
              
              return (
                <Button
                  key={preset.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="h-auto p-3 flex flex-col items-start gap-2 text-left min-w-[200px] max-w-[280px] flex-shrink-0"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{preset.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {preset.description}
                  </span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Búsqueda Global
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por usuario, acción, tabla, ID de registro, notas..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avanzados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Tipo de Acción
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
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Tipo de Entidad
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

              {/* User Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuario
                </Label>
                <Input
                  placeholder="Filtrar por usuario..."
                  value={localFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-border my-4" />

            {/* Date Range Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h4 className="text-sm font-medium">Filtrar por Período de Tiempo</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm font-medium">
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
                  <Label htmlFor="end-date" className="text-sm font-medium">
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

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="space-y-3">
                <div className="border-t border-border my-4" />
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Filtros Activos:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {localFilters.search && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      Búsqueda: {localFilters.search}
                    </Badge>
                  )}
                  {localFilters.status && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Acción: {localFilters.status}
                    </Badge>
                  )}
                  {localFilters.category && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Entidad: {localFilters.category}
                    </Badge>
                  )}
                  {localFilters.dateRange && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Rango de fechas
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}