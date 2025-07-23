'use client'

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { Search, Filter, MoreVertical, Edit, Trash2, Eye, Shield, Plus, Users } from 'lucide-react'
import { LoadingOverlay, Skeleton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal, ConfirmationModal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export interface RoleData {
  id?: string
  name: string
  description: string
  permissions: string[]
  color: string
  isSystem?: boolean
  userCount?: number
  createdAt?: string
  updatedAt?: string
}

interface Permission {
  id: string
  name: string
  category: string
}

interface RoleGridProps {
  roles: RoleData[]
  isLoading?: boolean
  onRoleEdit: (role: RoleData) => void
  onRoleDelete: (roleId: string) => void
  onRoleView: (role: RoleData) => void
  onRoleCreate: () => void
  availablePermissions: Permission[]
}

interface FilterState {
  search: string
  color: string
  isSystem: 'all' | 'system' | 'custom'
}

const initialFilters: FilterState = {
  search: '',
  color: '',
  isSystem: 'all'
}

export function RoleGrid({
  roles,
  isLoading = false,
  onRoleEdit,
  onRoleDelete,
  onRoleView,
  onRoleCreate,
  availablePermissions
}: RoleGridProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const { addToast } = useToast()
  const { openModal } = useModal()
  const t = useTranslations('roles')
  const tCommon = useTranslations('common')

  // Get unique colors for filter options
  const availableColors = useMemo(() => {
    return Array.from(new Set(roles.map(role => role.color).filter(Boolean)))
  }, [roles])

  // Filter roles based on current filters
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = !filters.search || 
        role.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        role.description.toLowerCase().includes(filters.search.toLowerCase())

      const matchesColor = !filters.color || role.color === filters.color
      
      const matchesSystemType = filters.isSystem === 'all' || 
        (filters.isSystem === 'system' && role.isSystem) ||
        (filters.isSystem === 'custom' && !role.isSystem)

      return matchesSearch && matchesColor && matchesSystemType
    })
  }, [roles, filters])

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const handleDeleteRole = useCallback((role: RoleData) => {
    if (role.isSystem) {
      addToast({
        type: 'error',
        title: t('cannotDelete'),
        description: t('systemRolesCannotBeDeleted')
      })
      return
    }

    if (role.userCount && role.userCount > 0) {
      addToast({
        type: 'error',
        title: t('cannotDelete'),
        description: t('roleInUse', { count: role.userCount })
      })
      return
    }

    openModal(
      <ConfirmationModal
        type="danger"
        title={t('deleteRole')}
        message={t('deleteConfirmation', { name: role.name })}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        onConfirm={() => {
          onRoleDelete(role.id!)
          addToast({
            type: 'success',
            title: t('roleDeleted'),
            description: t('roleDeletedSuccess', { name: role.name })
          })
        }}
      />
    )
  }, [openModal, onRoleDelete, addToast, t, tCommon])

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const getColorName = (color: string) => {
    return t(`colors.${color}`) || color
  }

  const RoleCard = ({ role }: { role: RoleData }) => {
    const [showActions, setShowActions] = useState(false)

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group">
        {/* Role Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`p-3 rounded-full border-2 ${getRoleColor(role.color)}`}>
              <Shield className="h-6 w-6" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{role.name}</h3>
                {role.isSystem && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    {t('systemRole')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{role.description}</p>
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
                    onRoleView(role)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {t('viewDetails')}
                </button>
                <button
                  onClick={() => {
                    onRoleEdit(role)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  disabled={role.isSystem}
                >
                  <Edit className="h-4 w-4" />
                  {t('edit')}
                </button>
                <button
                  onClick={() => {
                    handleDeleteRole(role)
                    setShowActions(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  disabled={role.isSystem}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role Stats */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('assignedUsers')}</span>
            <span className="font-medium text-gray-900 flex items-center gap-1">
              <Users className="h-4 w-4" />
              {role.userCount || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('permissions')}</span>
            <span className="font-medium text-gray-900">{role.permissions.length}</span>
          </div>
        </div>

        {/* Role Color and Date */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role.color)}`}>
            {getColorName(role.color)}
          </span>
          {role.createdAt && (
            <span className="text-xs text-gray-500">
              {t('created')} {new Date(role.createdAt).toLocaleDateString()}
            </span>
          )}
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
                  <Skeleton className="h-3 w-full" />
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-600">
              {t('rolesCount', { filtered: filteredRoles.length, total: roles.length })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/users'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Users className="h-4 w-4" />
            {t('viewUsers')}
          </button>
          <button
            onClick={onRoleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('newRole')}
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
              placeholder={t('searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
              showFilters 
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="h-4 w-4" />
            {t('filters')}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('type')}
                </label>
                <select
                  value={filters.isSystem}
                  onChange={(e) => handleFilterChange('isSystem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                >
                  <option value="all">{t('all')}</option>
                  <option value="system">{t('system')}</option>
                  <option value="custom">{t('custom')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('color')}
                </label>
                <select
                  value={filters.color}
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                >
                  <option value="">{t('all')}</option>
                  {availableColors.map(color => (
                    <option key={color} value={color}>{getColorName(color)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('clearFilters')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Grid */}
      <LoadingOverlay isLoading={isLoading}>
        {filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noRolesFound')}
            </h3>
            <p className="text-gray-600 mb-4">
              {roles.length === 0
                ? t('createFirstRole')
                : t('adjustFilters')
              }
            </p>
            {roles.length === 0 && (
              <button
                onClick={onRoleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t('createRole')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </LoadingOverlay>
    </div>
  )
}