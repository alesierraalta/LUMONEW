'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Activity, 
  Database, 
  Users, 
  Trash2, 
  Edit, 
  Plus,
  TrendingUp
} from 'lucide-react'

interface AuditStatsProps {
  stats: {
    total_operations: number
    operations_by_type: Record<string, number>
    operations_by_table: Record<string, number>
    recent_activity: any[]
  }
}

export function AuditStats({ stats }: AuditStatsProps) {
  // Prepare data for charts
  const operationTypeData = Object.entries(stats.operations_by_type).map(([type, count]) => ({
    name: getOperationLabel(type),
    value: count,
    color: getOperationColor(type)
  }))

  const tableData = Object.entries(stats.operations_by_table).map(([table, count]) => ({
    name: getTableLabel(table),
    value: count
  }))

  function getOperationLabel(operation: string): string {
    const labels: Record<string, string> = {
      'INSERT': 'Creaciones',
      'UPDATE': 'Actualizaciones',
      'DELETE': 'Eliminaciones',
      'LOGIN': 'Inicios de Sesión',
      'LOGOUT': 'Cierres de Sesión',
      'EXPORT': 'Exportaciones',
      'IMPORT': 'Importaciones',
      'BULK_OPERATION': 'Operaciones Masivas'
    }
    return labels[operation] || operation
  }

  function getOperationColor(operation: string): string {
    const colors: Record<string, string> = {
      'INSERT': '#10b981',
      'UPDATE': '#3b82f6',
      'DELETE': '#ef4444',
      'LOGIN': '#10b981',
      'LOGOUT': '#6b7280',
      'EXPORT': '#8b5cf6',
      'IMPORT': '#f59e0b',
      'BULK_OPERATION': '#6366f1'
    }
    return colors[operation] || '#6b7280'
  }

  function getTableLabel(table: string): string {
    const labels: Record<string, string> = {
      'inventory': 'Inventario',
      'categories': 'Categorías',
      'locations': 'Ubicaciones',
      'users': 'Usuarios',
      'audit_logs': 'Auditoría'
    }
    return labels[table] || table
  }

  function getOperationIcon(operation: string) {
    switch (operation) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Operations by Type Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Operaciones por Tipo
          </CardTitle>
          <CardDescription>
            Distribución de las operaciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operationTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Operations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumen de Operaciones
          </CardTitle>
          <CardDescription>
            Conteo detallado por tipo de operación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.operations_by_type).map(([operation, count]) => (
              <div key={operation} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getOperationIcon(operation)}
                  <span className="text-sm font-medium">
                    {getOperationLabel(operation)}
                  </span>
                </div>
                <Badge variant="secondary">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tables Activity */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Actividad por Tabla
          </CardTitle>
          <CardDescription>
            Operaciones realizadas en cada tabla del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tableData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tableData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(${index * 45}, 70%, 60%)`} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>
            Últimas operaciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getOperationIcon(activity.operation)}
                  <span className="truncate">
                    {getTableLabel(activity.table_name)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {stats.recent_activity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay actividad reciente
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Métricas Clave</CardTitle>
          <CardDescription>
            Estadísticas importantes del sistema de auditoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.operations_by_type['INSERT'] || 0}
              </div>
              <div className="text-sm text-muted-foreground">Creaciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.operations_by_type['UPDATE'] || 0}
              </div>
              <div className="text-sm text-muted-foreground">Modificaciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.operations_by_type['DELETE'] || 0}
              </div>
              <div className="text-sm text-muted-foreground">Eliminaciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(stats.operations_by_table).length}
              </div>
              <div className="text-sm text-muted-foreground">Tablas Afectadas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}