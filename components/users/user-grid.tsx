'use client'

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { Search, Filter, MoreVertical, Edit, Trash2, Eye, Users, Plus, Shield } from 'lucide-react'
import { UserData } from './user-form'
import { LoadingOverlay, Skeleton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal, ConfirmationModal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('users.grid')
  const tCommon = useTranslations('common')
  const tUsers = useTranslations('users')

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
        title={t('deleteUser')}
        message={t('deleteConfirmation', { name: `${user.firstName} ${user.lastName}` })}
        confirmText={t('deleteButton')}
        cancelText={t('cancelButton')}
        onConfirm={() => {
          onUserDelete(user.id!)
          addToast({
            type: 'success',
            title: t('userDeleted'),
            description: t('userDeletedSuccess', { name: `${user.firstName} ${user.lastName}` })
          })
        }}
      />
    )
  }, [openModal, onUserDelete, addToast, t])

  const getStatusBadge = (status: UserData['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      inactive: 'bg-muted text-muted-foreground border-border',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    }

    const labels = {
      active: tUsers('active'),
      inactive: tUsers('inactive'),
      pending: tUsers('pending')
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
      <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-200 group">
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
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background',
                user.status === 'active' ? 'bg-green-500' :
                user.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
              )} />
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{user.position}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-10">
                <button
                  onClick={() => {
                    onUserView(user)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {t('viewDetails')}
                </button>
                <button
                  onClick={() => {
                    onUserEdit(user)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {t('edit')}
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(user)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Department and Location */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{t('departmentLabel')}</span>
            <span className="text-foreground">{user.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{t('locationLabel')}</span>
            <span className="text-foreground">{user.location}</span>
          </div>
        </div>

        {/* Status and Start Date */}
        <div className="flex items-center justify-between">
          {getStatusBadge(user.status)}
          <span className="text-xs text-muted-foreground">
            {t('since')} {new Date(user.startDate).toLocaleDateString()}
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
            <div key={i} className="bg-card rounded-xl border border-border p-6">
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
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{t('userManagement')}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t('usersCount', { filtered: filteredUsers.length, total: users.length })}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.location.href = '/users/create'}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('newUser')}</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
          <button
            onClick={() => window.location.href = '/roles'}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t('manageRoles')}</span>
            <span className="sm:hidden">Roles</span>
          </button>
        </div>
      </div>

      {/* Search and Filters - Mobile Responsive */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-2 px-3 md:px-4 py-2 border rounded-lg transition-colors text-sm',
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                : 'border-border text-foreground hover:bg-accent'
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t('filters')}</span>
            <span className="sm:hidden">Filtros</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                >
                  <option value="all">{t('all')}</option>
                  <option value="active">{tUsers('active')}</option>
                  <option value="inactive">{tUsers('inactive')}</option>
                  <option value="pending">{tUsers('pending')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('department')}
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                >
                  <option value="">{t('all')}</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('location')}
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                >
                  <option value="">{t('allLocations')}</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('clearFilters')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Grid */}
      <LoadingOverlay isLoading={isLoading}>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('noUsersFound')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {users.length === 0
                ? t('createFirstUser')
                : t('adjustFilters')
              }
            </p>
            {users.length === 0 && (
              <button
                onClick={onUserCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t('createUser')}
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