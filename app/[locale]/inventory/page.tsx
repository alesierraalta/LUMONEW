'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Download, Upload, ShoppingCart, Package, History, Zap } from 'lucide-react'
import { FilterOptions } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { auditedInventoryService, auditedCategoryService } from '@/lib/database-with-audit'
import { analyticsService } from '@/lib/database'
import { PageLoading } from '@/components/ui/page-loading'
import { useModal } from '@/components/ui/modal'

// Dynamic imports for better performance
const InventoryTable = lazy(() => import('@/components/inventory/inventory-table').then(mod => ({ default: mod.InventoryTable })))
const InventoryFilters = lazy(() => import('@/components/inventory/inventory-filters').then(mod => ({ default: mod.InventoryFilters })))
const TransactionBuilder = lazy(() => import('@/components/inventory/transaction-builder').then(mod => ({ default: mod.TransactionBuilder })))
const AuditHistory = lazy(() => import('@/components/inventory/audit-history').then(mod => ({ default: mod.AuditHistory })))
const BulkCreateModal = lazy(() => import('@/components/inventory/bulk-create-modal').then(mod => ({ default: mod.BulkCreateModal })))

function InventoryContent() {
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslations('inventory')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransactionBuilderOpen, setIsTransactionBuilderOpen] = useState(false)
  const [isAuditHistoryOpen, setIsAuditHistoryOpen] = useState(false)
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
      
      // Calculate stock status counts
      const outOfStockItems = inventory.filter((item: any) => item.quantity === 0)
      const lowStockItems = inventory.filter((item: any) => item.quantity > 0 && item.quantity <= item.min_stock)
      const goodStockItems = inventory.filter((item: any) => item.quantity > item.min_stock)
      
      // Get low stock items details for alerts
      const lowStockDetails = lowStockItems
        .slice(0, 5)
        .map((item: any) => ({
          id: item.id,
          nombre: item.name,
          stock: item.quantity,
          stockMinimo: item.min_stock
        }))
      
      // Calculate total value
      const totalValue = inventory.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
      
      // Generate inventory data for cards
      const cardData = {
        totalItems: inventory.length,
        outOfStockCount: outOfStockItems.length,
        lowStockCount: lowStockItems.length,
        goodStockCount: goodStockItems.length,
        lowStockItems: lowStockDetails,
        categories: categories.map((cat: any) => cat.name),
        recentActivity: [
          { id: '1', action: 'Inventario cargado', product: 'Sistema', timestamp: new Date() }
        ],
        criticalAlerts: outOfStockItems.length + lowStockItems.length,
        pendingOrders: 0, // This would come from orders table if implemented
        totalValue
      }
      
      setInventoryData(cardData)
      
    } catch (error) {
      console.error('Error loading inventory data:', error)
      addToast({
        type: 'error',
        title: t('errorLoadingInventory'),
        description: t('errorLoadingInventoryDescription')
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
      <Suspense fallback={<PageLoading message="Cargando modal..." />}>
        <BulkCreateModal
          onSuccess={loadInventoryData}
          onClose={() => {}} // Modal handles its own closing
        />
      </Suspense>,
      { size: 'xl' }
    )
  }, [openModal, loadInventoryData])

  // Generate contextual cards for inventory page
  usePageCards('inventory', inventoryData)

  if (!isClient || isLoading) {
    return <PageLoading message="Cargando inventario..." size="lg" />
  }

  return (
    <div className="space-y-1 xs:space-y-2 sm:space-y-3 animate-fade-in">
      <div className="flex flex-col gap-1 xs:gap-2 sm:gap-3">
        <div className="px-1">
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground text-xs leading-tight">
            Manage inventory items
          </p>
        </div>
        
        {/* Ultra-compact button grid for smallest screens */}
        <div className="grid grid-cols-4 xs:grid-cols-6 sm:flex sm:flex-wrap gap-1 xs:gap-1.5 sm:gap-2 px-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 flex-1 xs:flex-none"
            onClick={() => setIsAuditHistoryOpen(true)}
          >
            <History className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">Audit</span>
            <span className="hidden sm:inline ml-1 text-sm">Auditoría</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 flex-1 xs:flex-none"
            onClick={() => {
              // TODO: Implement import functionality
              addToast({
                title: "Import",
                description: "Import functionality coming soon",
                type: "info"
              })
            }}
          >
            <Upload className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">Imp</span>
            <span className="hidden sm:inline ml-1 text-sm">Import</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 flex-1 xs:flex-none"
            onClick={() => {
              // TODO: Implement export functionality
              addToast({
                title: "Export",
                description: "Export functionality coming soon",
                type: "info"
              })
            }}
          >
            <Download className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">Exp</span>
            <span className="hidden sm:inline ml-1 text-sm">Export</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 flex-1 xs:flex-none"
            onClick={() => {
              setTransactionMode('stock_addition')
              setIsTransactionBuilderOpen(true)
            }}
          >
            <Package className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">+St</span>
            <span className="hidden sm:inline ml-1 text-sm">Stock</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 flex-1 xs:flex-none"
            onClick={() => {
              setTransactionMode('sale')
              setIsTransactionBuilderOpen(true)
            }}
          >
            <ShoppingCart className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">Sale</span>
            <span className="hidden sm:inline ml-1 text-sm">Sale</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 flex-1 xs:flex-none"
            onClick={handleBulkCreate}
          >
            <Zap className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">Bulk</span>
            <span className="hidden sm:inline ml-1 text-sm">Bulk</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700 text-xs p-1 xs:p-1.5 h-8 xs:h-9 sm:h-10 min-w-0 col-span-4 xs:col-span-6 sm:col-span-1 flex-1 xs:flex-none"
            onClick={() => router.push('/inventory/create')}
          >
            <Plus className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden ml-1 text-xs">Add</span>
            <span className="hidden sm:inline ml-1 text-sm">Add Item</span>
          </Button>
        </div>
      </div>

      {/* Information Cards */}
      <CardContainer
        layout="grid"
        columns={1}
        maxCards={2}
        className="mb-1 xs:mb-2 sm:mb-4 grid-cols-1 xs:grid-cols-2 gap-1 xs:gap-2 sm:gap-4"
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
            <Suspense fallback={<PageLoading message="Cargando filtros..." size="sm" />}>
              <InventoryFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </Suspense>
            <Suspense fallback={<PageLoading message="Cargando tabla..." />}>
              <InventoryTable filters={filters} />
            </Suspense>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Builder Modal */}
      {isTransactionBuilderOpen && (
        <Suspense fallback={<PageLoading message="Cargando constructor..." />}>
          <TransactionBuilder
            isOpen={isTransactionBuilderOpen}
            onClose={() => setIsTransactionBuilderOpen(false)}
            onSave={handleTransactionSave}
            initialMode={transactionMode}
          />
        </Suspense>
      )}

      {/* Audit History Modal */}
      {isAuditHistoryOpen && (
        <Suspense fallback={<PageLoading message="Cargando historial..." />}>
          <AuditHistory
            open={isAuditHistoryOpen}
            onOpenChange={setIsAuditHistoryOpen}
          />
        </Suspense>
      )}
    </div>
  )
}

export default function InventoryPage() {
  const { user } = useAuth()
  
  return (
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
  )
}