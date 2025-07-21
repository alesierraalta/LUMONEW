'use client'

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
      {/* Out of Stock Warning */}
      {outOfStockItems.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Productos Agotados:</strong> {outOfStockItems.length} productos sin stock
              </div>
              <Badge variant="destructive" className="ml-2">
                {outOfStockItems.length}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              {outOfStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-medium">Stock: {item.currentStock}</span>
                </div>
              ))}
              {outOfStockItems.length > 3 && (
                <div className="text-xs text-red-600 mt-1">
                  +{outOfStockItems.length - 3} productos más
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Stock Bajo:</strong> {lowStockItems.length} productos con poco stock
              </div>
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                {lowStockItems.length}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    Stock: {item.currentStock} / Min: {item.minimumLevel}
                  </span>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <div className="text-xs text-yellow-600 mt-1">
                  +{lowStockItems.length - 3} productos más
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Summary */}
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Buen Stock: {goodStockItems.length}</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span>Stock Bajo: {lowStockItems.length}</span>
        </div>
        <div className="flex items-center space-x-1">
          <XCircle className="h-4 w-4 text-red-600" />
          <span>Agotado: {outOfStockItems.length}</span>
        </div>
      </div>
    </div>
  )
}