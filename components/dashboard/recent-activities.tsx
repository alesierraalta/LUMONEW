'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { auditService } from '@/lib/audit'
import { 
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
  Clock
} from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string
  operation: string
  table_name: string
  record_id: string
  old_values: any
  new_values: any
  ip_address: string
  user_agent: string
  session_id: string
  metadata: any
  created_at: string
}

const operationIcons = {
  INSERT: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  EXPORT: Download,
  IMPORT: Upload,
  BULK_OPERATION: Activity
}

const operationColors = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-orange-100 text-orange-800',
  IMPORT: 'bg-indigo-100 text-indigo-800',
  BULK_OPERATION: 'bg-yellow-100 text-yellow-800'
}

const tableIcons = {
  users: User,
  inventory: Package,
  locations: MapPin,
  categories: Tag
}

const getOperationDescription = (log: AuditLog) => {
  const { operation, table_name, metadata } = log
  
  if (metadata?.action_type) {
    switch (metadata.action_type) {
      case 'user_created':
        return 'Nuevo usuario creado'
      case 'user_updated':
        return 'Usuario actualizado'
      case 'user_deleted':
        return 'Usuario eliminado'
      case 'inventory_item_created':
        return 'Artículo de inventario creado'
      case 'inventory_item_updated':
        return 'Artículo de inventario actualizado'
      case 'inventory_stock_adjusted':
        return 'Stock ajustado'
      case 'inventory_item_deleted':
        return 'Artículo de inventario eliminado'
      case 'category_created':
        return 'Categoría creada'
      case 'category_updated':
        return 'Categoría actualizada'
      case 'category_deleted':
        return 'Categoría eliminada'
      case 'location_created':
        return 'Ubicación creada'
      case 'location_updated':
        return 'Ubicación actualizada'
      case 'location_deleted':
        return 'Ubicación eliminada'
      case 'bulk_inventory_update':
        return 'Actualización masiva de inventario'
      case 'bulk_inventory_delete':
        return 'Eliminación masiva de inventario'
      default:
        return `${operation} en ${table_name}`
    }
  }
  
  switch (operation) {
    case 'INSERT':
      return `Creado en ${table_name}`
    case 'UPDATE':
      return `Actualizado en ${table_name}`
    case 'DELETE':
      return `Eliminado de ${table_name}`
    case 'LOGIN':
      return 'Inicio de sesión'
    case 'LOGOUT':
      return 'Cierre de sesión'
    case 'EXPORT':
      return `Exportación de ${table_name}`
    case 'IMPORT':
      return `Importación a ${table_name}`
    case 'BULK_OPERATION':
      return `Operación masiva en ${table_name}`
    default:
      return `${operation} en ${table_name}`
  }
}

const getEntityName = (log: AuditLog) => {
  const { new_values, old_values, metadata } = log
  
  // Try to get name from metadata first
  if (metadata?.notes) {
    const match = metadata.notes.match(/Item: (.+?) \(SKU:|Deleted item: (.+?) \(SKU:/)
    if (match) return match[1] || match[2]
  }
  
  // Try to get name from new_values or old_values
  const data = new_values || old_values
  if (data) {
    return data.name || data.email || data.title || `ID: ${log.record_id}`
  }
  
  return `ID: ${log.record_id}`
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Hace unos segundos'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `Hace ${days} día${days > 1 ? 's' : ''}`
  }
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoading(true)
        const logs = await auditService.getRecentLogs(10) // Get last 10 activities
        setActivities(logs)
      } catch (err) {
        console.error('Error fetching recent activities:', err)
        setError('Error al cargar las actividades recientes')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivities()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actividades Recientes
          </CardTitle>
          <CardDescription>
            Últimas acciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actividades Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Actividades Recientes
        </CardTitle>
        <CardDescription>
          Últimas acciones realizadas en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay actividades recientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const OperationIcon = operationIcons[activity.operation as keyof typeof operationIcons] || Activity
              const TableIcon = tableIcons[activity.table_name as keyof typeof tableIcons] || Package
              const operationColor = operationColors[activity.operation as keyof typeof operationColors] || 'bg-gray-100 text-gray-800'
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${operationColor}`}>
                      <OperationIcon className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TableIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900">
                        {getOperationDescription(activity)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {activity.operation}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {getEntityName(activity)}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.created_at)}
                      </div>
                      
                      {activity.user_id && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Usuario: {activity.user_id.slice(0, 8)}...
                        </div>
                      )}
                      
                      {activity.metadata?.bulk_operation_id && (
                        <Badge variant="secondary" className="text-xs">
                          Operación masiva
                        </Badge>
                      )}
                    </div>
                    
                    {/* Show additional details for specific operations */}
                    {activity.metadata?.stock_change && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Stock: {activity.metadata.stock_change.from} → {activity.metadata.stock_change.to}
                        {activity.metadata.stock_change.difference > 0 ? ' (+' : ' ('}
                        {activity.metadata.stock_change.difference})
                      </div>
                    )}
                    
                    {activity.metadata?.total_items && (
                      <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {activity.metadata.successful_items}/{activity.metadata.total_items} elementos procesados
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="text-center pt-2">
              <a 
                href="/audit" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver historial completo →
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}