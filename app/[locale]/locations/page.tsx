'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Package, Search, Edit, Trash2, Eye, Download, Upload, HelpCircle } from 'lucide-react'
import { Location } from '@/lib/types'
import { CardProvider, usePageCards } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { locationService, inventoryService } from '@/lib/database'
import { LoadingSpinner } from '@/components/ui/loading'
import { LocationsTable } from '@/components/locations/locations-table'

// Helper function to map database location to Location type
const mapDatabaseToLocation = (dbLocation: any, itemQuantity: number = 0): Location => ({
  id: dbLocation.id,
  name: dbLocation.name,
  description: dbLocation.address || '',
  itemQuantity
})

function LocationsContent() {
  const [locations, setLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'itemQuantity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [locationsData, setLocationsData] = useState<any>(null)
  const { addToast } = useToast()
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load locations from database
      const dbLocations = await locationService.getAll()
      
      // Load inventory to calculate item counts per location
      const inventory = await inventoryService.getAll()
      
      // Calculate item counts for each location
      const locationsWithCounts = dbLocations.map((location: any) => {
        const locationItems = inventory.filter((item: any) => item.location_id === location.id)
        const itemQuantity = locationItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        
        return mapDatabaseToLocation(location, itemQuantity)
      })
      
      setLocations(locationsWithCounts)
      
      // Generate locations data for cards
      const totalLocations = locationsWithCounts.length
      const totalItems = locationsWithCounts.reduce((sum: number, location: any) => sum + location.itemQuantity, 0)
      const averageItemsPerLocation = totalLocations > 0 ? Math.round(totalItems / totalLocations) : 0
      const highestCapacityLocation = locationsWithCounts.length > 0
        ? locationsWithCounts.reduce((max: any, location: any) =>
            location.itemQuantity > max.itemQuantity ? location : max, locationsWithCounts[0])
        : null
      const emptyLocations = locationsWithCounts.filter((loc: any) => loc.itemQuantity === 0).length
      const utilizationRate = totalLocations > 0
        ? Math.round((locationsWithCounts.filter((loc: any) => loc.itemQuantity > 0).length / totalLocations) * 100)
        : 0
      
      const cardData = {
        totalLocations,
        totalItems,
        averageItemsPerLocation,
        highestCapacityLocation,
        emptyLocations,
        utilizationRate,
        topLocations: locationsWithCounts
          .sort((a: any, b: any) => b.itemQuantity - a.itemQuantity)
          .slice(0, 3)
          .map((loc: any) => ({ id: loc.id, name: loc.name, itemQuantity: loc.itemQuantity })),
        recentActivity: [
          { id: '1', action: 'Ubicaciones cargadas', location: 'Sistema', timestamp: new Date() }
        ],
        locationDistribution: locationsWithCounts.map((loc: any) => ({
          name: loc.name,
          value: loc.itemQuantity,
          utilization: loc.itemQuantity > 0 ? 'En Uso' : 'Vacío'
        }))
      }
      
      setLocationsData(cardData)
      
    } catch (error) {
      console.error('Error loading locations:', error)
      addToast({
        type: 'error',
        title: 'Error al cargar ubicaciones',
        description: 'No se pudieron cargar las ubicaciones desde la base de datos'
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  const handleMount = useCallback(() => {
    setIsClient(true)
    loadLocations()
  }, [loadLocations])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Generate contextual cards for locations page
  usePageCards('locations', locationsData)

  const filteredLocations = locations
    .filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesSearch
    })
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const totalLocations = locations.length
  const totalItems = locations.reduce((sum, location) => sum + location.itemQuantity, 0)
  const averageItemsPerLocation = Math.round(totalItems / totalLocations)
  const highestCapacityLocation = locations.reduce((max, location) =>
    location.itemQuantity > max.itemQuantity ? location : max, locations[0])

  if (!isClient || isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ubicaciones</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ubicaciones</h2>
          <p className="text-muted-foreground text-sm">
            Gestiona tus estantes y contenedores de almacenamiento.
          </p>
        </div>
        
        {/* Action Buttons - Mobile Responsive */}
        <div className="flex flex-wrap gap-2" id="loc-actions">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs md:text-sm hover:scale-105 transition-transform"
            id="loc-import"
          >
            <Upload className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Importar</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs md:text-sm hover:scale-105 transition-transform"
            id="loc-export"
          >
            <Download className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            size="sm"
            className="text-xs md:text-sm hover:scale-105 transition-transform"
            onClick={() => window.location.href = '/locations/create'}
            id="loc-add"
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Agregar Ubicación</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTutorialOpen(true)} aria-label="Abrir tutorial de ubicaciones">
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
            <CardTitle className="text-base">Resumen de Ubicaciones</CardTitle>
            <CardDescription>Totales y estado general</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length} ubicaciones</div>
            <div className="text-sm text-muted-foreground">
              {locations.reduce((sum, l) => sum + l.itemQuantity, 0)} items totales
            </div>
          </CardContent>
        </Card>

        {/* Promedio por ubicación */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Promedio por Ubicación</CardTitle>
            <CardDescription>Items / ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.length > 0 ? Math.round(
                locations.reduce((sum, l) => sum + l.itemQuantity, 0) / locations.length
              ) : 0}
            </div>
            <div className="text-sm text-muted-foreground">promedio</div>
          </CardContent>
        </Card>

        {/* Ubicaciones vacías */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ubicaciones Vacías</CardTitle>
            <CardDescription>Sin items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(l => l.itemQuantity === 0).length}
            </div>
            <div className="text-sm text-muted-foreground">disponibles</div>
          </CardContent>
        </Card>

        {/* Más cargada */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ubicación con más items</CardTitle>
            <CardDescription>Top 1</CardDescription>
          </CardHeader>
          <CardContent>
            {locations.length > 0 ? (
              (() => {
                const top = [...locations].sort((a, b) => b.itemQuantity - a.itemQuantity)[0]
                return (
                  <div>
                    <div className="text-lg font-semibold">{top.name}</div>
                    <div className="text-sm text-muted-foreground">{top.itemQuantity} items</div>
                  </div>
                )
              })()
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters - Mobile Responsive */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1" id="loc-filters">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ubicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              className="text-xs md:text-sm hover:scale-105 transition-transform"
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('name')
                  setSortOrder('asc')
                }
              }}
            >
              <span className="hidden sm:inline">Nombre</span>
              <span className="sm:hidden">Nom</span>
              {sortBy === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </Button>
            <Button
              variant={sortBy === 'itemQuantity' ? 'default' : 'outline'}
              size="sm"
              className="text-xs md:text-sm hover:scale-105 transition-transform"
              onClick={() => {
                if (sortBy === 'itemQuantity') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('itemQuantity')
                  setSortOrder('desc')
                }
              }}
            >
              <span className="hidden sm:inline">Cantidad</span>
              <span className="sm:hidden">Cant</span>
              {sortBy === 'itemQuantity' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
            </Button>
          </div>
        </div>
      </div>

      {/* Locations Table - Mobile Responsive */}
      <Card className="shadow-sm md:shadow-lg hover:shadow-xl transition-shadow duration-300" id="loc-table">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Ubicaciones de Almacenamiento</CardTitle>
          <CardDescription className="text-sm">
            Lista de todos los estantes y contenedores de almacenamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationsTable searchTerm={searchTerm} />
        </CardContent>
      </Card>

      {isTutorialOpen && (
        // Reuse InventoryTutorial overlay
        // eslint-disable-next-line @next/next/no-async-client-component
        (require('@/components/inventory/inventory-tutorial') as any).InventoryTutorial ? (
          ((): any => {
            const { InventoryTutorial } = require('@/components/inventory/inventory-tutorial')
            return (
              <InventoryTutorial
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
                steps={[
                  { id: 'add', target: '#loc-add', title: 'Nueva ubicación', description: 'Crea una ubicación (estante, contenedor, etc.) para organizar tu inventario.', placement: 'bottom' },
                  { id: 'import', target: '#loc-import', title: 'Importar ubicaciones', description: 'Carga ubicaciones desde un archivo para acelerar la configuración.', placement: 'bottom' },
                  { id: 'export', target: '#loc-export', title: 'Exportar ubicaciones', description: 'Descarga tus ubicaciones para respaldo o auditoría.', placement: 'bottom' },
                  { id: 'filters', target: '#loc-filters', title: 'Búsqueda', description: 'Busca ubicaciones por nombre o descripción y ordena por nombre o cantidad.', placement: 'bottom' },
                  { id: 'table', target: '#loc-table', title: 'Tabla de ubicaciones', description: 'Administra tus ubicaciones y consulta el total de artículos por ubicación.', placement: 'top' }
                ]}
              />
            )
          })()
        ) : null
      )}
    </div>
  )
}

export default function LocationsPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <CardProvider
          currentPage="locations"
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
          <LocationsContent />
        </CardProvider>
      </ModalProvider>
    </ToastProvider>
  )
}