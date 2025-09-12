'use client'

import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal } from '@/components/ui/modal'
import { User, Mail, Save, X } from 'lucide-react'
import { roleService } from '@/lib/database'
import { useTranslations } from 'next-intl'

// Interface for role data
interface Role {
  id: string
  name: string
  description?: string
  permissions?: string[]
}

export interface UserEditData {
  id?: string
  firstName: string
  lastName: string
  email: string
  role: string
  password?: string // Optional password field for privileged users
}

interface UserEditFormProps {
  user?: UserEditData
  onSubmit: (userData: UserEditData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const initialUserData: Omit<UserEditData, 'id'> = {
  firstName: '',
  lastName: '',
  email: '',
  role: ''
}

export function UserEditForm({ user, onSubmit, onCancel, isLoading = false }: UserEditFormProps) {
  const [formData, setFormData] = useState<UserEditData>(user || { ...initialUserData })
  const [validationState, setValidationState] = useState<Record<string, boolean>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [canEditPasswords, setCanEditPasswords] = useState(false)
  const { addToast } = useToast()
  const { closeModal } = useModal()
  const t = useTranslations('users.editForm')
  const tCommon = useTranslations('common')
  const tForm = useTranslations('users.form')

  const isEditing = Boolean(user?.id)
  const isFormValid = Object.values(validationState).every(Boolean) && 
    formData.firstName && formData.lastName && formData.email && formData.role &&
    (!showPasswordField || (showPasswordField && formData.password))

  // Load roles from the database and check permissions
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await roleService.getAll()
        setRoles(rolesData || [])
        
        // Check if current user has permission to edit passwords
        // This would typically come from your auth context or user session
        // For now, we'll assume admins and users with manage_users permission can edit passwords
        const currentUserRole = localStorage.getItem('userRole') || 'user'
        const hasPasswordEditPermission = currentUserRole === 'admin' || 
          currentUserRole === 'Administrador' || 
          currentUserRole === 'Super Administrador'
        
        setCanEditPasswords(hasPasswordEditPermission)
      } catch (error) {
        console.error('Error loading roles:', error)
        addToast({
          type: 'error',
          title: t('errorLoadingRoles'),
          description: t('errorLoadingRolesDescription')
        })
        // Set empty array as fallback
        setRoles([])
      }
    }

    loadRoles()
  }, [addToast])

  const handleInputChange = useCallback((field: keyof UserEditData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleValidation = useCallback((field: string) => (isValid: boolean) => {
    setValidationState(prev => ({ ...prev, [field]: isValid }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      addToast({
        type: 'error',
        title: tForm('incompleteForm'),
        description: tForm('completeAllFields')
      })
      return
    }

    try {
      await onSubmit(formData)
      
      addToast({
        type: 'success',
        title: tForm('userUpdated'),
        description: tForm('userUpdatedSuccess', { name: `${formData.firstName} ${formData.lastName}` })
      })
      
      closeModal()
    } catch (error) {
      addToast({
        type: 'error',
        title: tForm('errorSaving'),
        description: tForm('errorSavingDescription')
      })
    }
  }, [formData, isFormValid, onSubmit, addToast, closeModal])

  const handleCancel = useCallback(() => {
    onCancel?.()
    closeModal()
  }, [onCancel, closeModal])

  // Email validation
  const emailValidation = {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return tForm('validEmail')
      }
      return null
    }
  }

  // Password validation
  const passwordValidation = {
    required: showPasswordField,
    minLength: 6,
    custom: (value: string) => {
      if (showPasswordField && (!value || value.length < 6)) {
        return 'La contraseña debe tener al menos 6 caracteres'
      }
      return null
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t('editUser')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('updateBasicInfo')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {tForm('personalInformation')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label={tForm('firstName')}
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onValidation={handleValidation('firstName')}
                validation={{ required: true, minLength: 2 }}
                disabled={isLoading}
              />
              
              <FloatingInput
                label={tForm('lastName')}
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onValidation={handleValidation('lastName')}
                validation={{ required: true, minLength: 2 }}
                disabled={isLoading}
              />
            </div>

            <FloatingInput
              label={tForm('email')}
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              onValidation={handleValidation('email')}
              validation={emailValidation}
              disabled={isLoading}
            />

            {/* Password Management Section */}
            {canEditPasswords && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Gestión de Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordField(!showPasswordField)
                      if (showPasswordField) {
                        setFormData(prev => ({ ...prev, password: '' }))
                      }
                    }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                    disabled={isLoading}
                  >
                    {showPasswordField ? 'Cancelar cambio' : 'Cambiar contraseña'}
                  </button>
                </div>
                
                {showPasswordField && (
                  <FloatingInput
                    label="Nueva Contraseña *"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange('password')}
                    onValidation={handleValidation('password')}
                    validation={passwordValidation}
                    disabled={isLoading}
                    placeholder="Ingresa la nueva contraseña"
                  />
                )}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {tForm('role')} *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                disabled={isLoading}
                required
              >
                <option value="">{t('selectRole')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText={tForm('updating')}
              disabled={!isFormValid}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              {tForm('updateUser')}
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
        </form>
      </div>
    </div>
  )
}