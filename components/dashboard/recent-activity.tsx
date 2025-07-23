'use client'

import { formatDate } from '@/lib/utils'
import { Package, Plus, Edit, Trash2, TrendingUp } from 'lucide-react'
import { analyticsService } from '@/lib/database'
import { useEffect, useState } from 'react'

interface AuditLog {
  id: string
  action: string
  table_name: string
  record_id: string
  old_values: any
  new_values: any
  created_at: string
  users: {
    id: string
    name: string
    email: string
  } | null
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'insert':
    case 'create':
      return Plus
    case 'update':
    case 'edit':
      return Edit
    case 'delete':
      return Trash2
    case 'stock_adjusted':
      return TrendingUp
    default:
      return Package
  }
}

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'insert':
    case 'create':
      return 'text-green-600 bg-green-50'
    case 'update':
    case 'edit':
      return 'text-blue-600 bg-blue-50'
    case 'delete':
      return 'text-red-600 bg-red-50'
    case 'stock_adjusted':
      return 'text-purple-600 bg-purple-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

const getActionDescription = (log: AuditLog) => {
  const tableName = log.table_name
  const action = log.action.toLowerCase()
  
  switch (action) {
    case 'insert':
      return `Created new ${tableName.slice(0, -1)}`
    case 'update':
      return `Updated ${tableName.slice(0, -1)} details`
    case 'delete':
      return `Deleted ${tableName.slice(0, -1)}`
    default:
      return `${action} on ${tableName}`
  }
}

const getEntityName = (log: AuditLog) => {
  if (log.new_values?.name) {
    return log.new_values.name
  }
  if (log.old_values?.name) {
    return log.old_values.name
  }
  return `${log.table_name.slice(0, -1)} ${log.record_id.slice(0, 8)}`
}

export function RecentActivity() {
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true)
        const data = await analyticsService.getRecentActivity()
        setActivities(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border bg-card animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <Package className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-red-600">
          Error loading activity
        </h3>
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-6">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-muted-foreground">
            No recent activity
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Activity will appear here as you make changes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const IconComponent = getActionIcon(activity.action)
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {getEntityName(activity)}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(new Date(activity.created_at))}
                    </time>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {getActionDescription(activity)}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    by {activity.users?.name || 'System'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}