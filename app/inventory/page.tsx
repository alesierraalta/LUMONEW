'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { TransactionBuilder } from '@/components/inventory/transaction-builder'
import { TransactionHistory } from '@/components/inventory/transaction-history'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Download, Upload, ShoppingCart, Package, History } from 'lucide-react'
import { FilterOptions } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'

// Mock user data - moved outside component to prevent recreation
const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
  avatar: undefined,
  isActive: true,
  lastLogin: new Date('2024-01-01'),
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'system',
  updatedBy: 'system'
}

// Mock inventory data for cards - moved outside component to prevent recreation
const mockInventoryData = {
  totalItems: 1247,
  lowStockItems: [
    { id: '1', nombre: 'iPhone 14 Pro', stock: 3, stockMinimo: 10 },
    { id: '2', nombre: 'MacBook Air M2', stock: 1, stockMinimo: 5 },
    { id: '3', nombre: 'AirPods Pro', stock: 2, stockMinimo: 15 }
  ],
  categories: ['Electrónicos', 'Accesorios', 'Computadoras'],
  recentActivity: [
    { id: '1', action: 'Stock actualizado', product: 'iPhone 14 Pro', timestamp: new Date('2024-01-01') },
    { id: '2', action: 'Nuevo producto agregado', product: 'Samsung Galaxy S24', timestamp: new Date('2024-01-01') }
  ],
  criticalAlerts: 5,
  pendingOrders: 12,
  totalValue: 2450000
}

function InventoryContent() {
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isClient, setIsClient] = useState(false)
  const [isTransactionBuilderOpen, setIsTransactionBuilderOpen] = useState(false)
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false)
  const [transactionMode, setTransactionMode] = useState<'sale' | 'stock_addition'>('sale')
  const [transactions, setTransactions] = useState<any[]>([])
  
  const handleMount = useCallback(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Handle transaction save
  const handleTransactionSave = useCallback((transaction: any) => {
    setTransactions(prev => [transaction, ...prev])
    console.log('Transaction saved:', transaction)
    // In a real app, this would save to the backend
  }, [])

  // Generate contextual cards for inventory page
  usePageCards('inventory', mockInventoryData)

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <Button size="sm" variant="outline" className="hover:scale-105 transition-transform">
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
      />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CardProvider
                currentPage="inventory"
                currentUser={mockUser}
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