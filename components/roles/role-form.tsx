'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal } from '@/components/ui/modal'
import { Shield, Save, X, Check } from 'lucide-react'
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

interface RoleFormProps {
  role?: RoleData
  onSubmit: (roleData: RoleData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  availablePermissions: Permission[]
}

const initialRoleData: Omit<RoleData, 'id'> = {
  name: '',
  description: '',
  permissions: [],
  color: 'blue',
  isSystem: false
}

const getRoleColors = (t: any) => [
  { value: 'red', name: t('colors.red'), class: 'bg-red-500' },
  { value: 'blue', name: t('colors.blue'), class: 'bg-blue-500' },
  { value: 'green', name: t('colors.green'), class: 'bg-green-500' },
  { value: 'yellow', name: t('colors.yellow'), class: 'bg-yellow-500' },
  { value: 'purple', name: t('colors.purple'), class: 'bg-purple-500' },
  { value: 'gray', name: t('colors.gray'), class: 'bg-gray-500' }
]

export function RoleForm({ role, onSubmit, onCancel, isLoading = false, availablePermissions }: RoleFormProps) {
  const t = useTranslations('roles.form')
  const tCommon = useTranslations('common')
  const [formData, setFormData] = useState<RoleData>(role || { ...initialRoleData })
  const [validationState, setValidationState] = useState<Record<string, boolean>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions || [])
  )
  const { addToast } = useToast()
  const { closeModal } = useModal()

  const isEditing = Boolean(role?.id)
  const isFormValid = Object.values(validationState).every(Boolean) &&
    formData.name && formData.description && selectedPermissions.size > 0
  const ROLE_COLORS = getRoleColors(t)

  const handleInputChange = useCallback((field: keyof RoleData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleValidation = useCallback((field: string) => (isValid: boolean) => {
    setValidationState(prev => ({ ...prev, [field]: isValid }))
  }, [])

  const handlePermissionToggle = useCallback((permissionId: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId)
      } else {
        newSet.add(permissionId)
      }
      return newSet
    })
  }, [])

  const handleCategoryToggle = useCallback((category: string) => {
    const categoryPermissions = availablePermissions
      .filter(p => p.category === category)
      .map(p => p.id)
    
    const allCategorySelected = categoryPermissions.every(id => selectedPermissions.has(id))
    
    setSelectedPermissions(prev => {
      const newSet = new Set(prev)
      if (allCategorySelected) {
        // Remove all category permissions
        categoryPermissions.forEach(id => newSet.delete(id))
      } else {
        // Add all category permissions
        categoryPermissions.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }, [availablePermissions, selectedPermissions])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      addToast({
        type: 'error',
        title: t('incompleteForm'),
        description: t('completeAllFieldsAndPermissions')
      })
      return
    }

    try {
      const roleData: RoleData = {
        ...formData,
        permissions: Array.from(selectedPermissions)
      }
      
      await onSubmit(roleData)
      
      addToast({
        type: 'success',
        title: isEditing ? t('roleUpdated') : t('roleCreated'),
        description: t(isEditing ? 'roleUpdatedSuccess' : 'roleCreatedSuccess', { name: formData.name })
      })
      
      closeModal()
    } catch (error) {
      addToast({
        type: 'error',
        title: t('errorSaving'),
        description: t('errorSavingDescription')
      })
    }
  }, [formData, selectedPermissions, isFormValid, isEditing, onSubmit, addToast, closeModal])

  const handleCancel = useCallback(() => {
    onCancel?.()
    closeModal()
  }, [onCancel, closeModal])

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg border-2 ${getRoleColor(formData.color)}`}>
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? t('editRole') : t('newRole')}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing ? t('updateRoleInfo') : t('completeRoleData')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              {t('basicInformation')}
            </h3>
            
            <FloatingInput
              label={t('roleName')}
              value={formData.name}
              onChange={handleInputChange('name')}
              onValidation={handleValidation('name')}
              validation={{ required: true, minLength: 2 }}
              disabled={isLoading || role?.isSystem}
            />
            
            <FloatingTextarea
              label={t('description')}
              value={formData.description}
              onChange={handleInputChange('description')}
              onValidation={handleValidation('description')}
              validation={{ required: true, minLength: 10, maxLength: 200 }}
              helperText={t('descriptionHelper')}
              rows={3}
              disabled={isLoading || role?.isSystem}
            />

            {/* Color Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('roleColor')}
              </label>
              <div className="flex gap-3">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    disabled={isLoading || role?.isSystem}
                    className={`
                      relative w-10 h-10 rounded-full ${color.class} 
                      ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}
                      ${isLoading || role?.isSystem ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform cursor-pointer'}
                    `}
                    title={color.name}
                  >
                    {formData.color === color.value && (
                      <Check className="h-5 w-5 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {t('permissionsSelected', { count: selectedPermissions.size })}
              </h3>
              <div className="text-sm text-gray-500">
                {t('selectPermissions')}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([category, permissions]) => {
                const categoryPermissions = permissions.map(p => p.id)
                const allCategorySelected = categoryPermissions.every(id => selectedPermissions.has(id))
                const someCategorySelected = categoryPermissions.some(id => selectedPermissions.has(id))
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allCategorySelected}
                          ref={(input) => {
                            if (input) input.indeterminate = someCategorySelected && !allCategorySelected
                          }}
                          onChange={() => handleCategoryToggle(category)}
                          disabled={isLoading || role?.isSystem}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">{category}</span>
                        <span className="text-sm text-gray-500">
                          ({permissions.filter(p => selectedPermissions.has(p.id)).length}/{permissions.length})
                        </span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                      {permissions.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.has(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            disabled={isLoading || role?.isSystem}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText={isEditing ? t('updating') : t('creating')}
              disabled={!isFormValid || role?.isSystem}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? t('updateRole') : t('createRole')}
            </LoadingButton>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2 inline" />
              {tCommon('cancel')}
            </button>
          </div>

          {role?.isSystem && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Shield className="h-5 w-5" />
                <span className="font-medium">{t('systemRoleWarning')}</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                {t('systemRoleDescription')}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}