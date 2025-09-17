'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { auditService, AuditLog } from '@/lib/audit'
import { useTranslations } from 'next-intl'
import { 
  Calendar, 
  Search, 
  Filter, 
  User, 
  Package, 
  MapPin, 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  LogIn, 
  LogOut,
  Download,
  Upload,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Database,
  TrendingUp,
  BarChart3,
  History,
  Layers,
  Zap,
  Target,
  FileText,
  Info
} from 'lucide-react'

interface AuditHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mapeo de iconos por tipo de operación con mejor diseño
const getOperationIcon = (operation: string, tableName: string) => {
  const iconClass = "h-4 w-4"
  switch (operation) {
    case 'INSERT':
      return <Plus className={`${iconClass} text-success-soft`} />
    case 'UPDATE':
      return <Edit className={`${iconClass} text-info-soft`} />
    case 'DELETE':
      return <Trash2 className={`${iconClass} text-error-soft`} />
    case 'LOGIN':
      return <LogIn className={`${iconClass} text-success-soft`} />
    case 'LOGOUT':
      return <LogOut className={`${iconClass} text-muted-foreground`} />
    case 'EXPORT':
      return <Download className={`${iconClass} text-info-soft`} />
    case 'IMPORT':
      return <Upload className={`${iconClass} text-warning-soft`} />
    case 'BULK_OPERATION':
      return <Layers className={`${iconClass} text-info-soft`} />
    case 'VIEW':
      return <Eye className={`${iconClass} text-muted-foreground`} />
    default:
      return <Activity className={`${iconClass} text-muted-foreground`} />
  }
}

// Mapeo de iconos por tabla con mejor estética
const getTableIcon = (tableName: string) => {
  const iconClass = "h-3.5 w-3.5"
  switch (tableName) {
    case 'inventory':
      return <Package className={`${iconClass} text-info-soft`} />
    case 'users':
      return <User className={`${iconClass} text-success-soft`} />
    case 'categories':
      return <Tag className={`${iconClass} text-info-soft`} />
    case 'locations':
      return <MapPin className={`${iconClass} text-warning-soft`} />
    case 'transactions':
      return <TrendingUp className={`${iconClass} text-info-soft`} />
    default:
      return <Database className={`${iconClass} text-muted-foreground`} />
  }
}

// Colores por tipo de operación con mejor paleta
const getOperationColor = (operation: string) => {
  switch (operation) {
    case 'INSERT':
      return 'border-success-soft bg-success-soft text-success-soft hover:opacity-90'
    case 'UPDATE':
      return 'border-info-soft bg-info-soft text-info-soft hover:opacity-90'
    case 'DELETE':
      return 'border-error-soft bg-error-soft text-error-soft hover:opacity-90'
    case 'LOGIN':
      return 'border-success-soft bg-success-soft text-success-soft hover:opacity-90'
    case 'LOGOUT':
      return 'border-muted bg-muted text-muted-foreground hover:opacity-90'
    case 'EXPORT':
      return 'border-info-soft bg-info-soft text-info-soft hover:opacity-90'
    case 'IMPORT':
      return 'border-warning-soft bg-warning-soft text-warning-soft hover:opacity-90'
    case 'BULK_OPERATION':
      return 'border-info-soft bg-info-soft text-info-soft hover:opacity-90'
    default:
      return 'border-muted bg-muted text-muted-foreground'
  }
}

// Descripción de la acción en español con mejor redacción
const getActionDescription = (log: AuditLog) => {
  const { operation, table_name, metadata } = log
  
  // Usar action_type si está disponible para descripciones más específicas
  if (metadata?.action_type) {
    switch (metadata.action_type) {
      case 'create':
        return `Creó un nuevo ${getEntityName(table_name)}`
      case 'update':
        return `Modificó ${getEntityName(table_name)}`
      case 'delete':
        return `Eliminó ${getEntityName(table_name)}`
      // Inventory specific actions
      case 'inventory_item_created':
        return 'Creó un nuevo producto de inventario'
      case 'inventory_item_updated':
        return 'Actualizó un producto de inventario'
      case 'inventory_item_deleted':
        return 'Eliminó un producto de inventario'
      case 'inventory_stock_adjusted':
        return 'Ajustó niveles de stock en inventario'
      case 'bulk_inventory_update':
        return 'Realizó actualización masiva de inventario'
      case 'bulk_inventory_delete':
        return 'Ejecutó eliminación masiva de inventario'
      // Failed operations
      case 'failed_inventory_creation':
        return 'Falló la creación de un producto de inventario'
      case 'failed_inventory_update':
        return 'Falló la actualización de un producto de inventario'
      case 'failed_inventory_deletion':
        return 'Falló la eliminación de un producto de inventario'
      case 'user_created':
        return 'Registró un nuevo usuario en el sistema'
      case 'user_updated':
        return 'Actualizó información de usuario'
      case 'user_deleted':
        return 'Eliminó usuario del sistema'
      case 'category_created':
        return 'Creó una nueva categoría'
      case 'category_updated':
        return 'Modificó información de categoría'
      case 'category_deleted':
        return 'Eliminó categoría del sistema'
      case 'location_created':
        return 'Registró nueva ubicación'
      case 'location_updated':
        return 'Actualizó datos de ubicación'
      case 'location_deleted':
        return 'Eliminó ubicación del sistema'
      default:
        return `Ejecutó ${(operation as string).toLowerCase()} en ${getEntityName(table_name)}`
    }
  }
  
  switch (operation) {
    case 'INSERT':
      return `Creó un nuevo ${getEntityName(table_name)}`
    case 'UPDATE':
      return `Modificó ${getEntityName(table_name)}`
    case 'DELETE':
      return `Eliminó ${getEntityName(table_name)}`
    case 'LOGIN':
      return 'Inició sesión en el sistema'
    case 'LOGOUT':
      return 'Cerró sesión del sistema'
    case 'EXPORT':
      return `Exportó datos de ${getEntityName(table_name)}`
    case 'IMPORT':
      return `Importó datos a ${getEntityName(table_name)}`
    case 'BULK_OPERATION':
      return `Ejecutó operación masiva en ${getEntityName(table_name)}`
    case 'VIEW':
      return `Consultó información de ${getEntityName(table_name)}`
    default:
      return `Realizó ${(operation as string).toLowerCase()} en ${getEntityName(table_name)}`
  }
}

// Nombres de entidades en español
const getEntityName = (tableName: string) => {
  switch (tableName) {
    case 'inventory':
      return 'inventario'
    case 'users':
      return 'usuarios'
    case 'categories':
      return 'categorías'
    case 'locations':
      return 'ubicaciones'
    case 'transactions':
      return 'transacciones'
    default:
      return tableName
  }
}

// Formatear fecha relativa con mejor presentación
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Hace unos momentos'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `Hace ${minutes} min`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `Hace ${hours}h`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `Hace ${days}d`
  } else {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// Formatear fecha completa
const formatFullDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function AuditHistory({ open, onOpenChange }: AuditHistoryProps) {
  const t = useTranslations('inventory')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [locationNames, setLocationNames] = useState<Record<string, string>>({})
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [operationFilter, setOperationFilter] = useState<string>('')
  const [tableFilter, setTableFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(true)

  // Cargar logs de auditoría
  const loadAuditLogs = async () => {
    if (!open) return
    
    setLoading(true)
    try {
      const { data } = await auditService.getAuditLogs({
        limit: 200,
        operation: operationFilter || undefined,
        table_name: tableFilter || undefined,
        search: searchTerm || undefined,
        date_from: getDateFromFilter(dateFilter)
      })
      
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar diccionarios simples para nombres legibles
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const [catsRes, locsRes] = await Promise.all([
          fetch('/api/categories/items'),
          fetch('/api/locations/items')
        ])
        if (catsRes.ok) {
          const cats = await catsRes.json()
          const map: Record<string, string> = {}
          for (const c of cats || []) map[c.id] = c.name
          setCategoryNames(map)
        }
        if (locsRes.ok) {
          const locs = await locsRes.json()
          const map: Record<string, string> = {}
          for (const l of locs || []) map[l.id] = l.name
          setLocationNames(map)
        }
      } catch (e) {
        // Silenciar fallos de diccionario; mantenemos fallback por ID
      }
    })()
  }, [open])

  function getUserLabel(log: AuditLog): string {
    // @ts-ignore joined users may be present
    const joined = (log as any).users as { id?: string; name?: string; email?: string } | undefined
    return joined?.name || log.user_email || 'Sistema'
  }

  function getItemLabel(log: AuditLog): string {
    const nv = log.new_values as any
    const ov = log.old_values as any
    return nv?.name || ov?.name || nv?.sku || ov?.sku || `registro ${log.record_id}`
  }

  function labelForField(field: string): string {
    const map: Record<string, string> = {
      name: 'nombre',
      sku: 'SKU',
      quantity: 'stock',
      unit_price: 'precio',
      status: 'estado',
      category_id: 'categoría',
      location_id: 'ubicación',
      min_stock: 'stock mínimo',
      max_stock: 'stock máximo',
      description: 'descripción'
    }
    return map[field] || field
  }

  function formatValue(field: string, value: any): string {
    if (value === null || value === undefined) return '—'
    if (field === 'unit_price') return `$${Number(value).toLocaleString()}`
    if (field === 'quantity' || field.endsWith('_stock')) return `${Number(value).toLocaleString()}`
    if (field === 'status') return value === 'active' ? 'activo' : value === 'inactive' ? 'inactivo' : String(value)
    if (field === 'category_id') return categoryNames[String(value)] || 'categoría'
    if (field === 'location_id') return locationNames[String(value)] || 'ubicación'
    return String(value)
  }

  function buildFriendlyUpdate(log: AuditLog): string {
    const user = getUserLabel(log)
    const item = getItemLabel(log)
    const ov = (log.old_values || {}) as Record<string, any>
    const nv = (log.new_values || {}) as Record<string, any>

    // Cambios prioritarios y legibles
    if (typeof ov.quantity !== 'undefined' && typeof nv.quantity !== 'undefined' && ov.quantity !== nv.quantity) {
      const delta = Number(nv.quantity) - Number(ov.quantity)
      const verb = delta > 0 ? `sumó ${Math.abs(delta).toLocaleString()} unidades` : `restó ${Math.abs(delta).toLocaleString()} unidades`
      return `${user} ${verb} a "${item}" (de ${formatValue('quantity', ov.quantity)} a ${formatValue('quantity', nv.quantity)})`
    }

    if (typeof ov.name !== 'undefined' && typeof nv.name !== 'undefined' && ov.name !== nv.name) {
      return `${user} cambió el nombre de "${ov.name}" a "${nv.name}"`
    }

    if (typeof ov.unit_price !== 'undefined' && typeof nv.unit_price !== 'undefined' && ov.unit_price !== nv.unit_price) {
      return `${user} actualizó el precio de "${item}" (de ${formatValue('unit_price', ov.unit_price)} a ${formatValue('unit_price', nv.unit_price)})`
    }

    if (typeof ov.status !== 'undefined' && typeof nv.status !== 'undefined' && ov.status !== nv.status) {
      return `${user} cambió el estado de "${item}" (de ${formatValue('status', ov.status)} a ${formatValue('status', nv.status)})`
    }

    if (typeof ov.category_id !== 'undefined' && typeof nv.category_id !== 'undefined' && ov.category_id !== nv.category_id) {
      return `${user} cambió la categoría de "${item}" (de ${formatValue('category_id', ov.category_id)} a ${formatValue('category_id', nv.category_id)})`
    }

    if (typeof ov.location_id !== 'undefined' && typeof nv.location_id !== 'undefined' && ov.location_id !== nv.location_id) {
      return `${user} movió "${item}" (de ${formatValue('location_id', ov.location_id)} a ${formatValue('location_id', nv.location_id)})`
    }

    // Genérico si no se detectó un cambio prioritario
    const fields = Object.keys(nv).filter(k => JSON.stringify(nv[k]) !== JSON.stringify(ov[k]))
    if (fields.length > 0) {
      const first = fields[0]
      return `${user} actualizó ${labelForField(first)} de "${item}"`
    }
    return `${user} actualizó "${item}"`
  }

  function buildFriendlyMessage(log: AuditLog): string {
    const user = getUserLabel(log)
    const item = getItemLabel(log)
    switch (log.operation) {
      case 'INSERT':
        return `${user} creó "${item}"`
      case 'DELETE':
        return `${user} eliminó "${item}”`
      case 'UPDATE':
        return buildFriendlyUpdate(log)
      case 'LOGIN':
        return `${user} inició sesión`
      case 'LOGOUT':
        return `${user} cerró sesión`
      case 'EXPORT':
        return `${user} exportó datos (${log.metadata?.record_count ?? 'varios'} registros)`
      case 'IMPORT':
        return `${user} importó datos (${log.metadata?.record_count ?? 'varios'} registros)`
      case 'BULK_OPERATION':
        return `${user} realizó una operación masiva${log.metadata?.action_type ? `: ${log.metadata.action_type}` : ''}`
      default:
        return `${user} realizó ${log.operation.toLowerCase()}`
    }
  }

  // Obtener fecha desde filtro
  const getDateFromFilter = (filter: string) => {
    const now = new Date()
    switch (filter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return weekAgo.toISOString()
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return monthAgo.toISOString()
      default:
        return undefined
    }
  }

  // Alternar expansión de log
  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setOperationFilter('')
    setTableFilter('')
    setDateFilter('all')
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || operationFilter || tableFilter || dateFilter !== 'all'

  // Obtener estadísticas
  const stats = {
    total: auditLogs.length,
    inserts: auditLogs.filter(log => log.operation === 'INSERT').length,
    updates: auditLogs.filter(log => log.operation === 'UPDATE').length,
    deletes: auditLogs.filter(log => log.operation === 'DELETE').length,
    logins: auditLogs.filter(log => log.operation === 'LOGIN').length,
  }

  // Renderizar cambios detallados con mejor diseño
  const renderChanges = (log: AuditLog) => {
    const { old_values, new_values, metadata } = log
    
    if (!old_values && !new_values && !metadata) return null

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-800">Detalles de la operación</h4>
        </div>
        
        {/* Información de fecha completa */}
        <div className="mb-3 p-2 bg-card rounded border border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">Fecha y hora exacta:</span>
            <span className="text-slate-800">{formatFullDate(log.created_at)}</span>
          </div>
        </div>
        
        {/* Campos afectados */}
        {metadata?.affected_fields && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100">
            <div className="flex items-start gap-2">
              <Target className="h-3 w-3 text-blue-600 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-blue-800">Campos modificados:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {metadata.affected_fields.map((field: string, index: number) => (
                    <Badge key={index} className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ajuste de stock (si aplica) */}
        {metadata?.stock_change && (
          <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-100">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-3 w-3 text-amber-600 mt-0.5" />
              <div className="text-xs">
                <span className="font-medium text-amber-800">Ajuste de stock:</span>
                <div className="mt-1 text-amber-900">
                  <span className="mr-2">De {metadata.stock_change.from}</span>
                  <span className="mr-2">a {metadata.stock_change.to}</span>
                  <Badge className={`text-xs ${metadata.stock_change.difference >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>Δ {metadata.stock_change.difference}</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Valores anteriores y nuevos */}
        {(old_values || new_values) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {old_values && (
              <div className="bg-red-50 rounded-lg border border-red-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h5 className="text-sm font-medium text-red-800">Valores anteriores</h5>
                </div>
                <div className="bg-card rounded border border-red-200 p-2 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">
                    {JSON.stringify(old_values, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {new_values && (
              <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <h5 className="text-sm font-medium text-emerald-800">Valores nuevos</h5>
                </div>
                <div className="bg-card rounded border border-emerald-200 p-2 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-emerald-700 whitespace-pre-wrap">
                    {JSON.stringify(new_values, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Metadatos adicionales */}
        {metadata && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <h5 className="text-sm font-medium text-slate-800">Información adicional</h5>
            </div>
            <div className="text-xs text-slate-700 space-y-2">
              {metadata.reason && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-600 min-w-0">Razón:</span>
                  <span className="text-slate-800">{metadata.reason}</span>
                </div>
              )}
              {metadata.notes && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-600 min-w-0">Notas:</span>
                  <span className="text-slate-800">{metadata.notes}</span>
                </div>
              )}
              {metadata.record_count && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-600 min-w-0">Registros afectados:</span>
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                    {metadata.record_count}
                  </Badge>
                </div>
              )}
              {(metadata.total_items || metadata.successful_items || metadata.failed_items) && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-600 min-w-0">Resumen masivo:</span>
                  <div className="flex gap-2">
                    {metadata.total_items !== undefined && (
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Total: {metadata.total_items}</Badge>
                    )}
                    {metadata.successful_items !== undefined && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">OK: {metadata.successful_items}</Badge>
                    )}
                    {metadata.failed_items !== undefined && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">Errores: {metadata.failed_items}</Badge>
                    )}
                  </div>
                </div>
              )}
              {metadata.bulk_operation_id && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-600 min-w-0">ID operación masiva:</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-mono">
                    {metadata.bulk_operation_id}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    loadAuditLogs()
  }, [open, searchTerm, operationFilter, tableFilter, dateFilter])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col" aria-describedby="audit-history-description">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-info-soft">
              <History className="h-6 w-6 text-info-soft" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Historial de Auditoría</h2>
              <p className="text-sm text-muted-foreground font-normal">Sistema completo de seguimiento y trazabilidad</p>
            </div>
          </DialogTitle>
          <DialogDescription id="audit-history-description">
            View detailed audit logs of all system operations including inventory changes, user actions, and data modifications.
          </DialogDescription>
        </DialogHeader>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 py-4">
          <div className="rounded-lg p-3 border border-border bg-muted">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg p-3 border border-success-soft bg-success-soft">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-success-soft" />
              <span className="text-xs font-medium text-success-soft">Creaciones</span>
            </div>
            <p className="text-lg font-bold text-success-soft">{stats.inserts}</p>
          </div>
          <div className="rounded-lg p-3 border border-info-soft bg-info-soft">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-info-soft" />
              <span className="text-xs font-medium text-info-soft">Modificaciones</span>
            </div>
            <p className="text-lg font-bold text-info-soft">{stats.updates}</p>
          </div>
          <div className="rounded-lg p-3 border border-error-soft bg-error-soft">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-error-soft" />
              <span className="text-xs font-medium text-error-soft">Eliminaciones</span>
            </div>
            <p className="text-lg font-bold text-error-soft">{stats.deletes}</p>
          </div>
          <div className="rounded-lg p-3 border border-success-soft bg-success-soft">
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-success-soft" />
              <span className="text-xs font-medium text-success-soft">Sesiones</span>
            </div>
            <p className="text-lg font-bold text-success-soft">{stats.logins}</p>
          </div>
        </div>

        {/* Barra de búsqueda y filtros mejorada */}
        <div className="space-y-3">
          {/* Búsqueda principal */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Buscar por usuario, acción, ID de registro, notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 text-base rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filtros expandibles */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros avanzados
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
              <Button
                onClick={loadAuditLogs}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Panel de filtros */}
            {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted rounded-lg border border-border">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de operación</label>
                <Select
                  value={operationFilter}
                  onValueChange={setOperationFilter}
                >
                  <option value="">Todas las operaciones</option>
                  <option value="INSERT">✨ Creaciones</option>
                  <option value="UPDATE">📝 Actualizaciones</option>
                  <option value="DELETE">🗑️ Eliminaciones</option>
                  <option value="LOGIN">🔐 Inicios de sesión</option>
                  <option value="LOGOUT">👋 Cierres de sesión</option>
                  <option value="EXPORT">📤 Exportaciones</option>
                  <option value="IMPORT">📥 Importaciones</option>
                  <option value="BULK_OPERATION">⚡ Operaciones masivas</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Entidad del sistema</label>
                <Select
                  value={tableFilter}
                  onValueChange={setTableFilter}
                >
                  <option value="">Todas las entidades</option>
                  <option value="inventory">📦 Inventario</option>
                  <option value="users">👥 Usuarios</option>
                  <option value="categories">🏷️ Categorías</option>
                  <option value="locations">📍 Ubicaciones</option>
                  <option value="transactions">💰 Transacciones</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Período de tiempo</label>
                <Select
                  value={dateFilter}
                  onValueChange={setDateFilter}
                >
                  <option value="all">🕐 Todo el tiempo</option>
                  <option value="today">📅 Hoy</option>
                  <option value="week">📊 Última semana</option>
                  <option value="month">📈 Último mes</option>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Lista de logs mejorada */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground font-medium">Cargando historial de auditoría...</p>
              <p className="text-sm text-muted-foreground">Analizando registros del sistema</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <History className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron registros</h3>
              <p className="text-muted-foreground mb-4">No hay registros de auditoría que coincidan con los filtros aplicados</p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpiar filtros y ver todo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <Card key={log.id} className="hover:shadow-md transition-all duration-200 border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icono de operación con mejor diseño */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                            {getOperationIcon(log.operation, log.table_name)}
                          </div>
                        </div>
                        
                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${getOperationColor(log.operation)} px-2 py-1 text-xs font-medium border transition-colors`}>
                              {log.operation}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {getTableIcon(log.table_name)}
                              <span className="font-medium">{getEntityName(log.table_name)}</span>
                            </div>
                          </div>
                          
                          <p className="text-base font-medium text-foreground mb-3 leading-relaxed">
                            {buildFriendlyMessage(log)}
                          </p>
                          
                          <div className="flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              <span className="font-medium">{log.user_email || 'Sistema automático'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatTimeAgo(log.created_at)}</span>
                            </div>
                            {log.record_id && (
                              <div className="flex items-center gap-1.5">
                                <Database className="h-3.5 w-3.5" />
                                <span className="font-mono">ID: {log.record_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Botón de expansión mejorado */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLogExpansion(log.id)}
                          className="flex-shrink-0 hover:bg-accent p-2 rounded-lg"
                        >
                          {expandedLogs.has(log.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Detalles expandidos */}
                    {expandedLogs.has(log.id) && renderChanges(log)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer con estadísticas mejorado */}
        <div className="border-t border-border pt-4 bg-muted rounded-lg px-4 py-3 mt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                Mostrando {auditLogs.length} registros
                {hasActiveFilters && ' (filtrados)'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-muted-foreground">Creaciones: {stats.inserts}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Modificaciones: {stats.updates}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-muted-foreground">Eliminaciones: {stats.deletes}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 