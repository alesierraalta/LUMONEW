'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Plus, Trash2, Zap, Save, X } from 'lucide-react'
import { auditedInventoryService, auditedCategoryService, auditedLocationService } from '@/lib/database-with-audit'
import { useTranslations } from 'next-intl'

interface BulkItem {
  id: string
  sku: string
  name: string
  category_id: string
  errors?: {
    sku?: string
    name?: string
    category_id?: string
  }
}

interface BulkCreateModalProps {
  onSuccess: () => void
  onClose: () => void
}

export const BulkCreateModal = ({ onSuccess, onClose }: BulkCreateModalProps) => {
  const [items, setItems] = useState<BulkItem[]>([
    { id: '1', sku: '', name: '', category_id: '' },
    { id: '2', sku: '', name: '', category_id: '' },
    { id: '3', sku: '', name: '', category_id: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const { addToast } = useToast()
  const t = useTranslations('inventory.bulkCreate')
  const tCommon = useTranslations('common')

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
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addRow = () => {
    const newId = (Math.max(...items.map(item => parseInt(item.id))) + 1).toString()
    setItems(prev => [...prev, { id: newId, sku: '', name: '', category_id: '' }])
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

      // Find default location if not provided
      const defaultLocation = locations.find(loc => 
        loc.name.toLowerCase().includes('general') || 
        loc.name.toLowerCase().includes('sin ubicación')
      ) || locations[0]

      if (!defaultLocation) {
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

          await auditedInventoryService.create({
            sku: item.sku.trim(),
            name: item.name.trim(),
            category_id: item.category_id.trim() || (defaultCategory?.id || ''),
            location_id: defaultLocation.id,
            unit_price: 0,
            quantity: 0,
            min_stock: 0,
            max_stock: 0,
            status: 'active'
          })
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
          { id: '1', sku: '', name: '', category_id: '' },
          { id: '2', sku: '', name: '', category_id: '' },
          { id: '3', sku: '', name: '', category_id: '' }
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
    if (!isSubmitting) {
      setItems([
        { id: '1', sku: '', name: '', category_id: '' },
        { id: '2', sku: '', name: '', category_id: '' },
        { id: '3', sku: '', name: '', category_id: '' }
      ])
      onClose()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Zap className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Creación Rápida Múltiple</h2>
            <p className="text-sm text-gray-600">
              Crea múltiples items de inventario simultáneamente con información básica
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          disabled={isSubmitting}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                {index + 1}
              </div>
              
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Input
                    placeholder="SKU"
                    value={item.sku}
                    onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                    className={item.errors?.sku ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {item.errors?.sku && (
                    <p className="text-xs text-red-500">{item.errors.sku}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Input
                    placeholder="Nombre del producto"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className={item.errors?.name ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {item.errors?.name && (
                    <p className="text-xs text-red-500">{item.errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <select
                    value={item.category_id}
                    onChange={(e) => updateItem(item.id, 'category_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      item.errors?.category_id ? 'border-red-500' : 'border-input'
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
                    <p className="text-xs text-red-500">{item.errors.category_id}</p>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow(item.id)}
                disabled={items.length <= 1 || isSubmitting}
                className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
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
        
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Información importante:</p>
          <ul className="space-y-1">
            <li>• Los items se crearán con valores por defecto (stock: 0, precio: 0)</li>
            <li>• La categoría es opcional - se asignará una por defecto si no se especifica</li>
            <li>• Se asignará automáticamente la ubicación por defecto</li>
            <li>• Puedes editar los detalles completos después de la creación</li>
          </ul>
        </div>
      </div>
    </div>
  )
}