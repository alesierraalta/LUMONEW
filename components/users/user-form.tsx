'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input'
import { ImageUpload } from '@/components/ui/image-upload'
import { LoadingButton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal } from '@/components/ui/modal'
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Save, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export interface UserData {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  location: string
  bio: string
  profileImage?: string
  startDate: string
  status: 'active' | 'inactive' | 'pending'
  password?: string
  roleId?: string
}

interface UserFormProps {
  user?: UserData
  onSubmit: (userData: UserData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const initialUserData: Omit<UserData, 'id'> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  location: '',
  bio: '',
  profileImage: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'active',
  password: '',
  roleId: ''
}

export function UserForm({ user, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserData>(user || { ...initialUserData })
  const [validationState, setValidationState] = useState<Record<string, boolean>>({})
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const { addToast } = useToast()
  const { closeModal } = useModal()
  const t = useTranslations('users.form')
  const tUsers = useTranslations('users')

  const isEditing = Boolean(user?.id)
  const isFormValid = Object.values(validationState).every(Boolean) &&
    formData.email && formData.firstName && formData.lastName &&
    (!isEditing ? formData.password : true) && formData.roleId

  const handleInputChange = useCallback((field: keyof UserData) => (value: string) => {
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
        title: t('incompleteForm'),
        description: t('completeRequiredFields')
      })
      return
    }

    try {
      await onSubmit(formData)
      
      addToast({
        type: 'success',
        title: isEditing ? t('userUpdated') : t('userCreated'),
        description: t(isEditing ? 'userUpdatedSuccess' : 'userCreatedSuccess', {
          email: formData.email
        })
      })
      
      closeModal()
    } catch (error) {
      addToast({
        type: 'error',
        title: t('saveError'),
        description: t('saveErrorDescription')
      })
    }
  }, [formData, isFormValid, isEditing, onSubmit, addToast, closeModal])

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
        return t('validEmail')
      }
      return null
    }
  }

  // Password validation
  const passwordValidation = {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return t('passwordMinLength')
      }
      return null
    }
  }

  // Mock roles for selection
  const roles = [
    { id: '1', name: 'Administrador' },
    { id: '2', name: 'Manager' },
    { id: '3', name: 'Usuario' }
  ]

  return (
    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Actualizar información del usuario' : 'Completa los datos básicos del usuario'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-600" />
              Información del Usuario
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Nombre *"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onValidation={handleValidation('firstName')}
                validation={{ required: true }}
                disabled={isLoading}
              />
              
              <FloatingInput
                label="Apellido *"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onValidation={handleValidation('lastName')}
                validation={{ required: true }}
                disabled={isLoading}
              />
            </div>

            <FloatingInput
              label="Correo Electrónico *"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              onValidation={handleValidation('email')}
              validation={emailValidation}
              disabled={isLoading}
            />

            {!isEditing && (
              <FloatingInput
                label="Contraseña *"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                onValidation={handleValidation('password')}
                validation={passwordValidation}
                disabled={isLoading}
              />
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rol *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                disabled={isLoading}
                required
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText={isEditing ? 'Actualizando...' : 'Creando...'}
              disabled={!isFormValid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </LoadingButton>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2 inline" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}