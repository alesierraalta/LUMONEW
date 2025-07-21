'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Package, Search, Edit, Trash2, Eye, Download, Upload } from 'lucide-react'
import { Location } from '@/lib/types'
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

// Simplified mock data for shelf/storage locations
const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Shelf A1',
    description: 'Electronics storage shelf - first row',
    itemQuantity: 45
  },
  {
    id: '2',
    name: 'Shelf A2',
    description: 'Electronics storage shelf - second row',
    itemQuantity: 32
  },
  {
    id: '3',
    name: 'Shelf B1',
    description: 'Accessories storage area',
    itemQuantity: 78
  },
  {
    id: '4',
    name: 'Shelf B2',
    description: 'Cables and small items storage',
    itemQuantity: 156
  },
  {
    id: '5',
    name: 'Storage Unit C',
    description: 'Large items storage container',
    itemQuantity: 23
  },
  {
    id: '6',
    name: 'Shelf D1',
    description: 'Phone cases and covers',
    itemQuantity: 89
  },
  {
    id: '7',
    name: 'Storage Unit E',
    description: 'Bulk storage for high-volume items',
    itemQuantity: 234
  },
  {
    id: '8',
    name: 'Shelf F1',
    description: 'Audio equipment storage',
    itemQuantity: 67
  }
]

// Mock locations data for cards
const mockLocationsData = {
  totalLocations: mockLocations.length,
  totalItems: mockLocations.reduce((sum, location) => sum + location.itemQuantity, 0),
  averageItemsPerLocation: Math.round(mockLocations.reduce((sum, location) => sum + location.itemQuantity, 0) / mockLocations.length),
  highestCapacityLocation: mockLocations.reduce((max, location) => 
    location.itemQuantity > max.itemQuantity ? location : max, mockLocations[0]),
  emptyLocations: mockLocations.filter(loc => loc.itemQuantity === 0).length,
  utilizationRate: Math.round((mockLocations.filter(loc => loc.itemQuantity > 0).length / mockLocations.length) * 100),
  topLocations: mockLocations
    .sort((a, b) => b.itemQuantity - a.itemQuantity)
    .slice(0, 3)
    .map(loc => ({ id: loc.id, name: loc.name, itemQuantity: loc.itemQuantity })),
  recentActivity: [
    { id: '1', action: 'Ubicación actualizada', location: 'Shelf A1', timestamp: new Date() },
    { id: '2', action: 'Nueva ubicación creada', location: 'Storage Unit F', timestamp: new Date() }
  ],
  locationDistribution: mockLocations.map(loc => ({
    name: loc.name,
    value: loc.itemQuantity,
    utilization: loc.itemQuantity > 0 ? 'En Uso' : 'Vacío'
  }))
}

function LocationsContent() {
  const [locations, setLocations] = useState<Location[]>(mockLocations)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'itemQuantity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isClient, setIsClient] = useState(false)

  const handleMount = useCallback(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Generate contextual cards for locations page
  usePageCards('locations', mockLocationsData)

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
          <h2 className="text-3xl font-bold tracking-tight">Ubicaciones</h2>
          <p className="text-muted-foreground">
            Gestiona tus estantes y contenedores de almacenamiento.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="hover:scale-105 transition-transform">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Ubicación
          </Button>
        </div>
      </div>

      {/* Information Cards */}
      <CardContainer
        layout="grid"
        columns={4}
        maxCards={8}
        className="mb-6"
      />

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ubicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              className="hover:scale-105 transition-transform"
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('name')
                  setSortOrder('asc')
                }
              }}
            >
              Nombre {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortBy === 'itemQuantity' ? 'default' : 'outline'}
              size="sm"
              className="hover:scale-105 transition-transform"
              onClick={() => {
                if (sortBy === 'itemQuantity') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('itemQuantity')
                  setSortOrder('desc')
                }
              }}
            >
              Cantidad {sortBy === 'itemQuantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Ubicaciones de Almacenamiento</CardTitle>
          <CardDescription>
            Lista de todos los estantes y contenedores de almacenamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Nombre
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Descripción
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Cantidad de Artículos
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((location) => (
                    <tr key={location.id} className="border-b transition-colors hover:bg-muted/50 hover:scale-[1.01] transition-transform">
                      <td className="p-4 align-middle">
                        <div className="font-medium">{location.name}</div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="text-sm text-muted-foreground">
                          {location.description || 'Sin descripción'}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{location.itemQuantity}</div>
                        <div className="text-sm text-muted-foreground">
                          artículos almacenados
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge
                          variant={location.itemQuantity > 0 ? "default" : "secondary"}
                          className={location.itemQuantity > 0 ? "bg-green-100 text-green-800 hover:bg-green-200 transition-colors" : "hover:bg-gray-200 transition-colors"}
                        >
                          {location.itemQuantity > 0 ? 'En Uso' : 'Vacío'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" title="Ver detalles" className="hover:scale-110 transition-transform">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Editar" className="hover:scale-110 transition-transform">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Eliminar" className="hover:scale-110 transition-transform hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No se encontraron ubicaciones que coincidan con tu búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LocationsPage() {
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CardProvider
                currentPage="locations"
                currentUser={mockUser}
              >
                <LocationsContent />
              </CardProvider>
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}