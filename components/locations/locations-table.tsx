'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Location } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface LocationsTableProps {
  locations: Location[]
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

export function LocationsTable({ locations }: LocationsTableProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const toggleAllLocations = () => {
    setSelectedLocations(prev =>
      prev.length === locations.length ? [] : locations.map(l => l.id)
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
                checked={selectedLocations.length === locations.length && locations.length > 0}
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
          {locations.map((location) => {
            const utilizationPercentage = Math.round((location.currentStock / location.capacity) * 100)
            
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
                      {location.capacity.toLocaleString()}
                    </div>
                    <div className="text-gray-600">
                      {location.currentStock.toLocaleString()} used
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
                  <Badge variant={location.isActive ? "default" : "secondary"}>
                    {location.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-600">
                    {formatDate(location.updatedAt)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
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

      {locations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No locations found</div>
          <div className="text-sm text-gray-400 mt-1">
            Try adjusting your search criteria
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
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}