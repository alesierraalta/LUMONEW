'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import { InventoryItem } from '@/lib/types'

interface StockWarningsProps {
  items: InventoryItem[]
}

export function StockWarnings({ items }: StockWarningsProps) {
  // Calculate stock statistics
  const outOfStockItems = items.filter(item => item.currentStock === 0)
  const lowStockItems = items.filter(item => 
    item.currentStock > 0 && item.currentStock < item.minimumLevel
  )
  const goodStockItems = items.filter(item => 
    item.currentStock >= item.minimumLevel
  )

  if (outOfStockItems.length === 0 && lowStockItems.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Stock Status Cards - Horizontal Layout */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Out of Stock Card */}
        {outOfStockItems.length > 0 && (
          <Card className="border-error-soft bg-error-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-error-soft" />
                  <span>Sin Stock</span>
                </div>
                <Badge variant="destructive">
                  {outOfStockItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {outOfStockItems.slice(0, 2).map(item => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="font-medium text-error-soft">0</span>
                  </div>
                ))}
                {outOfStockItems.length > 2 && (
                  <div className="text-xs text-error-soft">
                    +{outOfStockItems.length - 2} más
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Card */}
        {lowStockItems.length > 0 && (
          <Card className="border-warning-soft bg-warning-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-soft" />
                  <span>Stock Bajo</span>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                  {lowStockItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {lowStockItems.slice(0, 2).map(item => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="font-medium text-warning-soft">
                      {item.currentStock}/{item.minimumLevel}
                    </span>
                  </div>
                ))}
                {lowStockItems.length > 2 && (
                  <div className="text-xs text-warning-soft">
                    +{lowStockItems.length - 2} más
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Good Stock Card */}
        <Card className="border-success-soft bg-success-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-soft" />
                <span>Stock Normal</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {goodStockItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-success-soft">
              Productos con stock suficiente
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed alerts for critical items */}
      {outOfStockItems.length > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Atención:</strong> {outOfStockItems.length} productos necesitan reposición inmediata
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}