'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, MapPin } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth/auth-context'
import { auditedLocationService } from '@/lib/database-with-audit'
import { LoadingSpinner } from '@/components/ui/loading'

interface FormData {
  name: string
  address: string
}

interface FormErrors {
  [key: string]: string
}

function EditLocationContent() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()
  const { user } = useAuth()
  const locationId = params.id as string
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load location data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const locationData = await auditedLocationService.getById(locationId) as any

      if (!locationData) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'No se pudo encontrar la ubicación solicitada'
        })
        router.push('/locations')
        return
      }

      // Populate form with existing data
      setFormData({
        name: locationData.name || '',
        address: locationData.address || ''
      })
    } catch (error) {
      console.error('Error loading data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar los datos de la ubicación'
      })
      router.push('/locations')
    } finally {
      setIsLoading(false)
    }
  }, [locationId, addToast, router])

  // Load data on mount
  useEffect(() => {
    if (locationId) {
      loadData()
    }
  }, [locationId, loadData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La descripción es requerida'
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
      const updatedLocation = {
        name: formData.name.trim(),
        address: formData.address.trim()
      }

      await auditedLocationService.update(locationId, updatedLocation)

      addToast({
        type: 'success',
        title: 'Ubicación actualizada exitosamente',
        description: `La ubicación "${formData.name}" ha sido actualizada`
      })

      // Redirect back to locations page
      router.push('/locations')
    } catch (error) {
      console.error('Error updating location:', error)
      addToast({
        type: 'error',
        title: 'Error al actualizar ubicación',
        description: 'No se pudo actualizar la ubicación. Por favor intenta de nuevo.'
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
          <p className="text-gray-600">Cargando datos de la ubicación...</p>
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
            onClick={() => router.push('/locations')}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Ubicaciones
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Editar Ubicación</h2>
            <p className="text-muted-foreground">
              Modifica el nombre y descripción de la ubicación.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Información de la Ubicación
          </CardTitle>
          <CardDescription>
            Actualiza el nombre y descripción de la ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Estante A1, Contenedor B2"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Descripción *
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Descripción del espacio de almacenamiento..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/locations')}
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
                    Actualizar Ubicación
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

export default function EditLocationPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <EditLocationContent />
      </ModalProvider>
    </ToastProvider>
  )
}