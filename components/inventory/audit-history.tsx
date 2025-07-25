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
      return <Plus className={`${iconClass} text-emerald-600`} />
    case 'UPDATE':
      return <Edit className={`${iconClass} text-blue-600`} />
    case 'DELETE':
      return <Trash2 className={`${iconClass} text-red-600`} />
    case 'LOGIN':
      return <LogIn className={`${iconClass} text-green-600`} />
    case 'LOGOUT':
      return <LogOut className={`${iconClass} text-gray-600`} />
    case 'EXPORT':
      return <Download className={`${iconClass} text-purple-600`} />
    case 'IMPORT':
      return <Upload className={`${iconClass} text-orange-600`} />
    case 'BULK_OPERATION':
      return <Layers className={`${iconClass} text-indigo-600`} />
    case 'VIEW':
      return <Eye className={`${iconClass} text-gray-500`} />
    default:
      return <Activity className={`${iconClass} text-gray-500`} />
  }
}

// Mapeo de iconos por tabla con mejor estética
const getTableIcon = (tableName: string) => {
  const iconClass = "h-3.5 w-3.5"
  switch (tableName) {
    case 'inventory':
      return <Package className={`${iconClass} text-blue-600`} />
    case 'users':
      return <User className={`${iconClass} text-green-600`} />
    case 'categories':
      return <Tag className={`${iconClass} text-purple-600`} />
    case 'locations':
      return <MapPin className={`${iconClass} text-orange-600`} />
    case 'transactions':
      return <TrendingUp className={`${iconClass} text-indigo-600`} />
    default:
      return <Database className={`${iconClass} text-gray-500`} />
  }
}

// Colores por tipo de operación con mejor paleta
const getOperationColor = (operation: string) => {
  switch (operation) {
    case 'INSERT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    case 'UPDATE':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    case 'DELETE':
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    case 'LOGIN':
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    case 'LOGOUT':
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    case 'EXPORT':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
    case 'IMPORT':
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
    case 'BULK_OPERATION':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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
      case 'inventory_stock_adjusted':
        return 'Ajustó niveles de stock en inventario'
      case 'bulk_inventory_update':
        return 'Realizó actualización masiva de inventario'
      case 'bulk_inventory_delete':
        return 'Ejecutó eliminación masiva de inventario'
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
        return `Ejecutó ${operation.toLowerCase()} en ${getEntityName(table_name)}`
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
      return `Realizó ${operation.toLowerCase()} en ${getEntityName(table_name)}`
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
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [operationFilter, setOperationFilter] = useState<string>('')
  const [tableFilter, setTableFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

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
        <div className="mb-3 p-2 bg-white rounded border border-slate-100">
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
        
        {/* Valores anteriores y nuevos */}
        {(old_values || new_values) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {old_values && (
              <div className="bg-red-50 rounded-lg border border-red-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h5 className="text-sm font-medium text-red-800">Valores anteriores</h5>
                </div>
                <div className="bg-white rounded border border-red-200 p-2 max-h-32 overflow-y-auto">
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
                <div className="bg-white rounded border border-emerald-200 p-2 max-h-32 overflow-y-auto">
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Historial de Auditoría</h2>
              <p className="text-sm text-slate-600 font-normal">Sistema completo de seguimiento y trazabilidad</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 py-4">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-600">Total</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Creaciones</span>
            </div>
            <p className="text-lg font-bold text-emerald-800">{stats.inserts}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Modificaciones</span>
            </div>
            <p className="text-lg font-bold text-blue-800">{stats.updates}</p>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Eliminaciones</span>
            </div>
            <p className="text-lg font-bold text-red-800">{stats.deletes}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Sesiones</span>
            </div>
            <p className="text-lg font-bold text-green-800">{stats.logins}</p>
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
              className="pl-12 pr-4 py-3 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
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
                  className="text-slate-600 hover:text-slate-900"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de operación</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Entidad del sistema</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Período de tiempo</label>
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
              <p className="mt-4 text-slate-600 font-medium">Cargando historial de auditoría...</p>
              <p className="text-sm text-slate-500">Analizando registros del sistema</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-gray-200 rounded-full flex items-center justify-center">
                <History className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No se encontraron registros</h3>
              <p className="text-slate-600 mb-4">No hay registros de auditoría que coincidan con los filtros aplicados</p>
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
                <Card key={log.id} className="hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icono de operación con mejor diseño */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 flex items-center justify-center">
                            {getOperationIcon(log.operation, log.table_name)}
                          </div>
                        </div>
                        
                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${getOperationColor(log.operation)} px-2 py-1 text-xs font-medium border transition-colors`}>
                              {log.operation}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              {getTableIcon(log.table_name)}
                              <span className="font-medium">{getEntityName(log.table_name)}</span>
                            </div>
                          </div>
                          
                          <p className="text-base font-medium text-slate-900 mb-3 leading-relaxed">
                            {getActionDescription(log)}
                          </p>
                          
                          <div className="flex items-center gap-6 text-xs text-slate-500">
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
                          className="flex-shrink-0 hover:bg-slate-100 p-2 rounded-lg"
                        >
                          {expandedLogs.has(log.id) ? (
                            <ChevronDown className="h-5 w-5 text-slate-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-600" />
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
        <div className="border-t border-slate-200 pt-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg px-4 py-3 mt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-700">
                Mostrando {auditLogs.length} registros
                {hasActiveFilters && ' (filtrados)'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600">Creaciones: {stats.inserts}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600">Modificaciones: {stats.updates}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-600">Eliminaciones: {stats.deletes}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 