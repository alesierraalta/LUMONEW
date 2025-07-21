'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { MapPin, TrendingUp, Users, Package2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Mock data for location performance
const locationData = [
  {
    location: 'Main Warehouse',
    revenue: 125000,
    orders: 450,
    efficiency: 92,
    stockLevel: 85,
    staffCount: 12,
    avgProcessingTime: 2.3,
    accuracy: 98.5,
    utilization: 88
  },
  {
    location: 'North Branch',
    revenue: 89000,
    orders: 320,
    efficiency: 87,
    stockLevel: 78,
    staffCount: 8,
    avgProcessingTime: 2.8,
    accuracy: 96.2,
    utilization: 82
  },
  {
    location: 'South Branch',
    revenue: 76000,
    orders: 280,
    efficiency: 84,
    stockLevel: 72,
    staffCount: 7,
    avgProcessingTime: 3.1,
    accuracy: 94.8,
    utilization: 79
  },
  {
    location: 'East Branch',
    revenue: 95000,
    orders: 340,
    efficiency: 89,
    stockLevel: 81,
    staffCount: 9,
    avgProcessingTime: 2.6,
    accuracy: 97.1,
    utilization: 85
  },
  {
    location: 'West Branch',
    revenue: 68000,
    orders: 240,
    efficiency: 81,
    stockLevel: 69,
    staffCount: 6,
    avgProcessingTime: 3.4,
    accuracy: 93.5,
    utilization: 76
  }
]

// Performance radar data for top location
const radarData = [
  { subject: 'Efficiency', A: 92, fullMark: 100 },
  { subject: 'Accuracy', A: 98.5, fullMark: 100 },
  { subject: 'Utilization', A: 88, fullMark: 100 },
  { subject: 'Stock Level', A: 85, fullMark: 100 },
  { subject: 'Processing Speed', A: 87, fullMark: 100 },
  { subject: 'Staff Productivity', A: 90, fullMark: 100 }
]

// Location alerts
const locationAlerts = [
  { location: 'South Branch', type: 'warning', message: 'Stock level below 75%', priority: 'medium' },
  { location: 'West Branch', type: 'alert', message: 'Processing time above target', priority: 'high' },
  { location: 'North Branch', type: 'info', message: 'Efficiency improvement opportunity', priority: 'low' }
]

export function LocationPerformance() {
  const totalRevenue = locationData.reduce((sum, loc) => sum + loc.revenue, 0)
  const avgEfficiency = locationData.reduce((sum, loc) => sum + loc.efficiency, 0) / locationData.length
  const topLocation = locationData.reduce((prev, current) => 
    (prev.efficiency > current.efficiency) ? prev : current
  )

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
            <div className="text-center p-3 bg-blue-50 rounded-lg">
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
                {locationData.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Locations</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                            <span className="font-medium">{data.staffCount}</span>
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
            {topLocation.location} performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-green-50 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{topLocation.efficiency}%</div>
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
                {locationData.map((location, index) => (
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
                    <td className="p-2 text-right">{location.avgProcessingTime}h</td>
                    <td className="p-2 text-right">{location.accuracy}%</td>
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