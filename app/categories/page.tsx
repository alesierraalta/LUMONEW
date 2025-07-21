'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoriesFilters } from '@/components/categories/categories-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Package, Download, Upload } from 'lucide-react'
import { Category } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { categoryService, inventoryService } from '@/lib/database'
import { LoadingSpinner } from '@/components/ui/loading'

// Helper function to map database category to Category type
const mapDatabaseToCategory = (dbCategory: any): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
  description: dbCategory.description || '',
  color: dbCategory.color || '#3B82F6',
  icon: 'package',
  parentId: dbCategory.parent_id,
  level: 0,
  path: [],
  itemCount: 0, // Will be calculated from inventory
  totalValue: 0, // Will be calculated from inventory
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(dbCategory.created_at),
  updatedAt: new Date(dbCategory.updated_at),
  createdBy: 'admin',
  updatedBy: 'admin',
  syncStatus: 'synced',
  lastSyncAt: new Date()
})

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'itemCount' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categoriesData, setCategoriesData] = useState<any>(null)
  const { addToast } = useToast()

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load categories from database
      const dbCategories = await categoryService.getAll()
      const mappedCategories = dbCategories.map(mapDatabaseToCategory)
      
      // Load inventory to calculate item counts and values per category
      const inventory = await inventoryService.getAll()
      
      // Calculate item counts and values for each category
      const categoriesWithCounts = mappedCategories.map(category => {
        const categoryItems = inventory.filter(item => item.category_id === category.id)
        const itemCount = categoryItems.length
        const totalValue = categoryItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
        
        return {
          ...category,
          itemCount,
          totalValue
        }
      })
      
      setCategories(categoriesWithCounts)
      
      // Generate categories data for cards
      const totalCategories = categoriesWithCounts.length
      const totalItems = categoriesWithCounts.reduce((sum, category) => sum + category.itemCount, 0)
      const totalValue = categoriesWithCounts.reduce((sum, category) => sum + category.totalValue, 0)
      const averageItemsPerCategory = totalCategories > 0 ? Math.round(totalItems / totalCategories) : 0
      
      const cardData = {
        totalCategories,
        totalItems,
        totalValue,
        averageItemsPerCategory,
        topCategories: categoriesWithCounts
          .sort((a, b) => b.itemCount - a.itemCount)
          .slice(0, 3)
          .map(cat => ({ id: cat.id, name: cat.name, itemCount: cat.itemCount, value: cat.totalValue })),
        recentActivity: [
          { id: '1', action: 'Categorías cargadas', category: 'Sistema', timestamp: new Date() }
        ],
        categoryDistribution: categoriesWithCounts.map(cat => ({
          name: cat.name,
          value: cat.itemCount,
          color: cat.color
        }))
      }
      
      setCategoriesData(cardData)
      
    } catch (error) {
      console.error('Error loading categories:', error)
      addToast({
        type: 'error',
        title: 'Error al cargar categorías',
        description: 'No se pudieron cargar las categorías desde la base de datos'
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  const handleMount = useCallback(() => {
    setIsClient(true)
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Generate contextual cards for categories page
  usePageCards('categories', categoriesData)

  const filteredCategories = categories
    .filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const totalItems = categories.reduce((sum, category) => sum + category.itemCount, 0)

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage your inventory categories and organization structure.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="hover:scale-105 transition-transform">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
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

      {/* Filters */}
      <CategoriesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Categories Table */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            A list of all categories in your inventory system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable categories={filteredCategories} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function CategoriesPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CardProvider
                currentPage="categories"
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
                } : undefined}
              >
                <CategoriesContent />
              </CardProvider>
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}