'use client'

import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import {
  User,
  Mail,
  Save,
  ArrowLeft,
  Shield
} from 'lucide-react'

export interface UserData {
  name: string
  email: string
  password: string
  role: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
}

const initialUserData: UserData = {
  name: '',
  email: '',
  password: '',
  role: ''
}

function CreateUserContent() {
  const [formData, setFormData] = useState<UserData>(initialUserData)
  const [validationState, setValidationState] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  const { addToast } = useToast()
  const router = useRouter()
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  const tForms = useTranslations('forms')

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true)
        const response = await fetch('/api/roles')
        const result = await response.json()
        
        if (result.success) {
          setRoles(result.data)
        } else {
          console.error('Failed to fetch roles:', result.error)
          addToast({
            type: 'error',
            title: 'Error',
            description: 'Failed to load roles'
          })
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
        addToast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load roles'
        })
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [addToast])

  const isFormValid = Object.values(validationState).every(Boolean) &&
    formData.name && formData.email && formData.password && formData.role

  const handleInputChange = useCallback((field: keyof UserData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update selected role when role changes
    if (field === 'role') {
      const role = roles.find(r => r.name === value)
      setSelectedRole(role || null)
    }
  }, [roles])

  const handleValidation = useCallback((field: string) => (isValid: boolean) => {
    setValidationState(prev => ({ ...prev, [field]: isValid }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      addToast({
        type: 'error',
        title: 'Formulario incompleto',
        description: 'Por favor completa todos los campos requeridos'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Usuario creado exitosamente',
          description: `Usuario ${formData.email} creado con rol ${formData.role}`
        })
        
        // Redirect to users list
        router.push('/users')
      } else {
        addToast({
          type: 'error',
          title: 'Error al crear usuario',
          description: result.error || 'Error desconocido'
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      addToast({
        type: 'error',
        title: 'Error al crear usuario',
        description: 'Error de conexión. Inténtalo de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, isFormValid, addToast, router])

  const handleCancel = useCallback(() => {
    router.push('/users')
  }, [router])

  const getRoleColor = (color?: string) => {
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
        return 'Email inválido'
      }
      return null
    }
  }

  // Name validation
  const nameValidation = {
    required: true,
    minLength: 2,
    custom: (value: string) => {
      if (value && value.trim().length < 2) {
        return 'El nombre debe tener al menos 2 caracteres'
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
        return 'La contraseña debe tener al menos 6 caracteres'
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
                  <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
                  <p className="text-gray-600">Completa la información para crear un nuevo usuario</p>
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
                      label="Nombre Completo *"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      onValidation={handleValidation('name')}
                      validation={nameValidation}
                      disabled={isLoading}
                    />

                    <FloatingInput
                      label="Correo Electrónico *"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      onValidation={handleValidation('email')}
                      validation={emailValidation}
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
                    Asignar Rol *
                  </h2>
                  
                  {isLoadingRoles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Cargando roles...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {roles.map((role) => (
                        <div key={role.id}>
                          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="role"
                              value={role.name}
                              checked={formData.role === role.name}
                              onChange={(e) => handleInputChange('role')(e.target.value)}
                              className="mt-1 flex-shrink-0"
                              disabled={isLoading}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-gray-900 break-words">{role.name}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getRoleColor()}`}>
                                  {role.permissions.length} permisos
                                </span>
                              </div>
                              {role.description && (
                                <p className="text-sm text-gray-600 break-words">{role.description}</p>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRole && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg overflow-hidden">
                      <h3 className="font-medium text-gray-900 mb-2">Permisos del Rol</h3>
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
                      disabled={!isFormValid || isLoadingRoles}
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
      <CreateUserContent />
    </ToastProvider>
  )
}