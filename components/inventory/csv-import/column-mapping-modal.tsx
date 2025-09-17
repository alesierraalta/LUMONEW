'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Zap,
  Settings
} from 'lucide-react'
import { ImportSession, ColumnMapping, InventoryFieldMapping } from '@/lib/csv-import/types'

interface ColumnMappingModalProps {
  session: ImportSession
  onComplete: () => void
  onBack: () => void
}

const INVENTORY_FIELDS: Array<{
  key: keyof InventoryFieldMapping
  label: string
  description: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'date'
}> = [
  {
    key: 'sku',
    label: 'SKU',
    description: 'Código único del producto',
    required: true,
    type: 'string'
  },
  {
    key: 'name',
    label: 'Nombre',
    description: 'Nombre del producto',
    required: true,
    type: 'string'
  },
  {
    key: 'description',
    label: 'Descripción',
    description: 'Descripción detallada del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'category',
    label: 'Categoría',
    description: 'Categoría del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'location',
    label: 'Ubicación',
    description: 'Ubicación del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'price',
    label: 'Precio',
    description: 'Precio de venta',
    required: false,
    type: 'number'
  },
  {
    key: 'cost',
    label: 'Costo',
    description: 'Costo del producto',
    required: false,
    type: 'number'
  },
  {
    key: 'quantity',
    label: 'Cantidad',
    description: 'Cantidad en stock',
    required: false,
    type: 'number'
  },
  {
    key: 'minStock',
    label: 'Stock Mínimo',
    description: 'Nivel mínimo de stock',
    required: false,
    type: 'number'
  },
  {
    key: 'maxStock',
    label: 'Stock Máximo',
    description: 'Nivel máximo de stock',
    required: false,
    type: 'number'
  },
  {
    key: 'status',
    label: 'Estado',
    description: 'Estado del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'barcode',
    label: 'Código de Barras',
    description: 'Código de barras del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'tags',
    label: 'Etiquetas',
    description: 'Etiquetas del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'supplier',
    label: 'Proveedor',
    description: 'Proveedor del producto',
    required: false,
    type: 'string'
  },
  {
    key: 'notes',
    label: 'Notas',
    description: 'Notas adicionales',
    required: false,
    type: 'string'
  }
]

export function ColumnMappingModal({ session, onComplete, onBack }: ColumnMappingModalProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (session.mappings) {
      setMappings([...session.mappings])
    }
  }, [session.mappings])

  const handleMappingChange = (csvColumn: string, inventoryField: keyof InventoryFieldMapping) => {
    setMappings(prev => prev.map(mapping => 
      mapping.csvColumn === csvColumn
        ? { ...mapping, inventoryField, isMapped: true }
        : mapping
    ))
  }

  const handleUnmap = (csvColumn: string) => {
    setMappings(prev => prev.map(mapping => 
      mapping.csvColumn === csvColumn
        ? { ...mapping, isMapped: false, inventoryField: 'notes' as keyof InventoryFieldMapping }
        : mapping
    ))
  }

  const validateMappings = (): boolean => {
    const errors: string[] = []
    
    // Check for required fields
    const requiredFields = INVENTORY_FIELDS.filter(field => field.required)
    const mappedFields = new Set(mappings.filter(m => m.isMapped).map(m => m.inventoryField))
    
    for (const field of requiredFields) {
      if (!mappedFields.has(field.key)) {
        errors.push(`Campo requerido '${field.label}' no está mapeado`)
      }
    }

    // Check for duplicate mappings
    const fieldCounts: Record<string, number> = {}
    for (const mapping of mappings) {
      if (mapping.isMapped) {
        fieldCounts[mapping.inventoryField] = (fieldCounts[mapping.inventoryField] || 0) + 1
      }
    }

    for (const [field, count] of Object.entries(fieldCounts)) {
      if (count > 1) {
        const fieldLabel = INVENTORY_FIELDS.find(f => f.key === field)?.label || field
        errors.push(`Campo '${fieldLabel}' está mapeado múltiples veces`)
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleComplete = () => {
    if (validateMappings()) {
      // Update session with new mappings
      session.mappings = mappings
      onComplete()
    }
  }

  const getFieldInfo = (fieldKey: keyof InventoryFieldMapping) => {
    return INVENTORY_FIELDS.find(field => field.key === fieldKey)
  }

  const getMappedField = (csvColumn: string) => {
    return mappings.find(m => m.csvColumn === csvColumn)
  }

  const getAvailableFields = (currentColumn: string) => {
    const currentMapping = getMappedField(currentColumn)
    const usedFields = new Set(
      mappings
        .filter(m => m.isMapped && m.csvColumn !== currentColumn)
        .map(m => m.inventoryField)
    )

    return INVENTORY_FIELDS.filter(field => 
      !usedFields.has(field.key) || field.key === currentMapping?.inventoryField
    )
  }

  const getColumnInfo = (column: any) => {
    return {
      dataType: column.dataType,
      sampleValues: column.sampleValues,
      confidence: column.confidence
    }
  }

  const getDataTypeColor = (dataType: string) => {
    const colors: Record<string, string> = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      date: 'bg-orange-100 text-orange-800',
      unknown: 'bg-gray-100 text-gray-800'
    }
    return colors[dataType] || colors.unknown
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const mappedCount = mappings.filter(m => m.isMapped).length
  const totalColumns = mappings.length
  const requiredMappedCount = INVENTORY_FIELDS.filter(f => f.required).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mapeo de Columnas</h3>
          <p className="text-sm text-muted-foreground">
            Mapea las columnas del CSV a los campos del inventario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {mappedCount}/{totalColumns} mapeadas
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Sugerencias
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Column Mappings */}
      <div className="space-y-4">
        {session.data?.columns.map((column, index) => {
          const mapping = getMappedField(column.header)
          const columnInfo = getColumnInfo(column)
          const availableFields = getAvailableFields(column.header)
          const isMapped = mapping?.isMapped || false

          return (
            <Card key={index} className={isMapped ? 'border-green-200 bg-green-50/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{column.header}</h4>
                      <Badge className={getDataTypeColor(columnInfo.dataType)}>
                        {columnInfo.dataType}
                      </Badge>
                      <span className={`text-xs ${getConfidenceColor(columnInfo.confidence)}`}>
                        {Math.round(columnInfo.confidence * 100)}% confianza
                      </span>
                    </div>
                    
                    {columnInfo.sampleValues.length > 0 && (
                      <div className="text-sm text-muted-foreground mb-3">
                        <span className="font-medium">Ejemplos:</span>{' '}
                        {columnInfo.sampleValues.slice(0, 3).join(', ')}
                        {columnInfo.sampleValues.length > 3 && '...'}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Select
                        value={isMapped ? mapping?.inventoryField : ''}
                        onValueChange={(value) => handleMappingChange(column.header, value as keyof InventoryFieldMapping)}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Seleccionar campo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No mapear</SelectItem>
                          {availableFields.map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              <div className="flex items-center gap-2">
                                <span>{field.label}</span>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Requerido
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isMapped && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnmap(column.header)}
                        >
                          Desmapear
                        </Button>
                      )}
                    </div>

                    {isMapped && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {mapping?.inventoryField ? getFieldInfo(mapping.inventoryField)?.description : ''}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sugerencias de Mapeo
            </CardTitle>
            <CardDescription>
              El sistema puede sugerir mapeos automáticos basados en el contenido de las columnas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Las columnas con nombres similares se mapean automáticamente</p>
              <p>• El sistema detecta tipos de datos para sugerir campos apropiados</p>
              <p>• Los campos requeridos (SKU, Nombre) deben estar mapeados</p>
              <p>• Puedes cambiar cualquier mapeo manualmente</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen del Mapeo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Columnas Totales</div>
              <div className="text-2xl font-bold text-primary">{totalColumns}</div>
            </div>
            <div>
              <div className="font-medium">Mapeadas</div>
              <div className="text-2xl font-bold text-green-600">{mappedCount}</div>
            </div>
            <div>
              <div className="font-medium">Campos Requeridos</div>
              <div className="text-2xl font-bold text-blue-600">{requiredMappedCount}</div>
            </div>
            <div>
              <div className="font-medium">Sin Mapear</div>
              <div className="text-2xl font-bold text-gray-600">{totalColumns - mappedCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={validationErrors.length > 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}