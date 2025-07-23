'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input'
import { ImageUpload } from '@/components/ui/image-upload'
import { LoadingButton } from '@/components/ui/loading'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { Sidebar } from '@/components/layout/sidebar'
import { useTranslations } from 'next-intl'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Save,
  ArrowLeft,
  Shield,
  Users
} from 'lucide-react'

export interface UserData {
  id?: string
  email: string
  password: string
  roleId: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
}

// Mock roles data - in real app this would come from API
// Mock roles data - in real app this would come from API
const getMockRoles = (t: any): Role[] => [
  {
    id: '1',
    name: t('admin'),
    description: t('roles.adminDescription'),
    permissions: ['users.create', 'users.edit', 'users.delete', 'roles.manage', 'system.admin'],
    color: 'red'
  },
  {
    id: '2',
    name: t('manager'),
    description: t('roles.managerDescription'),
    permissions: ['users.view', 'users.edit', 'projects.manage', 'reports.view'],
    color: 'blue'
  },
  {
    id: '3',
    name: t('employee'),
    description: t('roles.employeeDescription'),
    permissions: ['profile.edit', 'projects.view', 'tasks.manage'],
    color: 'green'
  },
  {
    id: '4',
    name: t('viewer'),
    description: t('roles.viewerDescription'),
    permissions: ['profile.view', 'projects.view'],
    color: 'gray'
  }
]

const initialUserData: Omit<UserData, 'id'> = {
  email: '',
  password: '',
  roleId: ''
}

function CreateUserContent() {
  const [formData, setFormData] = useState<UserData>(initialUserData)
  const [validationState, setValidationState] = useState<Record<string, boolean>>({})
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  const { addToast } = useToast()
  const router = useRouter()
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  const tForms = useTranslations('forms')
  
  const mockRoles = getMockRoles(t)

  const isFormValid = Object.values(validationState).every(Boolean) &&
    formData.email && formData.password && formData.roleId

  const handleInputChange = useCallback((field: keyof UserData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update selected role when roleId changes
    if (field === 'roleId') {
      const role = mockRoles.find(r => r.id === value)
      setSelectedRole(role || null)
    }
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
        description: t('completeAllFields')
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      addToast({
        type: 'success',
        title: t('userCreatedSuccess'),
        description: t('userCreatedWithRole', {
          email: formData.email,
          role: selectedRole?.name || ''
        })
      })
      
      // Redirect to users list
      router.push('/users')
    } catch (error) {
      addToast({
        type: 'error',
        title: t('errorCreatingUser'),
        description: t('errorCreatingUserTryAgain')
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, isFormValid, selectedRole, addToast, router])

  const handleCancel = useCallback(() => {
    router.push('/users')
  }, [router])

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  // Email validation
  const emailValidation = {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return tForms('invalidEmail')
      }
      return null
    }
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('createNewUser')}</h1>
                    <p className="text-gray-600">{t('createUserDescription')}</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-8">
                  {/* User Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-600" />
                      Información del Usuario
                    </h2>
                    
                    <div className="space-y-6">
                      <FloatingInput
                        label="Correo Electrónico *"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        onValidation={handleValidation('email')}
                        validation={emailValidation}
                        disabled={isLoading}
                      />

                      <FloatingInput
                        label="Contraseña *"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        onValidation={handleValidation('password')}
                        validation={{ required: true, minLength: 6 }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-gray-600" />
                      {t('assignRole')} *
                    </h2>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {mockRoles.map((role) => (
                        <div key={role.id}>
                          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="role"
                              value={role.id}
                              checked={formData.roleId === role.id}
                              onChange={(e) => handleInputChange('roleId')(e.target.value)}
                              className="mt-1 flex-shrink-0"
                              disabled={isLoading}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-gray-900 break-words">{role.name}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getRoleColor(role.color)}`}>
                                  {t('permissionsCount', { count: role.permissions.length })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 break-words">{role.description}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    {selectedRole && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg overflow-hidden">
                        <h3 className="font-medium text-gray-900 mb-2">{t('rolePermissions')}</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {selectedRole.permissions.map((permission) => (
                            <div key={permission} className="text-sm text-gray-600 flex items-center gap-2 break-words">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                              <span className="break-words">{permission}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="space-y-3">
                      <LoadingButton
                        type="submit"
                        isLoading={isLoading}
                        loadingText={'Creando Usuario...'}
                        disabled={!isFormValid}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Crear Usuario
                      </LoadingButton>
                      
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
      </div>
    </div>
  )
}

export default function CreateUserPage() {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <CreateUserContent />
        </main>
      </div>
    </ToastProvider>
  )
}