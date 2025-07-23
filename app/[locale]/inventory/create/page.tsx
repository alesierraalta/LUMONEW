 'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Package } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth/auth-context'
import { auditedInventoryService, auditedCategoryService, auditedLocationService } from '@/lib/database-with-audit'
import { InventoryItem } from '@/lib/types'

interface FormData {
  sku: string
  name: string
  description: string
  category_id: string
  location_id: string
  unit_price: string
  quantity: string
  min_stock: string
  max_stock: string
  unit_of_measure: string
  supplier: string
  barcode: string
}

interface FormErrors {
  [key: string]: string
}

function CreateInventoryItemContent() {
  const router = useRouter()
  const { addToast } = useToast()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    location_id: '',
    unit_price: '',
    quantity: '',
    min_stock: '',
    max_stock: '',
    unit_of_measure: 'unidad',
    supplier: '',
    barcode: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  // Load categories and locations
  const loadData = useCallback(async () => {
    try {
      const [categoriesData, locationsData] = await Promise.all([
        auditedCategoryService.getAll(),
        auditedLocationService.getAll()
      ])
      setCategories(categoriesData)
      setLocations(locationsData)
    } catch (error) {
      console.error('Error loading data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar las categorías y ubicaciones'
      })
    }
  }, [addToast])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    // Category is now optional - no validation needed

    // Location is now optional - no validation needed

    // Unit price is now optional - only validate if provided
    if (formData.unit_price.trim()) {
      const price = parseFloat(formData.unit_price)
      if (isNaN(price) || price < 0) {
        newErrors.unit_price = 'El precio debe ser un número válido mayor o igual a 0'
      }
    }

    // Quantity is now optional - only validate if provided
    if (formData.quantity.trim()) {
      const quantity = parseInt(formData.quantity)
      if (isNaN(quantity) || quantity < 0) {
        newErrors.quantity = 'La cantidad debe ser un número entero mayor o igual a 0'
      }
    }

    // Min stock is now optional - only validate if provided
    if (formData.min_stock.trim()) {
      const minStock = parseInt(formData.min_stock)
      if (isNaN(minStock) || minStock < 0) {
        newErrors.min_stock = 'El stock mínimo debe ser un número entero mayor o igual a 0'
      }
    }

    if (formData.max_stock.trim()) {
      const maxStock = parseInt(formData.max_stock)
      const minStock = parseInt(formData.min_stock)
      if (isNaN(maxStock) || maxStock < 0) {
        newErrors.max_stock = 'El stock máximo debe ser un número entero mayor o igual a 0'
      } else if (formData.min_stock.trim() && !isNaN(minStock) && maxStock < minStock) {
        newErrors.max_stock = 'El stock máximo debe ser mayor o igual al stock mínimo'
      }
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
      // Find default category and location if not provided
      const defaultCategory = categories.find(cat => cat.name.toLowerCase().includes('general') || cat.name.toLowerCase().includes('sin categoría')) || categories[0]
      const defaultLocation = locations.find(loc => loc.name.toLowerCase().includes('general') || loc.name.toLowerCase().includes('sin ubicación')) || locations[0]

      const inventoryItem = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category_id: formData.category_id || (defaultCategory?.id || ''),
        location_id: formData.location_id || (defaultLocation?.id || ''),
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : 0,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
        max_stock: formData.max_stock ? parseInt(formData.max_stock) : (formData.min_stock ? parseInt(formData.min_stock) * 2 : 0),
        status: 'active'
      }

      // Validate that we have required IDs
      if (!inventoryItem.category_id) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'No hay categorías disponibles. Por favor crea una categoría primero.'
        })
        return
      }

      if (!inventoryItem.location_id) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'No hay ubicaciones disponibles. Por favor crea una ubicación primero.'
        })
        return
      }

      await auditedInventoryService.create(inventoryItem)

      addToast({
        type: 'success',
        title: 'Item creado exitosamente',
        description: `El item "${formData.name}" ha sido agregado al inventario`
      })

      // Redirect back to inventory page
      router.push('/inventory')
    } catch (error) {
      console.error('Error creating inventory item:', error)
      addToast({
        type: 'error',
        title: 'Error al crear item',
        description: 'No se pudo crear el item de inventario. Por favor intenta de nuevo.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/inventory')}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inventario
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agregar Item al Inventario</h2>
            <p className="text-muted-foreground">
              Crea un nuevo item para el inventario con toda la información necesaria.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Información del Item
          </CardTitle>
          <CardDescription>
            Completa todos los campos requeridos para agregar el nuevo item al inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU */}
              <div className="space-y-2">
                <label htmlFor="sku" className="text-sm font-medium">
                  SKU *
                </label>
                <Input
                  id="sku"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Ej: PROD-001"
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && (
                  <p className="text-sm text-red-600">{errors.sku}</p>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre del Producto *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Laptop Dell Inspiron"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <label htmlFor="category_id" className="text-sm font-medium">
                  Categoría
                </label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category_id ? 'border-red-500' : 'border-input'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-sm text-red-600">{errors.category_id}</p>
                )}
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <label htmlFor="location_id" className="text-sm font-medium">
                  Ubicación
                </label>
                <select
                  id="location_id"
                  value={formData.location_id}
                  onChange={(e) => handleInputChange('location_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.location_id ? 'border-red-500' : 'border-input'
                  }`}
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.location_id && (
                  <p className="text-sm text-red-600">{errors.location_id}</p>
                )}
              </div>

              {/* Precio Unitario */}
              <div className="space-y-2">
                <label htmlFor="unit_price" className="text-sm font-medium">
                  Precio Unitario ($)
                </label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', e.target.value)}
                  placeholder="0.00"
                  className={errors.unit_price ? 'border-red-500' : ''}
                />
                {errors.unit_price && (
                  <p className="text-sm text-red-600">{errors.unit_price}</p>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Cantidad Inicial
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="0"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

              {/* Stock Mínimo */}
              <div className="space-y-2">
                <label htmlFor="min_stock" className="text-sm font-medium">
                  Stock Mínimo
                </label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => handleInputChange('min_stock', e.target.value)}
                  placeholder="0"
                  className={errors.min_stock ? 'border-red-500' : ''}
                />
                {errors.min_stock && (
                  <p className="text-sm text-red-600">{errors.min_stock}</p>
                )}
              </div>

              {/* Stock Máximo */}
              <div className="space-y-2">
                <label htmlFor="max_stock" className="text-sm font-medium">
                  Stock Máximo
                </label>
                <Input
                  id="max_stock"
                  type="number"
                  min="0"
                  value={formData.max_stock}
                  onChange={(e) => handleInputChange('max_stock', e.target.value)}
                  placeholder="0"
                  className={errors.max_stock ? 'border-red-500' : ''}
                />
                {errors.max_stock && (
                  <p className="text-sm text-red-600">{errors.max_stock}</p>
                )}
              </div>

              {/* Unidad de Medida */}
              <div className="space-y-2">
                <label htmlFor="unit_of_measure" className="text-sm font-medium">
                  Unidad de Medida
                </label>
                <select
                  id="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="g">Gramo</option>
                  <option value="l">Litro</option>
                  <option value="ml">Mililitro</option>
                  <option value="m">Metro</option>
                  <option value="cm">Centímetro</option>
                  <option value="caja">Caja</option>
                  <option value="paquete">Paquete</option>
                </select>
              </div>

              {/* Proveedor */}
              <div className="space-y-2">
                <label htmlFor="supplier" className="text-sm font-medium">
                  Proveedor
                </label>
                <Input
                  id="supplier"
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Ej: Proveedor ABC"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descripción
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción detallada del producto..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background"
              />
            </div>

            {/* Código de Barras */}
            <div className="space-y-2">
              <label htmlFor="barcode" className="text-sm font-medium">
                Código de Barras
              </label>
              <Input
                id="barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Ej: 1234567890123"
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/inventory')}
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Item
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

export default function CreateInventoryItemPage() {
  const { user } = useAuth()
  
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CreateInventoryItemContent />
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}