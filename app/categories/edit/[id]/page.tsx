'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Tag } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth/auth-context'
import { auditedCategoryService } from '@/lib/database-with-audit'
import { LoadingSpinner } from '@/components/ui/loading'

interface FormData {
  name: string
  description: string
  color: string
}

interface FormErrors {
  [key: string]: string
}

function EditCategoryContent() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()
  const { user } = useAuth()
  const categoryId = params.id as string
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    color: '#6B7280'
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Predefined color options
  const colorOptions = [
    { value: '#EF4444', label: 'Rojo' },
    { value: '#F97316', label: 'Naranja' },
    { value: '#EAB308', label: 'Amarillo' },
    { value: '#22C55E', label: 'Verde' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Gris' },
    { value: '#0F172A', label: 'Negro' },
    { value: '#DC2626', label: 'Rojo Oscuro' },
    { value: '#059669', label: 'Verde Oscuro' },
    { value: '#1D4ED8', label: 'Azul Oscuro' }
  ]

  // Load category data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const categoryData = await auditedCategoryService.getById(categoryId)

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
        color: categoryData.color || '#6B7280'
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

    // Color validation
    if (!formData.color || !formData.color.match(/^#[0-9A-F]{6}$/i)) {
      newErrors.color = 'El color debe ser un código hexadecimal válido'
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
        description: formData.description.trim() || undefined,
        color: formData.color
      }

      await auditedCategoryService.update(categoryId, updatedCategory)

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
              Modifica la información de la categoría seleccionada.
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
            Actualiza los campos necesarios para modificar la categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="Ej: Electrónicos"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-medium text-gray-700">
                  Color *
                </label>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <select
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.color ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.color && (
                  <p className="text-sm text-red-600">{errors.color}</p>
                )}
              </div>
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
                placeholder="Descripción de la categoría..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Vista previa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Vista Previa
              </label>
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {formData.name || 'Nombre de la categoría'}
                    </div>
                    {formData.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {formData.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <EditCategoryContent />
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}