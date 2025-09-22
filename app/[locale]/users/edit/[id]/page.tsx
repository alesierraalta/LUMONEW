'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, User } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth/auth-context'
import { userService } from '@/lib/database'
import { LoadingSpinner } from '@/components/ui/loading'

interface FormData {
  name: string
  email: string
  role: string
}

interface FormErrors {
  [key: string]: string
}

function EditUserContent() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()
  const { user } = useAuth()
  const userId = params.id as string
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'user'
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const userData = await userService.getById(userId)

      if (!userData) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'No se pudo encontrar el usuario solicitado'
        })
        router.push('/users')
        return
      }

      // Populate form with existing data
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'user'
      })
    } catch (error) {
      console.error('Error loading data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar los datos del usuario'
      })
      router.push('/users')
    } finally {
      setIsLoading(false)
    }
  }, [userId, addToast, router])

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId, loadData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del correo electrónico no es válido'
    }

    if (!formData.role.trim()) {
      newErrors.role = 'El rol es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedUser = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim()
      }

      await userService.update(userId, updatedUser)

      addToast({
        type: 'success',
        title: 'Usuario actualizado exitosamente',
        description: `El usuario "${formData.name}" ha sido actualizado`
      })

      // Redirect back to users page
      router.push('/users')
    } catch (error) {
      console.error('Error updating user:', error)
      addToast({
        type: 'error',
        title: 'Error al actualizar usuario',
        description: 'No se pudo actualizar el usuario. Por favor intenta de nuevo.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/users')}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Usuarios
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Editar Usuario</h2>
            <p className="text-muted-foreground">
              Modifica la información del usuario.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Información del Usuario
          </CardTitle>
          <CardDescription>
            Actualiza el nombre, correo electrónico y rol del usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Juan Pérez"
                className={errors.name ? 'border-red-500' : ''}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo Electrónico *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="usuario@ejemplo.com"
                className={errors.email ? 'border-red-500' : ''}
                maxLength={255}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">
                Rol del Usuario *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                <option value="moderator">Moderador</option>
              </select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/users')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Actualizar Usuario
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EditUserPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <EditUserContent />
      </ModalProvider>
    </ToastProvider>
  )
}