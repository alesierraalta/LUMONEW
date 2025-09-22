'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Tag } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth/auth-context'
import { categoryService } from '@/lib/database'
import { LoadingSpinner } from '@/components/ui/loading'

interface FormData {
  name: string
  description: string
  color: string
}

interface FormErrors {
  [key: string]: string
}

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue', bgColor: 'bg-blue-500' },
  { value: '#10B981', label: 'Green', bgColor: 'bg-green-500' },
  { value: '#F59E0B', label: 'Yellow', bgColor: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Red', bgColor: 'bg-red-500' },
  { value: '#8B5CF6', label: 'Purple', bgColor: 'bg-purple-500' },
  { value: '#06B6D4', label: 'Cyan', bgColor: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lime', bgColor: 'bg-lime-500' },
  { value: '#F97316', label: 'Orange', bgColor: 'bg-orange-500' },
]

function EditCategoryContent() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()
  const { user } = useAuth()
  const categoryId = params.id as string
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load category data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const categoryData = await categoryService.getById(categoryId)

      if (!categoryData) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'No se pudo encontrar la categoría solicitada'
        })
        router.push('/categories')
        return
      }

      // Populate form with existing data
      setFormData({
        name: categoryData.name || '',
        description: categoryData.description || '',
        color: categoryData.color || '#3B82F6'
      })
    } catch (error) {
      console.error('Error loading data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar los datos de la categoría'
      })
      router.push('/categories')
    } finally {
      setIsLoading(false)
    }
  }, [categoryId, addToast, router])

  // Load data on mount
  useEffect(() => {
    if (categoryId) {
      loadData()
    }
  }, [categoryId, loadData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (formData.name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres'
    }

    if (formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres'
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
      const updatedCategory = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      }

      await categoryService.update(categoryId, updatedCategory)

      addToast({
        type: 'success',
        title: 'Categoría actualizada exitosamente',
        description: `La categoría "${formData.name}" ha sido actualizada`
      })

      // Redirect back to categories page
      router.push('/categories')
    } catch (error) {
      console.error('Error updating category:', error)
      addToast({
        type: 'error',
        title: 'Error al actualizar categoría',
        description: 'No se pudo actualizar la categoría. Por favor intenta de nuevo.'
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
          <p className="text-gray-600">Cargando datos de la categoría...</p>
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
            onClick={() => router.push('/categories')}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Categorías
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Editar Categoría</h2>
            <p className="text-muted-foreground">
              Modifica el nombre, descripción y color de la categoría.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="mr-2 h-5 w-5" />
            Información de la Categoría
          </CardTitle>
          <CardDescription>
            Actualiza el nombre, descripción y color de la categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nombre de la Categoría *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Electronics, Equipment, Software"
                className={errors.name ? 'border-red-500' : ''}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción opcional de la categoría..."
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Color de la Categoría
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleInputChange('color', color.value)}
                    className={`
                      relative w-full h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105
                      ${formData.color === color.value 
                        ? 'border-gray-900 shadow-lg ring-2 ring-gray-300' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${color.bgColor}
                    `}
                    title={color.label}
                  >
                    {formData.color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Color seleccionado: {COLOR_OPTIONS.find(c => c.value === formData.color)?.label}
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/categories')}
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
                    Actualizar Categoría
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

export default function EditCategoryPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <EditCategoryContent />
      </ModalProvider>
    </ToastProvider>
  )
}