'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { MapPin, TrendingUp, Package2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { analyticsService } from '@/lib/database'

interface LocationMetricRow {
  location: string
  revenue: number
  orders: number
  efficiency: number
  stockLevel: number
  utilization: number
  staffCount: number | null
  avgProcessingTime: number | null
  accuracy: number | null
}

type AlertType = 'info' | 'warning' | 'alert'

interface LocationAlert {
  location: string
  type: AlertType
  message: string
  priority: 'low' | 'medium' | 'high'
}

export function LocationPerformance() {
  const [data, setData] = useState<LocationMetricRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const results = await analyticsService.getLocationPerformance()
        setData(results as LocationMetricRow[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load location performance')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalRevenue = useMemo(() => data.reduce((sum, loc) => sum + (loc.revenue || 0), 0), [data])
  const avgEfficiency = useMemo(() => data.length ? data.reduce((sum, loc) => sum + (loc.efficiency || 0), 0) / data.length : 0, [data])
  const topLocation = useMemo(() => {
    if (!data.length) return null
    return data.reduce((prev, current) => (prev.efficiency > current.efficiency) ? prev : current)
  }, [data])

  const radarData = useMemo(() => {
    if (!topLocation) return []
    return [
      { subject: 'Efficiency', A: topLocation.efficiency ?? 0, fullMark: 100 },
      { subject: 'Utilization', A: topLocation.utilization ?? 0, fullMark: 100 },
      { subject: 'Stock Level', A: topLocation.stockLevel ?? 0, fullMark: 100 },
      { subject: 'Accuracy', A: topLocation.accuracy ?? 0, fullMark: 100 },
      { subject: 'Processing Speed', A: topLocation.avgProcessingTime ? Math.max(0, Math.min(100, Math.round(100 - topLocation.avgProcessingTime * 10))) : 0, fullMark: 100 },
      { subject: 'Staff Productivity', A: topLocation.staffCount ? Math.min(100, topLocation.efficiency) : Math.round(topLocation.efficiency * 0.9), fullMark: 100 }
    ]
  }, [topLocation])

  const locationAlerts: LocationAlert[] = useMemo(() => {
    const alerts: LocationAlert[] = []
    data.forEach((loc) => {
      if (typeof loc.stockLevel === 'number' && loc.stockLevel < 30) {
        alerts.push({ location: loc.location, type: 'alert', message: 'Nivel de stock crítico (<30%)', priority: 'high' })
      } else if (typeof loc.stockLevel === 'number' && loc.stockLevel < 60) {
        alerts.push({ location: loc.location, type: 'warning', message: 'Nivel de stock bajo (<60%)', priority: 'medium' })
      }
      if (typeof loc.efficiency === 'number' && loc.efficiency < 50) {
        alerts.push({ location: loc.location, type: 'warning', message: 'Baja eficiencia', priority: 'medium' })
      }
      if ((loc.orders || 0) === 0 && (loc.revenue || 0) === 0 && (loc.utilization || 0) === 0) {
        alerts.push({ location: loc.location, type: 'info', message: 'Ubicación sin actividad reciente', priority: 'low' })
      }
    })
    return alerts.slice(0, 5)
  }, [data])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Error al cargar</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicaciones
            </CardTitle>
            <CardDescription>No hay datos de ubicaciones para mostrar</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Location Performance Overview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Performance Overview
          </CardTitle>
          <CardDescription>
            Revenue and efficiency metrics by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${(totalRevenue / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {avgEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Efficiency</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Locations</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="location" 
                className="text-xs fill-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <p className="font-semibold">{label}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Revenue</span>
                            <span className="font-medium">${data.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Orders</span>
                            <span className="font-medium">{data.orders}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Efficiency</span>
                            <span className="font-medium">{data.efficiency}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Staff</span>
                            <span className="font-medium">{data.staffCount ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Location Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performer
          </CardTitle>
          <CardDescription>
            {topLocation?.location} performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-green-50 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{topLocation?.efficiency}%</div>
            <div className="text-sm text-muted-foreground">Overall Efficiency</div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" className="text-xs fill-muted-foreground" />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                className="text-xs fill-muted-foreground"
              />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Location Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Location Alerts
          </CardTitle>
          <CardDescription>
            Issues requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locationAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className={`p-1 rounded-full ${
                  alert.type === 'alert' ? 'bg-red-100' :
                  alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`h-3 w-3 ${
                    alert.type === 'alert' ? 'text-red-600' :
                    alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{alert.location}</span>
                    <Badge 
                      variant={
                        alert.priority === 'high' ? 'destructive' :
                        alert.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Location Metrics */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Detailed Location Metrics
          </CardTitle>
          <CardDescription>
            Comprehensive performance breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Location</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Orders</th>
                  <th className="text-right p-2">Efficiency</th>
                  <th className="text-right p-2">Stock Level</th>
                  <th className="text-right p-2">Processing Time</th>
                  <th className="text-right p-2">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {data.map((location, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{location.location}</td>
                    <td className="p-2 text-right">${(location.revenue / 1000).toFixed(0)}K</td>
                    <td className="p-2 text-right">{location.orders}</td>
                    <td className="p-2 text-right">
                      <Badge variant={location.efficiency >= 90 ? 'default' : location.efficiency >= 85 ? 'secondary' : 'destructive'}>
                        {location.efficiency}%
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
                      <Badge variant={location.stockLevel >= 80 ? 'default' : location.stockLevel >= 75 ? 'secondary' : 'destructive'}>
                        {location.stockLevel}%
                      </Badge>
                    </td>
                    <td className="p-2 text-right">{location.avgProcessingTime != null ? `${location.avgProcessingTime}h` : '-'}</td>
                    <td className="p-2 text-right">{location.accuracy != null ? `${location.accuracy}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}