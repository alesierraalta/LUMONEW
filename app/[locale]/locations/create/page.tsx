'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, MapPin } from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast'
import { locationService } from '@/lib/database'

interface FormData {
  name: string
  address: string
}

export default function CreateLocationPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La descripción es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      await locationService.create({
        name: formData.name,
        address: formData.address
      })
      
      addToast({
        type: 'success',
        title: 'Ubicación creada',
        description: 'La ubicación se ha creado exitosamente'
      })
      
      router.push('/locations')
    } catch (error) {
      console.error('Error creating location:', error)
      addToast({
        type: 'error',
        title: 'Error al crear ubicación',
        description: 'No se pudo crear la ubicación. Inténtalo de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
              <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="hover:scale-105 transition-transform"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Crear Ubicación</h2>
                    <p className="text-muted-foreground">
                      Agrega una nueva ubicación de almacenamiento.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="max-w-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Información de la Ubicación
                  </CardTitle>
                  <CardDescription>
                    Completa los datos básicos de la nueva ubicación de almacenamiento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Nombre de la Ubicación <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Ej: Estante A1, Contenedor B2, etc."
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`focus:ring-2 focus:ring-primary/20 transition-all ${
                            errors.name ? 'border-red-500' : ''
                          }`}
                          disabled={isLoading}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">
                          Descripción <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="address"
                          placeholder="Describe la ubicación, características especiales, etc."
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className={`focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] ${
                            errors.address ? 'border-red-500' : ''
                          }`}
                          disabled={isLoading}
                        />
                        {errors.address && (
                          <p className="text-sm text-red-500">{errors.address}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                        className="hover:scale-105 transition-transform"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="hover:scale-105 transition-transform"
                      >
                        {isLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Crear Ubicación
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}