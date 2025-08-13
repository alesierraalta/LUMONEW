'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Package, Download, Upload, HelpCircle } from 'lucide-react'
import { Category } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { categoryService, inventoryService } from '@/lib/database'
import { PageLoading } from '@/components/ui/page-loading'
import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
import { useModal } from '@/components/ui/modal'
import { CreateCategoryModal } from '@/components/categories/create-category-modal'

// Dynamic imports for better performance
const CategoriesTable = lazy(() => import('@/components/categories/categories-table').then(mod => ({ default: mod.CategoriesTable })))
const CategoriesFilters = lazy(() => import('@/components/categories/categories-filters').then(mod => ({ default: mod.CategoriesFilters })))
const InventoryTutorial = lazy(() => import('@/components/inventory/inventory-tutorial').then(mod => ({ default: mod.InventoryTutorial })))

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
  const t = useTranslations('categories')
  const tCommon = useTranslations('common')
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'itemCount' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categoriesData, setCategoriesData] = useState<any>(null)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const { addToast } = useToast()
  const { openModal } = useModal()

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load categories from database
      const dbCategories = await categoryService.getAll()
      const mappedCategories = dbCategories.map(mapDatabaseToCategory)
      
      // Load inventory to calculate item counts and values per category
      const inventory = await inventoryService.getAll()
      
      // Calculate item counts and values for each category
      const categoriesWithCounts = mappedCategories.map((category: Category) => {
        const categoryItems = inventory.filter((item: any) => item.category_id === category.id)
        const itemCount = categoryItems.length
        const totalValue = categoryItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
        
        return {
          ...category,
          itemCount,
          totalValue
        }
      })
      
      setCategories(categoriesWithCounts)
      
      // Generate categories data for cards
      const totalCategories = categoriesWithCounts.length
      const totalItems = categoriesWithCounts.reduce((sum: number, category: any) => sum + category.itemCount, 0)
      const totalValue = categoriesWithCounts.reduce((sum: number, category: any) => sum + category.totalValue, 0)
      const averageItemsPerCategory = totalCategories > 0 ? Math.round(totalItems / totalCategories) : 0
      
      const cardData = {
        totalCategories,
        totalItems,
        totalValue,
        averageItemsPerCategory,
        topCategories: categoriesWithCounts
          .sort((a: any, b: any) => b.itemCount - a.itemCount)
          .slice(0, 3)
          .map((cat: any) => ({ id: cat.id, name: cat.name, itemCount: cat.itemCount, value: cat.totalValue })),
        recentActivity: [
          { id: '1', action: t('systemLoaded'), category: tCommon('system'), timestamp: new Date() }
        ],
        categoryDistribution: categoriesWithCounts.map((cat: any) => ({
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
        title: t('loadError'),
        description: t('loadErrorDescription')
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast, t, tCommon])

  const handleCreateCategory = useCallback(() => {
    openModal(
      <CreateCategoryModal onSuccess={loadCategories} />,
      { size: 'md' }
    )
  }, [openModal, loadCategories])

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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
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
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-wrap gap-2" id="cat-actions">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs md:text-sm hover:scale-105 transition-transform"
            id="cat-import"
          >
            <Upload className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{tCommon('import')}</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs md:text-sm hover:scale-105 transition-transform"
            id="cat-export"
          >
            <Download className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{tCommon('export')}</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            size="sm"
            className="text-xs md:text-sm hover:scale-105 transition-transform"
            onClick={handleCreateCategory}
            id="cat-add"
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('addCategory')}</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTutorialOpen(true)} aria-label="Abrir tutorial de categorías">
            <HelpCircle className="h-4 w-4 mr-1 md:mr-2" />
            Tutorial
          </Button>
        </div>
      </div>

      {/* Information Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Resumen principal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen de Categorías</CardTitle>
            <CardDescription>Total y asociados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length} categorías</div>
            <div className="text-sm text-muted-foreground">
              {categories.reduce((sum, c) => sum + c.itemCount, 0)} items totales
            </div>
          </CardContent>
        </Card>

        {/* Promedio por categoría */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Promedio por Categoría</CardTitle>
            <CardDescription>Items / categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.length > 0 ? Math.round(
                categories.reduce((sum, c) => sum + c.itemCount, 0) / categories.length
              ) : 0}
            </div>
            <div className="text-sm text-muted-foreground">promedio</div>
          </CardContent>
        </Card>

        {/* Categorías vacías */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Categorías Vacías</CardTitle>
            <CardDescription>Sin items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(c => c.itemCount === 0).length}
            </div>
            <div className="text-sm text-muted-foreground">disponibles</div>
          </CardContent>
        </Card>

        {/* Categoría con más items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Categoría con más items</CardTitle>
            <CardDescription>Top 1</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              (() => {
                const top = [...categories].sort((a, b) => b.itemCount - a.itemCount)[0]
                return (
                  <div>
                    <div className="text-lg font-semibold">{top.name}</div>
                    <div className="text-sm text-muted-foreground">{top.itemCount} items</div>
                  </div>
                )
              })()
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>

        {/* Valor total de inventario */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Valor Total</CardTitle>
            <CardDescription>Suma de quantity × unit_price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                categories.reduce((sum, c) => sum + c.totalValue, 0)
              )}
            </div>
            <div className="text-sm text-muted-foreground">inventario</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Mobile Responsive */}
      <Suspense fallback={<PageLoading message={t('loadingFilters')} size="sm" />}>
        <div id="cat-filters">
          <CategoriesFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </Suspense>

      {/* Categories Table - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">{t('categoriesTable')}</CardTitle>
          <CardDescription className="text-sm">
            {t('tableDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PageLoading message={t('loadingTable')} />}>
            <div id="cat-table">
              <CategoriesTable />
            </div>
          </Suspense>
        </CardContent>
      </Card>

      {isTutorialOpen && (
        <Suspense fallback={null}>
          <InventoryTutorial
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
            steps={[
              { id: 'add', target: '#cat-add', title: 'Nueva categoría', description: 'Crea una categoría definiendo nombre, color y descripción.', placement: 'bottom' },
              { id: 'import', target: '#cat-import', title: 'Importar categorías', description: 'Carga categorías desde un archivo para acelerar la configuración.', placement: 'bottom' },
              { id: 'export', target: '#cat-export', title: 'Exportar categorías', description: 'Descarga tus categorías para respaldo o análisis externo.', placement: 'bottom' },
              { id: 'table', target: '#cat-table', title: 'Tabla de categorías', description: 'Administra y consulta las categorías y la cantidad de productos asociados.', placement: 'top' }
            ]}
          />
        </Suspense>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
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
          } : {
            id: 'guest',
            name: 'Guest User',
            email: 'guest@example.com',
            role: 'viewer' as const,
            avatar: undefined,
            isActive: true,
            lastLogin: new Date(),
            permissions: {
              canCreate: false,
              canEdit: false,
              canDelete: false,
              canViewReports: false,
              canManageUsers: false,
              canBulkOperations: false,
              canQuickStock: false,
              canViewAuditLogs: false
            },
            accessibleLocations: [],
            defaultLocation: undefined,
            preferences: {
              language: 'es' as const,
              theme: 'light' as const,
              dateFormat: 'DD/MM/YYYY',
              currency: 'USD',
              notifications: {
                email: false,
                push: false,
                lowStock: false,
                bulkOperations: false
              }
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            updatedBy: 'system'
          }}
        >
          <CategoriesContent />
        </CardProvider>
      </ModalProvider>
    </ToastProvider>
  )
}