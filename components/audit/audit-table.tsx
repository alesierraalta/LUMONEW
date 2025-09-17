'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AuditLog } from '@/lib/audit'
import { 
  Eye, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  User,
  Calendar,
  Database,
  Activity,
  Trash2,
  Edit,
  Plus,
  Download,
  Upload,
  Users,
  LogIn,
  LogOut
} from 'lucide-react'

interface AuditTableProps {
  auditLogs: AuditLog[]
  loading: boolean
  onRefresh: () => void
}

export function AuditTable({ auditLogs, loading, onRefresh }: AuditTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />
      case 'LOGIN':
        return <LogIn className="h-4 w-4 text-green-600" />
      case 'LOGOUT':
        return <LogOut className="h-4 w-4 text-gray-600" />
      case 'EXPORT':
        return <Download className="h-4 w-4 text-purple-600" />
      case 'IMPORT':
        return <Upload className="h-4 w-4 text-orange-600" />
      case 'BULK_OPERATION':
        return <Users className="h-4 w-4 text-indigo-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getOperationBadge = (operation: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'INSERT': 'default',
      'UPDATE': 'secondary',
      'DELETE': 'destructive',
      'LOGIN': 'default',
      'LOGOUT': 'outline',
      'EXPORT': 'secondary',
      'IMPORT': 'secondary',
      'BULK_OPERATION': 'outline'
    }

    const labels: Record<string, string> = {
      'INSERT': 'Creado',
      'UPDATE': 'Actualizado',
      'DELETE': 'Eliminado',
      'LOGIN': 'Inicio Sesión',
      'LOGOUT': 'Cerrar Sesión',
      'EXPORT': 'Exportado',
      'IMPORT': 'Importado',
      'BULK_OPERATION': 'Operación Masiva'
    }

    return (
      <Badge variant={variants[operation] || 'outline'} className="text-xs">
        {getOperationIcon(operation)}
        <span className="ml-1">{labels[operation] || operation}</span>
      </Badge>
    )
  }

  const getHumanReadableDescription = (log: AuditLog) => {
    // Use enhanced action description if available, otherwise fallback to basic description
    if (log.action_description) {
      return log.action_description
    }
    
    const user = log.user_name || log.user_email || 'Sistema'
    const table = formatTableName(log.table_name)
    const time = format(new Date(log.created_at), 'HH:mm', { locale: es })
    
    switch (log.operation) {
      case 'INSERT':
        return `${user} creó un nuevo registro en ${table} a las ${time}`
      case 'UPDATE':
        return `${user} actualizó un registro en ${table} a las ${time}`
      case 'DELETE':
        return `${user} eliminó un registro de ${table} a las ${time}`
      case 'LOGIN':
        return `${user} inició sesión a las ${time}`
      case 'LOGOUT':
        return `${user} cerró sesión a las ${time}`
      case 'EXPORT':
        return `${user} exportó datos de ${table} a las ${time}`
      case 'IMPORT':
        return `${user} importó datos a ${table} a las ${time}`
      case 'BULK_OPERATION':
        return `${user} realizó una operación masiva en ${table} a las ${time}`
      default:
        return `${user} realizó una operación en ${table} a las ${time}`
    }
  }

  const formatTableName = (tableName: string) => {
    const tableLabels: Record<string, string> = {
      'inventory': 'Inventario',
      'categories': 'Categorías',
      'locations': 'Ubicaciones',
      'users': 'Usuarios',
      'audit_logs': 'Auditoría'
    }
    return tableLabels[tableName] || tableName
  }

  const formatFieldName = (field: string) => {
    const fieldLabels: Record<string, string> = {
      'name': 'Nombre',
      'email': 'Correo electrónico',
      'quantity': 'Cantidad',
      'price': 'Precio',
      'unit_price': 'Precio unitario',
      'description': 'Descripción',
      'status': 'Estado',
      'created_at': 'Fecha de creación',
      'updated_at': 'Fecha de actualización',
      'category_id': 'Categoría',
      'location_id': 'Ubicación',
      'user_id': 'Usuario',
      'is_active': 'Activo',
      'role': 'Rol'
    }
    return fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1)
  }

  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return 'Sin valor'
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (typeof value === 'string' && value.includes('@')) return value // Email
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      // Date format
      return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: es })
    }
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const renderValueChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null

    const changes: { field: string; old: any; new: any }[] = []

    if (oldValues && newValues) {
      // For updates, show changed fields
      Object.keys(newValues).forEach(key => {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
          changes.push({ field: key, old: oldValues[key], new: newValues[key] })
        }
      })
    }

    return (
      <div className="space-y-3">
        {changes.length > 0 && (
          <div>
            <div className="space-y-2">
              {changes.map((change: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 border rounded-lg p-3">
                  <div className="font-medium text-sm mb-2 text-foreground">
                    📝 {formatFieldName(change.field)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-600 font-medium">Antes:</span>
                      <span className="bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-red-700 dark:text-red-300">
                        {formatFieldValue(change.old)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 font-medium">Ahora:</span>
                      <span className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-700 dark:text-green-300">
                        {formatFieldValue(change.new)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {oldValues && !newValues && (
          <div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-2 text-red-800 dark:text-red-200">
                🗑️ Información eliminada:
              </h5>
              <div className="space-y-1">
                {Object.entries(oldValues).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="font-medium">{formatFieldName(key)}:</span>
                    <span className="ml-2 text-red-700 dark:text-red-300">
                      {formatFieldValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {newValues && !oldValues && (
          <div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <h5 className="font-medium text-sm mb-2 text-green-800 dark:text-green-200">
                ✅ Nueva información creada:
              </h5>
              <div className="space-y-1">
                {Object.entries(newValues).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="font-medium">{formatFieldName(key)}:</span>
                    <span className="ml-2 text-green-700 dark:text-green-300">
                      {formatFieldValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const getUserDisplayInfo = (log: AuditLog) => {
    const userName = log.user_name || log.user_email || 'Sistema'
    const userEmail = log.user_email
    const userRole = log.user_role
    const userDepartment = log.user_department
    const userAvatar = log.user_avatar_url
    
    return {
      name: userName,
      email: userEmail,
      role: userRole,
      department: userDepartment,
      avatar: userAvatar,
      displayName: userName === userEmail ? userName.split('@')[0] : userName
    }
  }

  const getActionImpactBadge = (impact: string | null) => {
    if (!impact) return null
    
    const impactConfig = {
      'LOW': { variant: 'outline' as const, className: 'text-green-600 border-green-300', label: 'Bajo' },
      'MEDIUM': { variant: 'secondary' as const, className: 'text-yellow-600 border-yellow-300', label: 'Medio' },
      'HIGH': { variant: 'default' as const, className: 'text-orange-600 border-orange-300', label: 'Alto' },
      'CRITICAL': { variant: 'destructive' as const, className: 'text-red-600 border-red-300', label: 'Crítico' }
    }
    
    const config = impactConfig[impact as keyof typeof impactConfig]
    if (!config) return null
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    )
  }

  const getActionCategoryBadge = (category: string | null) => {
    if (!category) return null
    
    return (
      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
        {category}
      </Badge>
    )
  }

  const getBusinessContextInfo = (log: AuditLog) => {
    if (!log.business_context) return null
    
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <h5 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-200">
          🏢 Contexto de Negocio:
        </h5>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {log.business_context}
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando registros de auditoría...</span>
      </div>
    )
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-center p-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay registros de auditoría
        </h3>
        <p className="text-gray-500 mb-4">
          No se encontraron registros que coincidan con los filtros aplicados.
        </p>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button - Mobile Responsive */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {auditLogs.length} registros de actividad
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Actualizar</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>

      {/* Mobile-First Card Layout */}
      <div className="space-y-3">
        {auditLogs.map((log) => (
          <Card key={log.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Main Activity Description */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">
                  {getOperationIcon(log.operation)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {getHumanReadableDescription(log)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getOperationBadge(log.operation)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    {log.ip_address && (
                      <span className="text-xs text-muted-foreground">
                        IP: {log.ip_address}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRowExpansion(log.id)}
                  className="flex-shrink-0"
                >
                  {expandedRows.has(log.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{log.user_email || 'Sistema'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>{formatTableName(log.table_name)}</span>
                </div>
                {log.record_id && (
                  <div className="flex items-center gap-1">
                    <span>ID:</span>
                    <code className="bg-muted px-1 rounded text-xs">
                      {log.record_id.length > 8 
                        ? `${log.record_id.slice(0, 8)}...` 
                        : log.record_id
                      }
                    </code>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expandedRows.has(log.id) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="space-y-4">
                    {/* Session Information */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-foreground">📋 Información de Sesión</h4>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Fecha completa:</span>
                            <div className="text-visible-dark">
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Dirección IP:</span>
                            <div className="text-visible-dark">{log.ip_address || 'No disponible'}</div>
                          </div>
                          {log.session_id && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">ID de Sesión:</span>
                              <div className="text-muted-foreground font-mono text-xs break-all">
                                {log.session_id}
                              </div>
                            </div>
                          )}
                          {log.user_agent && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Navegador:</span>
                              <div className="text-muted-foreground text-xs break-words">
                                {log.user_agent}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Business Context */}
                    {getBusinessContextInfo(log)}

                    {/* Data Changes */}
                    {(log.old_values || log.new_values) && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-foreground">🔄 Cambios Realizados</h4>
                        <div className="bg-muted/50 rounded-lg p-3">
                          {renderValueChanges(log.old_values, log.new_values)}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {log.metadata && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-foreground">📊 Información Adicional</h4>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <pre className="text-xs text-muted-foreground overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table for larger screens */}
      <div className="hidden lg:block">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Tabla</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <React.Fragment key={`table-${log.id}`}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(log.id)}
                      >
                        {expandedRows.has(log.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOperationIcon(log.operation)}
                        <span className="font-medium">{getHumanReadableDescription(log)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const userInfo = getUserDisplayInfo(log)
                          return (
                            <>
                              {userInfo.avatar ? (
                                <img 
                                  src={userInfo.avatar} 
                                  alt={userInfo.displayName}
                                  className="h-4 w-4 rounded-full"
                                />
                              ) : (
                                <User className="h-4 w-4 text-gray-400" />
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium">{userInfo.displayName}</span>
                                {userInfo.role && (
                                  <span className="text-xs text-gray-500">{userInfo.role}</span>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: es })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-gray-400" />
                        <span>{formatTableName(log.table_name)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {log.ip_address || 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}