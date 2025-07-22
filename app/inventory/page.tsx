'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { TransactionBuilder } from '@/components/inventory/transaction-builder'
import { TransactionHistory } from '@/components/inventory/transaction-history'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Download, Upload, ShoppingCart, Package, History, Zap } from 'lucide-react'
import { FilterOptions } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { auditedInventoryService, auditedCategoryService } from '@/lib/database-with-audit'
import { analyticsService } from '@/lib/database'
import { LoadingSpinner } from '@/components/ui/loading'
import { BulkCreateModal } from '@/components/inventory/bulk-create-modal'
import { useModal } from '@/components/ui/modal'

function InventoryContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransactionBuilderOpen, setIsTransactionBuilderOpen] = useState(false)
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false)
  const [transactionMode, setTransactionMode] = useState<'sale' | 'stock_addition'>('sale')
  const [transactions, setTransactions] = useState<any[]>([])
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const { addToast } = useToast()
  const { openModal } = useModal()
  
  const loadInventoryData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load inventory items
      const inventory = await auditedInventoryService.getAll()
      
      // Load categories for context
      const categories = await auditedCategoryService.getAll()
      
      // Get analytics data
      const analytics = await analyticsService.getDashboardMetrics()
      
      // Calculate low stock items
      const lowStockItems = inventory
        .filter(item => item.quantity <= item.min_stock)
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          nombre: item.name,
          stock: item.quantity,
          stockMinimo: item.min_stock
        }))
      
      // Calculate total value
      const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      
      // Generate inventory data for cards
      const cardData = {
        totalItems: inventory.length,
        lowStockItems,
        categories: categories.map(cat => cat.name),
        recentActivity: [
          { id: '1', action: 'Inventario cargado', product: 'Sistema', timestamp: new Date() }
        ],
        criticalAlerts: lowStockItems.length,
        pendingOrders: 0, // This would come from orders table if implemented
        totalValue
      }
      
      setInventoryData(cardData)
      
    } catch (error) {
      console.error('Error loading inventory data:', error)
      addToast({
        type: 'error',
        title: 'Error al cargar inventario',
        description: 'No se pudieron cargar los datos del inventario desde la base de datos'
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  const loadTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true)
      const response = await fetch('/api/transactions?limit=100')
      const result = await response.json()
      
      if (result.success) {
        setTransactions(result.data || [])
      } else {
        console.error('Error loading transactions:', result.error)
        addToast({
          type: 'error',
          title: 'Error al cargar historial',
          description: 'No se pudieron cargar las transacciones'
        })
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      addToast({
        type: 'error',
        title: 'Error al cargar historial',
        description: 'Error de conexión al cargar las transacciones'
      })
    } finally {
      setLoadingTransactions(false)
    }
  }, [addToast])

  const handleMount = useCallback(() => {
    setIsClient(true)
    loadInventoryData()
    loadTransactions()
  }, [loadInventoryData, loadTransactions])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Handle transaction save
  const handleTransactionSave = useCallback(async (transaction: any) => {
    try {
      // Save transaction to database via API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: transaction.type,
          subtotal: transaction.subtotal,
          tax: transaction.tax,
          taxRate: transaction.taxRate,
          total: transaction.total,
          notes: transaction.notes,
          createdBy: user?.email || 'guest',
          lineItems: transaction.lineItems.map((item: any) => ({
            productId: item.product.id,
            productSku: item.product.sku,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
          }))
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Add the saved transaction to local state
        setTransactions(prev => [result.data, ...prev])
        
        // Show success message
        addToast({
          type: 'success',
          title: 'Transacción guardada',
          description: `${transaction.type === 'sale' ? 'Venta' : 'Adición de stock'} guardada exitosamente`
        })
        
        // Reload inventory data to reflect stock changes
        loadInventoryData()
        
        // Reload transactions to get the latest data
        loadTransactions()
      } else {
        throw new Error(result.error || 'Error al guardar la transacción')
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      addToast({
        type: 'error',
        title: 'Error al guardar',
        description: error instanceof Error ? error.message : 'No se pudo guardar la transacción'
      })
    }
  }, [user, addToast, loadInventoryData, loadTransactions])

  // Handle bulk create modal
  const handleBulkCreate = useCallback(() => {
    openModal(
      <BulkCreateModal
        onSuccess={loadInventoryData}
        onClose={() => {}} // Modal handles its own closing
      />,
      { size: 'xl' }
    )
  }, [openModal, loadInventoryData])

  // Generate contextual cards for inventory page
  usePageCards('inventory', inventoryData)

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your inventory items, stock levels, and product information.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="hover:scale-105 transition-transform"
            onClick={() => setIsTransactionHistoryOpen(true)}
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            className="hover:scale-105 transition-transform bg-green-600 hover:bg-green-700"
            onClick={() => {
              setTransactionMode('stock_addition')
              setIsTransactionBuilderOpen(true)
            }}
          >
            <Package className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
          <Button
            size="sm"
            className="hover:scale-105 transition-transform"
            onClick={() => {
              setTransactionMode('sale')
              setIsTransactionBuilderOpen(true)
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hover:scale-105 transition-transform bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            onClick={handleBulkCreate}
          >
            <Zap className="mr-2 h-4 w-4" />
            Creación Rápida
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hover:scale-105 transition-transform"
            onClick={() => router.push('/inventory/create')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Information Cards */}
      <CardContainer
        layout="grid"
        columns={3}
        maxCards={6}
        className="mb-6"
      />

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            A list of all inventory items with their current stock levels and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <InventoryFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
            <InventoryTable filters={filters} />
          </div>
        </CardContent>
      </Card>

      {/* Transaction Builder Modal */}
      <TransactionBuilder
        isOpen={isTransactionBuilderOpen}
        onClose={() => setIsTransactionBuilderOpen(false)}
        onSave={handleTransactionSave}
        initialMode={transactionMode}
      />

      {/* Transaction History Modal */}
      <TransactionHistory
        isOpen={isTransactionHistoryOpen}
        onClose={() => setIsTransactionHistoryOpen(false)}
        transactions={transactions}
        onResetHistory={loadTransactions}
      />
    </div>
  )
}

export default function InventoryPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CardProvider
                currentPage="inventory"
                currentUser={user ? {
                  id: user.id,
                  name: user.user_metadata?.full_name || user.email || 'Usuario',
                  email: user.email || '',
                  role: 'admin' as const,
                  avatar: user.user_metadata?.avatar_url,
                  isActive: true,
                  lastLogin: new Date(),
                  permissions: {
                    canCreate: true,
                    canEdit: true,
                    canDelete: true,
                    canViewReports: true,
                    canManageUsers: true,
                    canBulkOperations: true,
                    canQuickStock: true,
                    canViewAuditLogs: true
                  },
                  accessibleLocations: ['1', '2', '3'],
                  defaultLocation: '1',
                  preferences: {
                    language: 'es' as const,
                    theme: 'light' as const,
                    dateFormat: 'DD/MM/YYYY',
                    currency: 'USD',
                    notifications: {
                      email: true,
                      push: true,
                      lowStock: true,
                      bulkOperations: true
                    }
                  },
                  createdAt: new Date(user.created_at),
                  updatedAt: new Date(),
                  createdBy: 'system',
                  updatedBy: 'system'
                } : {
                  id: 'guest',
                  name: 'Guest User',
                  email: 'guest@example.com',
                  role: 'admin' as const,
                  avatar: undefined,
                  isActive: true,
                  lastLogin: new Date(),
                  permissions: {
                    canCreate: true,
                    canEdit: true,
                    canDelete: true,
                    canViewReports: true,
                    canManageUsers: true,
                    canBulkOperations: true,
                    canQuickStock: true,
                    canViewAuditLogs: true
                  },
                  accessibleLocations: ['1', '2', '3'],
                  defaultLocation: '1',
                  preferences: {
                    language: 'es' as const,
                    theme: 'light' as const,
                    dateFormat: 'DD/MM/YYYY',
                    currency: 'USD',
                    notifications: {
                      email: true,
                      push: true,
                      lowStock: true,
                      bulkOperations: true
                    }
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  createdBy: 'system',
                  updatedBy: 'system'
                }}
              >
                <InventoryContent />
              </CardProvider>
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}