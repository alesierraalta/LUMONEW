'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - in a real app, this would come from an API
const mockChartData = [
  { month: 'Jan', value: 98000, items: 1150 },
  { month: 'Feb', value: 102000, items: 1180 },
  { month: 'Mar', value: 108000, items: 1220 },
  { month: 'Apr', value: 115000, items: 1280 },
  { month: 'May', value: 118000, items: 1300 },
  { month: 'Jun', value: 125000, items: 1350 },
  { month: 'Jul', value: 125430, items: 1247 }
]

export function InventoryChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={mockChartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-xs fill-muted-foreground"
        />
        <YAxis 
          className="text-xs fill-muted-foreground"
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Month
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Value
                      </span>
                      <span className="font-bold">
                        ${payload[0].value?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          strokeWidth={2}
          className="stroke-primary"
          dot={{
            fill: 'hsl(var(--primary))',
            strokeWidth: 2,
            r: 4
          }}
          activeDot={{
            r: 6,
            fill: 'hsl(var(--primary))'
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}