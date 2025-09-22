'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Download, Upload, ShoppingCart, Package, History, Zap, HelpCircle } from 'lucide-react'
import { FilterOptions } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth/auth-context'
// Removed direct database imports - now using API endpoints
import { analyticsService } from '@/lib/database'
import { PageLoading } from '@/components/ui/page-loading'
import { useModal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'

// Dynamic imports for better performance
const InventoryTable = lazy(() => import('@/components/inventory/inventory-table').then(mod => ({ default: mod.InventoryTable })))
const InventoryFilters = lazy(() => import('@/components/inventory/inventory-filters').then(mod => ({ default: mod.InventoryFilters })))
const TransactionBuilder = lazy(() => import('@/components/inventory/transaction-builder').then(mod => ({ default: mod.TransactionBuilder })))
const AuditHistory = lazy(() => import('@/components/inventory/audit-history').then(mod => ({ default: mod.AuditHistory })))
const BulkCreateModal = lazy(() => import('@/components/inventory/bulk-create-modal').then(mod => ({ default: mod.BulkCreateModal })))
const CSVImportModal = lazy(() => import('@/components/inventory/csv-import/csv-import-modal').then(mod => ({ default: mod.CSVImportModal })))
const InventoryTutorial = lazy(() => import('@/components/inventory/inventory-tutorial').then(mod => ({ default: mod.InventoryTutorial })))

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
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [inventoryTableRefreshTrigger, setInventoryTableRefreshTrigger] = useState(0)
  const { addToast } = useToast()
  const { openModal } = useModal()
  
  const loadInventoryData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load inventory items with cache busting
      const inventoryResponse = await fetch(`/api/inventory/items?limit=999999&_t=${Date.now()}`)
      if (!inventoryResponse.ok) {
        throw new Error('Failed to fetch inventory items')
      }
      const inventoryResponseData = await inventoryResponse.json()
      
      // Handle both old format (array) and new format (pagination object)
      let inventory
      if (Array.isArray(inventoryResponseData)) {
        inventory = inventoryResponseData
      } else if (inventoryResponseData && inventoryResponseData.data && Array.isArray(inventoryResponseData.data)) {
        // New pagination format
        inventory = inventoryResponseData.data
      } else {
        inventory = []
      }
      
      // Load categories for context
      const categoriesResponse = await fetch('/api/categories/items')
      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories')
      }
      const categories = await categoriesResponse.json()
      
      // Get analytics data (direct DB call, no cache needed)
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
      
      // Get recent activity from audit logs
      let recentActivity = []
      try {
        const auditResponse = await fetch('/api/audit/recent?limit=5')
        if (auditResponse.ok) {
          const auditResult = await auditResponse.json()
          if (auditResult.success && auditResult.data) {
            recentActivity = auditResult.data.map((log: any) => ({
              id: log.id,
              action: log.operation === 'INSERT' ? 'Creado' : log.operation === 'UPDATE' ? 'Actualizado' : 'Eliminado',
              product: log.new_values?.name || log.old_values?.name || `ID: ${log.record_id}`,
              timestamp: new Date(log.created_at)
            }))
          }
        }
      } catch (error) {
        console.error('Error loading recent activity:', error)
        // Fallback to empty array
        recentActivity = []
      }
      
      // Generate inventory data for cards
      const cardData = {
        totalItems: inventory.length,
        outOfStockCount: outOfStockItems.length,
        lowStockCount: lowStockItems.length,
        goodStockCount: goodStockItems.length,
        lowStockItems: lowStockDetails,
        categories: categories.map((cat: any) => cat.name),
        recentActivity,
        criticalAlerts: outOfStockItems.length + lowStockItems.length,
        pendingOrders: 0, // This would come from orders table if implemented
        totalValue
      }
      
      setInventoryData(cardData)
      
      // Trigger inventory table refresh
      setInventoryTableRefreshTrigger(prev => prev + 1)
      
      // Notify dashboard of inventory changes
      window.dispatchEvent(new CustomEvent('inventoryUpdated'))
      
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
        
        // Trigger inventory table refresh
        setInventoryTableRefreshTrigger(prev => prev + 1)
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
          onSuccess={async () => {
            // Force a complete refresh of inventory data and status
            await loadInventoryData()
            setInventoryTableRefreshTrigger(prev => prev + 1)
            
            // Force a small delay to ensure all updates are processed
            setTimeout(() => {
              loadInventoryData()
            }, 1000)
          }}
          onClose={() => {}} // Modal handles its own closing
        />
      </Suspense>,
      { size: 'xl', closable: false }
    )
  }, [openModal, loadInventoryData])

  // Generate contextual cards for inventory page
  usePageCards('inventory', inventoryData)

  if (!isClient || isLoading) {
    return <PageLoading message="Cargando inventario..." size="lg" />
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsTutorialOpen(true)} aria-label="Abrir tutorial de inventario">
            <HelpCircle className="w-4 h-4 mr-2" />
            Tutorial
          </Button>
        </div>
      </div>
        
      {/* Inventory Tools - Elegant & Minimalist Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">Herramientas Rápidas</h3>
              <p className="text-sm text-muted-foreground mt-1">Acciones principales para gestión de inventario</p>
            </div>
          </div>
          
          {/* Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="inv-actions">
            <button
              id="inv-action-create"
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onClick={() => router.push('/inventory/create')}
              title="Crear un nuevo producto en el inventario"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-foreground">Nuevo Producto</p>
                  <p className="text-xs text-muted-foreground mt-1">Crear artículo</p>
                </div>
              </div>
            </button>
            
            <button
              id="inv-action-add-stock"
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 hover:border-green-200 dark:hover:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              onClick={() => {
                setTransactionMode('stock_addition')
                setIsTransactionBuilderOpen(true)
              }}
              title="Agregar stock a productos existentes"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-foreground">Agregar Stock</p>
                  <p className="text-xs text-muted-foreground mt-1">Aumentar inventario</p>
                </div>
              </div>
            </button>
            
            <button
              id="inv-action-sale"
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-200 dark:hover:border-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              onClick={() => {
                setTransactionMode('sale')
                setIsTransactionBuilderOpen(true)
              }}
              title="Registrar una nueva venta"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                  <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-foreground">Nueva Venta</p>
                  <p className="text-xs text-muted-foreground mt-1">Registrar transacción</p>
                </div>
              </div>
            </button>
            
            <button
              id="inv-action-bulk"
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-200 dark:hover:border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              onClick={handleBulkCreate}
              title="Crear múltiples productos de una vez"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/50 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                  <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-foreground">Crear Múltiples</p>
                  <p className="text-xs text-muted-foreground mt-1">Carga masiva</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6" id="inv-quick-stats">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Estado del Inventario</h3>
                <p className="text-sm text-muted-foreground">Resumen en tiempo real</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2" id="inv-stat-total">
                <span className="text-sm text-muted-foreground">Total de productos</span>
                <span className="font-semibold text-foreground">{inventoryData?.totalItems || 0}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2" id="inv-stat-out">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-muted-foreground">Sin stock</span>
                  </div>
                  <span className="font-medium text-red-600 dark:text-red-400">{inventoryData?.outOfStockCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between py-2" id="inv-stat-low">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-muted-foreground">Stock bajo</span>
                  </div>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{inventoryData?.lowStockCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between py-2" id="inv-stat-good">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">Stock óptimo</span>
                  </div>
                  <span className="font-medium text-green-600 dark:text-green-400">{inventoryData?.goodStockCount || 0}</span>
                </div>
              </div>
              
              {(inventoryData?.outOfStockCount || 0) + (inventoryData?.lowStockCount || 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-medium">Requiere atención</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Tools - Refined Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Herramientas Avanzadas</h3>
            <p className="text-sm text-muted-foreground mt-1">Gestión de datos y análisis detallado</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            id="inv-audit-history"
            className="group flex items-center space-x-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            onClick={() => router.push('/audit')}
            title="Ver historial completo de cambios y movimientos del inventario"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">Historial</p>
              <p className="text-xs text-muted-foreground truncate">Seguimiento de cambios</p>
            </div>
          </button>
          
          <button
            className="group flex items-center space-x-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-green-500/5 hover:border-green-200 dark:hover:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            onClick={() => setIsCSVImportOpen(true)}
            title="Importar productos desde archivo CSV"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
              <Upload className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">Importar Datos</p>
              <p className="text-xs text-muted-foreground truncate">CSV</p>
            </div>
          </button>
          
          <button
            className="group flex items-center space-x-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-purple-500/5 hover:border-purple-200 dark:hover:border-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            onClick={() => {
              addToast({
                title: t('export'),
                description: t('exportComingSoon'),
                type: "info"
              })
            }}
            title="Exportar inventario completo a archivo CSV o Excel"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
              <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">Exportar Datos</p>
              <p className="text-xs text-muted-foreground truncate">Descargar inventario</p>
            </div>
          </button>
          
          <button
            className="group flex items-center space-x-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            onClick={() => {
              addToast({
                title: "Reportes Avanzados",
                description: "Funcionalidad en desarrollo",
                type: "info"
              })
            }}
            title="Generar reportes detallados de inventario y movimientos"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">Reportes Avanzados</p>
              <p className="text-xs text-muted-foreground truncate">Análisis detallado</p>
            </div>
          </button>
        </div>
      </div>



      {/* Main Inventory Table - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">{t('inventoryItems.title')}</CardTitle>
          <CardDescription className="text-sm">
            {t('inventoryItems.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" id="inv-filters-table">
            <Suspense fallback={<PageLoading message={t('loading.filters')} size="sm" />}>
              <div id="inv-filters">
                <InventoryFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </Suspense>
            <Suspense fallback={<PageLoading message={t('loading.table')} />}>
              <div id="inv-table">
                <InventoryTable filters={filters} refreshTrigger={inventoryTableRefreshTrigger} />
              </div>
            </Suspense>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Builder Modal */}
      {isTransactionBuilderOpen && (
        <Suspense fallback={<PageLoading message={t('loading.transactionBuilder')} />}>
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
        <Suspense fallback={<PageLoading message={t('loading.auditHistory')} />}>
          <AuditHistory
            open={isAuditHistoryOpen}
            onOpenChange={setIsAuditHistoryOpen}
          />
        </Suspense>
      )}

      {/* Inventory Tutorial Overlay */}
      {isTutorialOpen && (
        <Suspense fallback={null}>
          <InventoryTutorial
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
            steps={[
              { id: 'action-create', target: '#inv-action-create', title: 'Nuevo producto', description: 'Crea un artículo de inventario desde cero (nombre, SKU, categoría, ubicación, stock y precio).', placement: 'bottom' },
              { id: 'action-add-stock', target: '#inv-action-add-stock', title: 'Agregar stock', description: 'Suma cantidades a productos existentes registrando una “Adición de stock”.', placement: 'bottom' },
              { id: 'action-sale', target: '#inv-action-sale', title: 'Registrar venta', description: 'Genera una transacción de venta que descuenta stock automáticamente.', placement: 'bottom' },
              { id: 'action-bulk', target: '#inv-action-bulk', title: 'Creación múltiple', description: 'Carga rápida de varios productos a la vez para acelerar la configuración inicial.', placement: 'bottom' },
              { id: 'stat-total', target: '#inv-stat-total', title: 'Total de productos', description: 'Conteo total de ítems activos en tu inventario.', placement: 'right' },
              { id: 'stat-out', target: '#inv-stat-out', title: 'Sin stock', description: 'Artículos con stock en 0; revisa y repón para evitar quiebres.', placement: 'right' },
              { id: 'stat-low', target: '#inv-stat-low', title: 'Stock bajo', description: 'Artículos con cantidad en o por debajo del mínimo definido.', placement: 'right' },
              { id: 'stat-good', target: '#inv-stat-good', title: 'Stock óptimo', description: 'Artículos con nivel saludable por encima del mínimo.', placement: 'right' },
              { id: 'audit-history', target: '#inv-audit-history', title: 'Historial de auditoría', description: 'Consulta cambios en inventario (quién, qué y cuándo) con detalle.', placement: 'bottom' },
              { id: 'filters', target: '#inv-filters', title: 'Filtros', description: 'Refina por nombre/SKU/categorías y más para encontrar artículos rápido.', placement: 'bottom' },
              { id: 'table', target: '#inv-table', title: 'Tabla de inventario', description: 'Visualiza y gestiona tus productos; edita o abre acciones desde cada fila.', placement: 'top' }
            ]}
          />
        </Suspense>
      )}

      {/* CSV Import Modal */}
      {isCSVImportOpen && (
        <Suspense fallback={<PageLoading message="Cargando importador CSV..." />}>
          <CSVImportModal
            isOpen={isCSVImportOpen}
            onClose={() => setIsCSVImportOpen(false)}
            onSuccess={loadInventoryData}
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