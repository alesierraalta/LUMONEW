'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { locationService } from '@/lib/database'

interface Location {
  id: string
  name: string
  address: string
  type: string
  manager: string
  phone: string | null
  email: string | null
  capacity: number
  current_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface LocationsTableProps {
  searchTerm?: string
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'warehouse':
      return 'bg-blue-100 text-blue-800'
    case 'store':
      return 'bg-green-100 text-green-800'
    case 'office':
      return 'bg-purple-100 text-purple-800'
    case 'distribution':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getUtilizationColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-100 text-red-800'
  if (percentage >= 75) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export function LocationsTable({ searchTerm = '' }: LocationsTableProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch locations data
  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true)
        const data = await locationService.getAll()
        setLocations(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations')
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  // Filter locations based on search term
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const toggleAllLocations = () => {
    setSelectedLocations(prev =>
      prev.length === filteredLocations.length ? [] : filteredLocations.map(l => l.id)
    )
  }

  const handleEdit = (location: Location) => {
    // TODO: Implement edit functionality
    console.log('Edit location:', location)
  }

  const handleDelete = async (location: Location) => {
    console.log('Delete button clicked for location:', location.name)
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la ubicación "${location.name}"?`)) {
      return
    }

    try {
      console.log('Attempting to delete location with ID:', location.id)
      await locationService.delete(location.id)
      console.log('Location deleted successfully')
      
      // Update the local state to remove the deleted location
      setLocations(prev => prev.filter(l => l.id !== location.id))
      
      // Show success message
      alert(`Ubicación "${location.name}" eliminada exitosamente.`)
    } catch (err) {
      console.error('Failed to delete location:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      alert(`Error al eliminar la ubicación: ${errorMessage}. Puede estar siendo utilizada por elementos del inventario.`)
    }
  }

  const handleBulkDelete = async () => {
    console.log('Bulk delete button clicked for locations:', selectedLocations)
    
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedLocations.length} ubicaciones?`)) {
      return
    }

    try {
      console.log('Attempting to delete locations with IDs:', selectedLocations)
      
      // Delete all selected locations
      await Promise.all(selectedLocations.map(id => locationService.delete(id)))
      console.log('Locations deleted successfully')
      
      // Update the local state to remove deleted locations
      setLocations(prev => prev.filter(l => !selectedLocations.includes(l.id)))
      setSelectedLocations([])
      
      // Show success message
      alert(`${selectedLocations.length} ubicaciones eliminadas exitosamente.`)
    } catch (err) {
      console.error('Failed to delete locations:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      alert(`Error al eliminar algunas ubicaciones: ${errorMessage}. Pueden estar siendo utilizadas por elementos del inventario.`)
    }
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Manager</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Capacity</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Utilization</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Updated</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-4 px-4">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600">Error loading locations: {error}</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">
              <input
                type="checkbox"
                checked={selectedLocations.length === filteredLocations.length && filteredLocations.length > 0}
                onChange={toggleAllLocations}
                className="rounded border-gray-300"
              />
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Manager</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Capacity</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Utilization</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Updated</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLocations.map((location) => {
            const capacity = location.capacity || 0
            const currentStock = location.current_stock || 0
            const utilizationPercentage = capacity > 0
              ? Math.round((currentStock / capacity) * 100)
              : 0
            
            return (
              <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location.id)}
                    onChange={() => toggleLocationSelection(location.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {location.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant="secondary" className={getTypeColor(location.type)}>
                    {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{location.manager}</div>
                    <div className="flex items-center space-x-2 text-gray-600 mt-1">
                      {location.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">{location.phone}</span>
                        </div>
                      )}
                      {location.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs">{location.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {location.capacity?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-gray-600">
                      {location.current_stock?.toLocaleString() || '0'} used
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          utilizationPercentage >= 90 ? 'bg-red-500' :
                          utilizationPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                      />
                    </div>
                    <Badge variant="secondary" className={getUtilizationColor(utilizationPercentage)}>
                      {utilizationPercentage}%
                    </Badge>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={location.is_active ? "default" : "secondary"}>
                    {location.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-600">
                    {formatDate(new Date(location.updated_at))}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(location)
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {filteredLocations.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">No locations found</div>
          <div className="text-sm text-gray-400 mt-1">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first location to get started'}
          </div>
        </div>
      )}

      {selectedLocations.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              {selectedLocations.length} locations selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleBulkDelete()
                }}
                type="button"
              >
                Eliminar Seleccionadas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}