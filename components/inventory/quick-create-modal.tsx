'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Plus, Zap, Save, X, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useModal } from '@/components/ui/modal'

interface QuickItem {
  sku: string
  name: string
  category_id: string
  location_id?: string
  quantity?: string
  errors?: {
    sku?: string
    name?: string
    category_id?: string
    location_id?: string
    quantity?: string
  }
}

interface QuickCreateModalProps {
  onSuccess: () => void
  onClose: () => void
}

export const QuickCreateModal = ({ onSuccess, onClose }: QuickCreateModalProps) => {
  const [item, setItem] = useState<QuickItem>({
    sku: '',
    name: '',
    category_id: '',
    location_id: '',
    quantity: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)
  const { addToast } = useToast()
  const { closeModal } = useModal()
  const t = useTranslations('inventory.bulkCreate')
  const tCommon = useTranslations('common')

  // Load categories and locations
  const loadData = useCallback(async () => {
    try {
      const [categoriesResponse, locationsResponse] = await Promise.all([
        fetch('/api/categories/items'),
        fetch('/api/locations/items')
      ])

      if (!categoriesResponse.ok || !locationsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [categoriesData, locationsData] = await Promise.all([
        categoriesResponse.json(),
        locationsResponse.json()
      ])

      setCategories(categoriesData || [])
      setLocations(locationsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setCategories([])
      setLocations([])
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const clearItem = () => {
    setItem({
      sku: '',
      name: '',
      category_id: '',
      location_id: '',
      quantity: ''
    })
  }

  const updateItem = (field: keyof QuickItem, value: string) => {
    setItem(prev => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined }
    }))
  }

  const validateItem = (): boolean => {
    const errors: QuickItem['errors'] = {}
    let hasErrors = false
    
    if (!item.sku.trim()) {
      errors.sku = 'El SKU es requerido'
      hasErrors = true
    }
    
    if (!item.name.trim()) {
      errors.name = 'El nombre es requerido'
      hasErrors = true
    }

    if (isAdvancedMode) {
      if (!item.location_id || !item.location_id.trim()) {
        errors.location_id = 'Selecciona una ubicación'
        hasErrors = true
      }
      const quantityValue = (item.quantity ?? '').trim()
      if (quantityValue === '') {
        errors.quantity = 'Ingresa una cantidad'
        hasErrors = true
      } else {
        const parsed = Number.parseInt(quantityValue, 10)
        if (Number.isNaN(parsed) || parsed < 0) {
          errors.quantity = 'La cantidad debe ser un número entero mayor o igual a 0'
          hasErrors = true
        }
      }
    }

    setItem(prev => ({ ...prev, errors }))
    return !hasErrors
  }

  const createItem = async () => {
    if (!validateItem()) {
      addToast({
        type: 'error',
        title: 'Errores de validación',
        description: 'Por favor corrige los errores antes de continuar'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Find default location if not provided (basic mode)
      const defaultLocation = locations.find(loc => 
        loc.name.toLowerCase().includes('general') || 
        loc.name.toLowerCase().includes('sin ubicación')
      ) || locations[0]

      if (!defaultLocation && !isAdvancedMode) {
        addToast({
          type: 'error',
          title: 'Error',
          description: 'No hay ubicaciones disponibles. Por favor crea una ubicación primero.'
        })
        return
      }

      // Find default category if not provided
      const defaultCategory = categories.find(cat =>
        cat.name.toLowerCase().includes('general') ||
        cat.name.toLowerCase().includes('sin categoría')
      ) || categories[0]

      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku: item.sku.trim(),
          name: item.name.trim(),
          category_id: item.category_id.trim() || (defaultCategory?.id || ''),
          location_id: isAdvancedMode ? (item.location_id || '') : (defaultLocation?.id || ''),
          unit_price: 0,
          quantity: isAdvancedMode ? Number.parseInt(item.quantity || '0', 10) || 0 : 0,
          min_stock: 0,
          max_stock: 0,
          status: 'active'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create item')
      }

      // Success!
      setCreatedCount(prev => prev + 1)
      addToast({
        type: 'success',
        title: 'Item creado exitosamente',
        description: `${item.sku} - ${item.name} fue creado correctamente`
      })
      
      // Clear form for next item
      clearItem()
      onSuccess()
      
    } catch (error) {
      console.error('Error creating item:', error)
      addToast({
        type: 'error',
        title: 'Error al crear item',
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    closeModal()
  }

  const handleCreateAndContinue = () => {
    createItem()
  }

  const handleCreateAndClose = async () => {
    await createItem()
    if (!isSubmitting) {
      handleClose()
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning-soft">
            <Zap className="h-5 w-5 text-warning-soft" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Creación Rápida</h2>
            <p className="text-sm text-muted-foreground">
              {createdCount > 0 
                ? `${createdCount} items creados - Agrega otro item` 
                : 'Crea un item de inventario rápidamente'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isAdvancedMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAdvancedMode(prev => !prev)}
            disabled={isSubmitting || locations.length === 0}
            title={locations.length === 0 ? 'No hay ubicaciones disponibles' : 'Activar modo avanzado'}
          >
            {isAdvancedMode ? 'Avanzado' : 'Básico'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Item Form */}
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className={`grid ${isAdvancedMode ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
            {/* SKU */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">SKU *</label>
              <Input
                placeholder="Ej: PROD-001"
                value={item.sku}
                onChange={(e) => updateItem('sku', e.target.value)}
                className={item.errors?.sku ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {item.errors?.sku && (
                <p className="text-xs text-error-soft">{item.errors.sku}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                placeholder="Ej: Producto Ejemplo"
                value={item.name}
                onChange={(e) => updateItem('name', e.target.value)}
                className={item.errors?.name ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {item.errors?.name && (
                <p className="text-xs text-error-soft">{item.errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Categoría (opcional)</label>
              <select
                value={item.category_id}
                onChange={(e) => updateItem('category_id', e.target.value)}
                className={`w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 bg-background text-foreground focus:ring-ring focus:border-ring ${
                  item.errors?.category_id ? 'border-destructive' : 'border-input'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {isAdvancedMode && (
              <>
                {/* Location */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Ubicación *</label>
                  <select
                    value={item.location_id || ''}
                    onChange={(e) => updateItem('location_id', e.target.value)}
                    className={`w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 bg-background text-foreground focus:ring-ring focus:border-ring ${
                      item.errors?.location_id ? 'border-destructive' : 'border-input'
                    }`}
                    disabled={isSubmitting || locations.length === 0}
                  >
                    <option value="">Seleccionar ubicación</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {item.errors?.location_id && (
                    <p className="text-xs text-error-soft">{item.errors.location_id}</p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Cantidad *</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={item.quantity ?? ''}
                    onChange={(e) => updateItem('quantity', e.target.value)}
                    className={item.errors?.quantity ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {item.errors?.quantity && (
                    <p className="text-xs text-error-soft">{item.errors.quantity}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {createdCount > 0 && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success-soft" />
                {createdCount} items creados
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {createdCount > 0 ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            <Button
              onClick={handleCreateAndContinue}
              disabled={isSubmitting || !item.sku.trim() || !item.name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear y Continuar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-info-soft p-3 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Información:</p>
          <ul className="space-y-1">
            {isAdvancedMode ? (
              <>
                <li>• Campos obligatorios: SKU, Nombre, Ubicación, Cantidad</li>
                <li>• La categoría es opcional</li>
                <li>• El precio se establecerá en 0</li>
              </>
            ) : (
              <>
                <li>• Campos obligatorios: SKU y Nombre</li>
                <li>• Se asignarán valores por defecto (stock: 0, precio: 0)</li>
                <li>• Se usará la ubicación por defecto</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}