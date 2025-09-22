'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuditFilters } from '@/components/audit/audit-filters'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditStats } from '@/components/audit/audit-stats'
import { FilterOptions } from '@/lib/types'
import { auditService, AuditLog } from '@/lib/audit'
import { Shield, Activity, Clock, Users, Download, RefreshCw, FileText, Filter, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function AuditPage() {
  const t = useTranslations('audit')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [stats, setStats] = useState<any>(null)

  // Load audit logs
  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      // Map frontend filters to API parameters correctly
      const apiParams: any = {
        limit: 100
      }

      // Search filter
      if (filters.search) {
        apiParams.search = filters.search
      }

      // Operation/Action filter - map frontend values to API values
      if (filters.status) {
        const operationMap: Record<string, string> = {
          'created': 'INSERT',
          'updated': 'UPDATE', 
          'deleted': 'DELETE',
          'stock_adjusted': 'UPDATE',
          'bulk_operation': 'BULK_OPERATION',
          'quick_stock': 'UPDATE',
          'transferred': 'UPDATE',
          'archived': 'UPDATE',
          'restored': 'UPDATE',
          'imported': 'IMPORT',
          'exported': 'EXPORT'
        }
        apiParams.operation = operationMap[filters.status] || filters.status
      }

      // Table name filter - map category to table names
      if (filters.category) {
        const tableMap: Record<string, string> = {
          'item': 'inventory',
          'category': 'categories',
          'location': 'locations',
          'user': 'users',
          'system': 'audit_logs'
        }
        apiParams.table_name = tableMap[filters.category] || filters.category
      }

      // User filter - only when searching for specific user
      if (filters.category === 'user' && filters.search) {
        apiParams.user_email = filters.search
      }

      // Date range filters
      if (filters.dateRange?.start) {
        apiParams.date_from = filters.dateRange.start.toISOString()
      }
      if (filters.dateRange?.end) {
        apiParams.date_to = filters.dateRange.end.toISOString()
      }

      console.log('API Parameters:', apiParams) // Debug log

      const { data } = await auditService.getAuditLogs(apiParams)
      
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('subtitle')}
          </p>
        </div>
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-wrap gap-2" id="audit-actions">
          <Button
            onClick={loadAuditLogs}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-xs md:text-sm"
            size="sm"
            id="audit-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Actualizar Datos</span>
            <span className="sm:hidden">Actualizar</span>
          </Button>
          <Button
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 text-xs md:text-sm"
            size="sm"
            onClick={() => {
              // TODO: Implement export functionality
              console.log('Export audit logs')
            }}
            id="audit-export"
          >
            <Download className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
          <Button
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 text-xs md:text-sm"
            size="sm"
            onClick={() => {
              // TODO: Implement report generation
              console.log('Generate report')
            }}
            id="audit-report"
          >
            <FileText className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Generar Reporte</span>
            <span className="sm:hidden">Reporte</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // TODO: Implement tutorial
              console.log('Open audit tutorial')
            }} 
            aria-label="Abrir tutorial de historial"
            className="text-xs md:text-sm"
            id="audit-tutorial"
          >
            <Shield className="h-4 w-4 mr-1 md:mr-2" />
            Tutorial
          </Button>
        </div>
      </div>


      {/* Statistics Cards - Mobile Responsive Grid */}
      <div className="flex flex-wrap gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{t('totalOperations')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{stats?.total_operations || 0}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('allOperationsRecorded')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{t('operationsToday')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {auditLogs.filter(log => {
                const today = new Date()
                const logDate = new Date(log.created_at)
                return logDate.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('todayActivity')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{t('activeUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('usersWithRecentActivity')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{t('deletions')}</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-red-600">
              {auditLogs.filter(log => log.operation === 'DELETE').length}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('deletedRecords')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">{t('auditFilters')}</CardTitle>
          <CardDescription className="text-sm">
            {t('filterDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      {/* Audit Table - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">{t('auditLog')}</CardTitle>
          <CardDescription className="text-sm">
            {t('completeHistory')}
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