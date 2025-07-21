'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditStats } from '@/components/audit/audit-stats'
import { FilterOptions } from '@/lib/types'
import { auditService, AuditLog } from '@/lib/audit'
import { Shield, Activity, Clock, Users } from 'lucide-react'

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [stats, setStats] = useState<any>(null)

  // Load audit logs
  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      const { data } = await auditService.getAuditLogs({
        limit: 100,
        user_id: filters.category === 'user' ? filters.search : undefined,
        table_name: filters.location,
        operation: filters.status,
        search: filters.search,
        date_from: filters.dateRange?.start?.toISOString(),
        date_to: filters.dateRange?.end?.toISOString()
      })
      
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Load audit statistics
  const loadStats = async () => {
    try {
      const statsData = await auditService.getAuditStats(
        filters.dateRange?.start?.toISOString(),
        filters.dateRange?.end?.toISOString()
      )
      setStats(statsData)
    } catch (error) {
      console.error('Error loading audit stats:', error)
    }
  }

  useEffect(() => {
    loadAuditLogs()
    loadStats()
  }, [filters])

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoría del Sistema</h1>
          <p className="text-muted-foreground">
            Registro completo de todas las actividades y cambios en el sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && <AuditStats stats={stats} />}

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Operaciones</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_operations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas las operaciones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operaciones Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => {
                const today = new Date()
                const logDate = new Date(log.created_at)
                return logDate.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Actividad del día actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios con actividad reciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eliminaciones</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditLogs.filter(log => log.operation === 'DELETE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registros eliminados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Auditoría</CardTitle>
          <CardDescription>
            Filtra los registros de auditoría por fecha, usuario, acción y más
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoría</CardTitle>
          <CardDescription>
            Historial completo de todas las operaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTable 
            auditLogs={auditLogs} 
            loading={loading}
            onRefresh={loadAuditLogs}
          />
        </CardContent>
      </Card>
    </div>
  )
}