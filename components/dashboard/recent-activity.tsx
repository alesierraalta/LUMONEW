'use client'

import { formatDate } from '@/lib/utils'
import { Package, Plus, Edit, Trash2, TrendingUp } from 'lucide-react'

// Mock data - in a real app, this would come from an API
const mockActivities = [
  {
    id: '1',
    action: 'created',
    entityType: 'item',
    entityName: 'Wireless Mouse',
    userName: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    details: 'Added new inventory item'
  },
  {
    id: '2',
    action: 'updated',
    entityType: 'item',
    entityName: 'USB-C Cable',
    userName: 'Jane Smith',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    details: 'Updated stock quantity from 45 to 12'
  },
  {
    id: '3',
    action: 'stock_adjusted',
    entityType: 'item',
    entityName: 'Bluetooth Speaker',
    userName: 'Mike Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    details: 'Stock adjusted: +25 units received'
  },
  {
    id: '4',
    action: 'created',
    entityType: 'category',
    entityName: 'Audio Equipment',
    userName: 'Sarah Wilson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    details: 'Created new category'
  },
  {
    id: '5',
    action: 'deleted',
    entityType: 'item',
    entityName: 'Old Keyboard',
    userName: 'Tom Brown',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    details: 'Removed discontinued item'
  }
]

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return Plus
    case 'updated':
      return Edit
    case 'deleted':
      return Trash2
    case 'stock_adjusted':
      return TrendingUp
    default:
      return Package
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'text-green-600 bg-green-50'
    case 'updated':
      return 'text-blue-600 bg-blue-50'
    case 'deleted':
      return 'text-red-600 bg-red-50'
    case 'stock_adjusted':
      return 'text-purple-600 bg-purple-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {mockActivities.length === 0 ? (
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
          {mockActivities.map((activity) => {
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
                      {activity.entityName}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </time>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.details}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    by {activity.userName}
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