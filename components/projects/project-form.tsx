'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

  useEffect(() => {
    register('priority', { required: 'La prioridad es obligatoria' })
  }, [register])

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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Crear Nuevo Proyecto</CardTitle>
        <CardDescription>Complete la información básica del proyecto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Error and Success Messages */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <strong>Error:</strong> {submitError}
              </div>
            </Alert>
          )}
          
          {submitSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="ml-2 text-green-800 dark:text-green-300">
                <strong>¡Éxito!</strong> El proyecto se creó correctamente.
              </div>
            </Alert>
          )}

          {/* Project Name */}
          <div>
            <Label htmlFor="name">Nombre del Proyecto *</Label>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              {...register('name', { required: 'El nombre del proyecto es obligatorio' })}
              placeholder="Ej: Implementación Sistema ERP"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
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
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any, { shouldValidate: true })}
              >
                <SelectTrigger id="priority" aria-invalid={!!errors.priority}>
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-destructive text-sm mt-1">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                aria-invalid={!!errors.startDate}
                {...register('startDate', { required: 'La fecha de inicio es obligatoria' })}
                className={errors.startDate ? 'border-destructive' : ''}
              />
              {errors.startDate && (
                <p className="text-destructive text-sm mt-1">{errors.startDate.message}</p>
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
        
          <CardFooter className="justify-end gap-4 pt-6 border-t p-0">
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
            >
              {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
} 