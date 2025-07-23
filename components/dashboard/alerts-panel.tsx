'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Bell, CheckCircle, XCircle, Clock, TrendingDown, Package, Users, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// Mock alerts data
const alertsData = [
  {
    id: '1',
    type: 'critical',
    category: 'inventory',
    title: 'Critical Stock Level',
    message: 'Wireless Headphones stock is critically low (2 units remaining)',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    location: 'Main Warehouse',
    actionRequired: true,
    acknowledged: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'warning',
    category: 'financial',
    title: 'Budget Threshold Exceeded',
    message: 'Marketing budget has exceeded 90% of monthly allocation',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    location: 'Finance Department',
    actionRequired: true,
    acknowledged: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'info',
    category: 'performance',
    title: 'Sales Target Achievement',
    message: 'North Branch has achieved 105% of monthly sales target',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    location: 'North Branch',
    actionRequired: false,
    acknowledged: true,
    priority: 'low'
  },
  {
    id: '4',
    type: 'warning',
    category: 'operations',
    title: 'Processing Delay',
    message: 'Order processing time increased by 25% in the last hour',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    location: 'Fulfillment Center',
    actionRequired: true,
    acknowledged: false,
    priority: 'medium'
  },
  {
    id: '5',
    type: 'critical',
    category: 'system',
    title: 'System Performance',
    message: 'Database response time is above acceptable threshold',
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    location: 'IT Infrastructure',
    actionRequired: true,
    acknowledged: false,
    priority: 'high'
  },
  {
    id: '6',
    type: 'info',
    category: 'inventory',
    title: 'Restock Completed',
    message: 'Bluetooth Speakers restocked successfully (50 units added)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    location: 'South Branch',
    actionRequired: false,
    acknowledged: true,
    priority: 'low'
  }
]

// Alert statistics
const alertStats = {
  total: alertsData.length,
  critical: alertsData.filter(alert => alert.type === 'critical').length,
  warning: alertsData.filter(alert => alert.type === 'warning').length,
  info: alertsData.filter(alert => alert.type === 'info').length,
  unacknowledged: alertsData.filter(alert => !alert.acknowledged).length,
  actionRequired: alertsData.filter(alert => alert.actionRequired).length
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'critical':
      return XCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return CheckCircle
    default:
      return Bell
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'inventory':
      return Package
    case 'financial':
      return DollarSign
    case 'operations':
      return Clock
    case 'performance':
      return TrendingDown
    case 'system':
      return Bell
    default:
      return Bell
  }
}

const getAlertColor = (type: string) => {
  switch (type) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'info':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-muted-foreground bg-muted border-border'
  }
}

const formatTimeAgo = (timestamp: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

export function AlertsPanel() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'unacknowledged'>('all')
  const [alerts, setAlerts] = useState(alertsData)

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'critical':
        return alert.type === 'critical'
      case 'warning':
        return alert.type === 'warning'
      case 'info':
        return alert.type === 'info'
      case 'unacknowledged':
        return !alert.acknowledged
      default:
        return true
    }
  })

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  return (
    <div className="space-y-4">
      {/* Alert Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Alerts</p>
                <p className="text-2xl font-bold">{alertStats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{alertStats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Info</p>
                <p className="text-2xl font-bold text-blue-600">{alertStats.info}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Unread</p>
                <p className="text-2xl font-bold text-purple-600">{alertStats.unacknowledged}</p>
              </div>
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Action Req.</p>
                <p className="text-2xl font-bold text-orange-600">{alertStats.actionRequired}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Real-time Alerts
              </CardTitle>
              <CardDescription>
                System notifications and business alerts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('critical')}
              >
                Critical
              </Button>
              <Button
                variant={filter === 'warning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('warning')}
              >
                Warnings
              </Button>
              <Button
                variant={filter === 'unacknowledged' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unacknowledged')}
              >
                Unread
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                  No alerts found
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filter === 'all' ? 'All systems are running smoothly.' : `No ${filter} alerts at this time.`}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.type)
                const CategoryIcon = getCategoryIcon(alert.category)
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                      !alert.acknowledged ? 'ring-2 ring-offset-2 ring-blue-500/20' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <AlertIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{alert.title}</h4>
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'secondary'}>
                            {alert.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm mt-1">{alert.message}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            📍 {alert.location}
                          </span>
                          {alert.actionRequired && (
                            <Badge variant="outline" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}