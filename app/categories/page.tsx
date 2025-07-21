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

// Mock user data
const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
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
}

// Mock data for categories
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and components',
    color: '#3B82F6',
    icon: 'laptop',
    parentId: undefined,
    level: 0,
    path: [],
    itemCount: 45,
    totalValue: 125000,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin',
    syncStatus: 'synced',
    lastSyncAt: new Date('2024-01-20')
  },
  {
    id: '2',
    name: 'Furniture',
    description: 'Office and home furniture',
    color: '#10B981',
    icon: 'chair',
    parentId: undefined,
    level: 0,
    path: [],
    itemCount: 23,
    totalValue: 89000,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'admin',
    updatedBy: 'manager1',
    syncStatus: 'synced',
    lastSyncAt: new Date('2024-01-18')
  },
  {
    id: '3',
    name: 'Stationery',
    description: 'Office supplies and stationery items',
    color: '#F59E0B',
    icon: 'pen',
    parentId: undefined,
    level: 0,
    path: [],
    itemCount: 67,
    totalValue: 15000,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-22'),
    createdBy: 'admin',
    updatedBy: 'employee1',
    syncStatus: 'synced',
    lastSyncAt: new Date('2024-01-22')
  },
  {
    id: '4',
    name: 'Tools',
    description: 'Hardware tools and equipment',
    color: '#EF4444',
    icon: 'wrench',
    parentId: undefined,
    level: 0,
    path: [],
    itemCount: 34,
    totalValue: 45000,
    isActive: true,
    sortOrder: 4,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
    createdBy: 'admin',
    updatedBy: 'manager2',
    syncStatus: 'synced',
    lastSyncAt: new Date('2024-01-19')
  },
  {
    id: '5',
    name: 'Books',
    description: 'Books and educational materials',
    color: '#8B5CF6',
    icon: 'book',
    parentId: undefined,
    level: 0,
    path: [],
    itemCount: 89,
    totalValue: 25000,
    isActive: true,
    sortOrder: 5,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-21'),
    createdBy: 'admin',
    updatedBy: 'employee2',
    syncStatus: 'synced',
    lastSyncAt: new Date('2024-01-21')
  }
]

// Mock categories data for cards
const mockCategoriesData = {
  totalCategories: mockCategories.length,
  totalItems: mockCategories.reduce((sum, category) => sum + category.itemCount, 0),
  totalValue: mockCategories.reduce((sum, category) => sum + category.totalValue, 0),
  averageItemsPerCategory: Math.round(mockCategories.reduce((sum, category) => sum + category.itemCount, 0) / mockCategories.length),
  topCategories: mockCategories
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 3)
    .map(cat => ({ id: cat.id, name: cat.name, itemCount: cat.itemCount, value: cat.totalValue })),
  recentActivity: [
    { id: '1', action: 'Categoría actualizada', category: 'Electronics', timestamp: new Date() },
    { id: '2', action: 'Nueva categoría creada', category: 'Accessories', timestamp: new Date() }
  ],
  categoryDistribution: mockCategories.map(cat => ({
    name: cat.name,
    value: cat.itemCount,
    color: cat.color
  }))
}

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'itemCount' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isClient, setIsClient] = useState(false)

  const handleMount = useCallback(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Generate contextual cards for categories page
  usePageCards('categories', mockCategoriesData)

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
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CardProvider
                currentPage="categories"
                currentUser={mockUser}
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