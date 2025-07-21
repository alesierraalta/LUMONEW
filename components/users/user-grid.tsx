'use client'

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { Search, Filter, MoreVertical, Edit, Trash2, Eye, Users, Plus, Shield } from 'lucide-react'
import { UserData } from './user-form'
import { LoadingOverlay, Skeleton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal, ConfirmationModal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

interface UserGridProps {
  users: UserData[]
  isLoading?: boolean
  onUserEdit: (user: UserData) => void
  onUserDelete: (userId: string) => void
  onUserView: (user: UserData) => void
  onUserCreate: () => void
}

interface FilterState {
  search: string
  status: 'all' | 'active' | 'inactive' | 'pending'
  department: string
  location: string
}

const initialFilters: FilterState = {
  search: '',
  status: 'all',
  department: '',
  location: ''
}

export function UserGrid({ 
  users, 
  isLoading = false, 
  onUserEdit, 
  onUserDelete, 
  onUserView, 
  onUserCreate 
}: UserGridProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const { addToast } = useToast()
  const { openModal } = useModal()

  // Get unique departments and locations for filter options
  const { departments, locations } = useMemo(() => {
    const depts = Array.from(new Set(users.map(user => user.department).filter(Boolean)))
    const locs = Array.from(new Set(users.map(user => user.location).filter(Boolean)))
    return { departments: depts, locations: locs }
  }, [users])

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !filters.search || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.position.toLowerCase().includes(filters.search.toLowerCase())

      const matchesStatus = filters.status === 'all' || user.status === filters.status
      const matchesDepartment = !filters.department || user.department === filters.department
      const matchesLocation = !filters.location || user.location === filters.location

      return matchesSearch && matchesStatus && matchesDepartment && matchesLocation
    })
  }, [users, filters])

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const handleDeleteUser = useCallback((user: UserData) => {
    openModal(
      <ConfirmationModal
        type="danger"
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar a ${user.firstName} ${user.lastName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          onUserDelete(user.id!)
          addToast({
            type: 'success',
            title: 'Usuario eliminado',
            description: `${user.firstName} ${user.lastName} ha sido eliminado exitosamente`
          })
        }}
      />
    )
  }, [openModal, onUserDelete, addToast])

  const getStatusBadge = (status: UserData['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente'
    }

    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[status]
      )}>
        {labels[status]}
      </span>
    )
  }

  const UserCard = ({ user }: { user: UserData }) => {
    const [showActions, setShowActions] = useState(false)

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group">
        {/* User Avatar and Basic Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
              )}
              <div className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                user.status === 'active' ? 'bg-green-500' :
                user.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
              )} />
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600 truncate">{user.position}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onUserView(user)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver detalles
                </button>
                <button
                  onClick={() => {
                    onUserEdit(user)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(user)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Department and Location */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Departamento:</span>
            <span>{user.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Ubicación:</span>
            <span>{user.location}</span>
          </div>
        </div>

        {/* Status and Start Date */}
        <div className="flex items-center justify-between">
          {getStatusBadge(user.status)}
          <span className="text-xs text-gray-500">
            Desde {new Date(user.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-600">
              {filteredUsers.length} de {users.length} usuarios
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/users/create'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </button>
          <button
            onClick={() => window.location.href = '/roles'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Gestionar Roles
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="">Todas</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Grid */}
      <LoadingOverlay isLoading={isLoading}>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600 mb-4">
              {users.length === 0 
                ? 'Comienza creando tu primer usuario'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            {users.length === 0 && (
              <button
                onClick={onUserCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Crear Usuario
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </LoadingOverlay>
    </div>
  )
}