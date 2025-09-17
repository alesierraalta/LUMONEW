'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Plus, Trash2, Zap, Save, X } from 'lucide-react'
// Removed direct database imports - now using API endpoints
import { useTranslations } from 'next-intl'
import { useModal } from '@/components/ui/modal'

interface BulkItem {
  id: string
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

interface BulkCreateModalProps {
  onSuccess: () => void
  onClose: () => void
}

export const BulkCreateModal = ({ onSuccess, onClose }: BulkCreateModalProps) => {
  const [items, setItems] = useState<BulkItem[]>([
    { id: '1', sku: '', name: '', category_id: '', location_id: '', quantity: '' },
    { id: '2', sku: '', name: '', category_id: '', location_id: '', quantity: '' },
    { id: '3', sku: '', name: '', category_id: '', location_id: '', quantity: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
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
      
      setCategories(categoriesData)
      setLocations(locationsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addRow = () => {
    const newId = (Math.max(...items.map(item => parseInt(item.id))) + 1).toString()
    setItems(prev => [...prev, { id: newId, sku: '', name: '', category_id: '', location_id: '', quantity: '' }])
  }

  const removeRow = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof BulkItem, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, [field]: value, errors: { ...item.errors, [field]: undefined } }
        : item
    ))
  }

  const validateItems = (): boolean => {
    let hasErrors = false
    const updatedItems = items.map(item => {
      const errors: BulkItem['errors'] = {}
      
      if (!item.sku.trim()) {
        errors.sku = t('skuRequired')
        hasErrors = true
      }
      
      if (!item.name.trim()) {
        errors.name = t('nameRequired')
        hasErrors = true
      }
      
      // Category is optional - no validation needed

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

      return { ...item, errors }
    })

    setItems(updatedItems)
    return !hasErrors
  }

  const handleSubmit = async () => {
    if (!validateItems()) {
      addToast({
        type: 'error',
        title: 'Errores de validación',
        description: 'Por favor corrige los errores antes de continuar'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const validItems = items.filter(item =>
        item.sku.trim() && item.name.trim()
      )

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

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const item of validItems) {
        try {
          // Find default category if not provided
          const defaultCategory = categories.find(cat =>
            cat.name.toLowerCase().includes('general') ||
            cat.name.toLowerCase().includes('sin categoría')
          ) || categories[0]

          const response = await fetch('/api/inventory/items?limit=999999', {
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
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`${item.sku}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
      }

      if (successCount > 0) {
        addToast({
          type: 'success',
          title: 'Items creados exitosamente',
          description: `${successCount} items fueron creados correctamente${errorCount > 0 ? `, ${errorCount} fallaron` : ''}`
        })
        
        // Reset form
        setItems([
          { id: '1', sku: '', name: '', category_id: '', location_id: '', quantity: '' },
          { id: '2', sku: '', name: '', category_id: '', location_id: '', quantity: '' },
          { id: '3', sku: '', name: '', category_id: '', location_id: '', quantity: '' }
        ])
        
        onSuccess()
        onClose()
      }

      if (errorCount > 0 && successCount === 0) {
        addToast({
          type: 'error',
          title: 'Error al crear items',
          description: `No se pudieron crear los items. Errores: ${errors.slice(0, 3).join(', ')}`
        })
      }

    } catch (error) {
      console.error('Error in bulk create:', error)
      addToast({
        type: 'error',
        title: 'Error del sistema',
        description: 'Ocurrió un error inesperado al crear los items'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    closeModal()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning-soft">
            <Zap className="h-5 w-5 text-warning-soft" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Creación Rápida Múltiple</h2>
            <p className="text-sm text-muted-foreground">
              Crea múltiples items de inventario simultáneamente con información básica
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
            {isAdvancedMode ? 'Modo avanzado: ON' : 'Modo avanzado: OFF'}
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

      <div className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-info-soft text-info-soft">
                {index + 1}
              </div>
              
              <div className={`flex-1 grid ${isAdvancedMode ? 'grid-cols-5' : 'grid-cols-3'} gap-3`}>
                <div className="space-y-1">
                  <Input
                    placeholder="SKU"
                    value={item.sku}
                    onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                    className={item.errors?.sku ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {item.errors?.sku && (
                    <p className="text-xs text-error-soft">{item.errors.sku}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Input
                    placeholder="Nombre del producto"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className={item.errors?.name ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {item.errors?.name && (
                    <p className="text-xs text-error-soft">{item.errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <select
                    value={item.category_id}
                    onChange={(e) => updateItem(item.id, 'category_id', e.target.value)}
                    className={`w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-ring ${
                      item.errors?.category_id ? 'border-destructive' : 'border-input'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Seleccionar categoría (opcional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {item.errors?.category_id && (
                    <p className="text-xs text-error-soft">{item.errors.category_id}</p>
                  )}
                </div>

                {isAdvancedMode && (
                  <>
                    <div className="space-y-1">
                      <select
                        value={item.location_id || ''}
                        onChange={(e) => updateItem(item.id, 'location_id', e.target.value)}
                        className={`w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-ring ${
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

                    <div className="space-y-1">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Cantidad"
                        value={item.quantity ?? ''}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
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
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow(item.id)}
                disabled={items.length <= 1 || isSubmitting}
                className="flex-shrink-0 text-error-soft hover:bg-error-soft"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={addRow}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Fila
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
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
                  Crear {items.filter(item => item.sku.trim() || item.name.trim()).length} Items
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground bg-info-soft p-3 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Información importante:</p>
          <ul className="space-y-1">
            {isAdvancedMode ? (
              <>
                <li>• Debes seleccionar la ubicación y la cantidad para cada item.</li>
                <li>• La categoría es opcional - se asignará una por defecto si no se especifica.</li>
                <li>• El precio se establecerá en 0; podrás actualizarlo luego.</li>
              </>
            ) : (
              <>
                <li>• Los items se crearán con valores por defecto (stock: 0, precio: 0).</li>
                <li>• La categoría es opcional - se asignará una por defecto si no se especifica.</li>
                <li>• Se asignará automáticamente la ubicación por defecto.</li>
                <li>• Puedes editar los detalles completos después de la creación.</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}