'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { ProjectFormData } from '@/lib/types'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ProjectForm({ onSubmit, onCancel, loading = false }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProjectFormData>({
    defaultValues: {
      priority: 'medium'
    }
  })

  const handleFormSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)
    
    try {
      console.log('📋 Submitting project form data:', data)
      await onSubmit(data)
      setSubmitSuccess(true)
      console.log('✅ Project created successfully')
    } catch (error) {
      console.error('❌ Error submitting project form:', error)
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido al crear el proyecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Crear Nuevo Proyecto</h2>
        <p className="text-gray-600 mt-1">
          Complete la información básica del proyecto
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Error and Success Messages */}
        {submitError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="ml-2 text-red-800">
              <strong>Error:</strong> {submitError}
            </div>
          </Alert>
        )}
        
        {submitSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="ml-2 text-green-800">
              <strong>¡Éxito!</strong> El proyecto se creó correctamente.
            </div>
          </Alert>
        )}

        {/* Project Name */}
        <div>
          <Label htmlFor="name">Nombre del Proyecto *</Label>
          <Input
            id="name"
            {...register('name', { required: 'El nombre del proyecto es obligatorio' })}
            placeholder="Ej: Implementación Sistema ERP"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descripción detallada del proyecto..."
            rows={3}
          />
        </div>

        {/* Priority and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Prioridad *</Label>
            <select
              id="priority"
              {...register('priority', { required: 'La prioridad es obligatoria' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="startDate">Fecha de Inicio *</Label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate', { required: 'La fecha de inicio es obligatoria' })}
              className={errors.startDate ? 'border-red-500' : ''}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>
        </div>

        {/* Expected End Date */}
        <div>
          <Label htmlFor="expectedEndDate">Fecha Estimada de Finalización</Label>
          <Input
            id="expectedEndDate"
            type="date"
            {...register('expectedEndDate')}
          />
        </div>



        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </div>
      </form>
    </Card>
  )
} 