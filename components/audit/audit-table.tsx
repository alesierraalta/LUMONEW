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
      <Badge variant={variants[operation] || 'outline'}>
        {getOperationIcon(operation)}
        <span className="ml-1">{labels[operation] || operation}</span>
      </Badge>
    )
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
      <div className="space-y-2">
        {changes.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Campos Modificados:</h4>
            <div className="space-y-1">
              {changes.map((change: any, index: number) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">{change.field}:</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 line-through">
                      {JSON.stringify(change.old)}
                    </span>
                    <span>→</span>
                    <span className="text-green-600">
                      {JSON.stringify(change.new)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {oldValues && !newValues && (
          <div>
            <h4 className="font-medium text-sm mb-2">Datos Eliminados:</h4>
            <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          </div>
        )}

        {newValues && !oldValues && (
          <div>
            <h4 className="font-medium text-sm mb-2">Datos Creados:</h4>
            <pre className="text-xs bg-green-50 p-2 rounded overflow-auto">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          </div>
        )}
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {auditLogs.length} registros
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Operación</TableHead>
              <TableHead>Tabla</TableHead>
              <TableHead>Registro ID</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow className="hover:bg-gray-50">
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
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: es })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {log.user_email || 'Sistema'}
                        </div>
                        {log.user_id && (
                          <div className="text-xs text-gray-500">
                            ID: {log.user_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getOperationBadge(log.operation)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      <span>{formatTableName(log.table_name)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {log.record_id.length > 20 
                        ? `${log.record_id.slice(0, 20)}...` 
                        : log.record_id
                      }
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">
                      {log.ip_address || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion(log.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>

                {expandedRows.has(log.id) && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Card className="m-2">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Información de Sesión</h4>
                              <div className="space-y-1 text-sm">
                                <div><strong>Session ID:</strong> {log.session_id || 'N/A'}</div>
                                <div><strong>User Agent:</strong> {log.user_agent || 'N/A'}</div>
                                <div><strong>IP Address:</strong> {log.ip_address || 'N/A'}</div>
                              </div>
                            </div>
                            
                            {log.metadata && (
                              <div>
                                <h4 className="font-medium mb-2">Metadatos</h4>
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>

                          {(log.old_values || log.new_values) && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Cambios en los Datos</h4>
                              {renderValueChanges(log.old_values, log.new_values)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}