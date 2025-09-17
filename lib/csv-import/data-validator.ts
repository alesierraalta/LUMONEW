// ============================================================================
// DATA VALIDATION ENGINE FOR CSV IMPORT
// ============================================================================

import { 
  InventoryFieldMapping, 
  ImportError, 
  ImportWarning, 
  ImportPreview,
  ColumnMapping,
  CSVImportData,
  ColumnMappingRule
} from './types'

export class DataValidator {
  private mappingRules: Map<keyof InventoryFieldMapping, ColumnMappingRule>

  constructor(mappingRules: ColumnMappingRule[]) {
    this.mappingRules = new Map()
    for (const rule of mappingRules) {
      this.mappingRules.set(rule.field, rule)
    }
  }

  /**
   * Validate all data and create import preview
   */
  validateData(
    csvData: CSVImportData,
    mappings: ColumnMapping[],
    defaultValues: Partial<InventoryFieldMapping> = {}
  ): ImportPreview {
    const errors: ImportError[] = []
    const warnings: ImportWarning[] = []
    const mappedData: Partial<InventoryFieldMapping>[] = []

    // Create field mapping lookup
    const fieldMapping = new Map<string, ColumnMapping>()
    for (const mapping of mappings) {
      if (mapping.isMapped) {
        fieldMapping.set(mapping.csvColumn, mapping)
      }
    }

    // Validate each row
    for (let rowIndex = 0; rowIndex < csvData.rows.length; rowIndex++) {
      const row = csvData.rows[rowIndex]
      const rowData: Partial<InventoryFieldMapping> = { ...defaultValues }
      const rowErrors: ImportError[] = []
      const rowWarnings: ImportWarning[] = []

      // Process each column in the row
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex] || ''
        const column = csvData.columns[colIndex]
        
        if (!column) continue

        const mapping = fieldMapping.get(column.header)
        if (!mapping || !mapping.isMapped) continue

        const field = mapping.inventoryField
        const rule = this.mappingRules.get(field)

        // Transform value if transformation function exists
        let transformedValue = cellValue
        if (mapping.transformation) {
          try {
            transformedValue = mapping.transformation(cellValue)
          } catch (error) {
            rowErrors.push({
              row: rowIndex + 1,
              field,
              value: cellValue,
              message: `Error en transformación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              severity: 'error'
            })
            continue
          }
        }

        // Validate the transformed value
        const validation = this.validateFieldValue(field, transformedValue, rule)
        
        if (!validation.isValid) {
          rowErrors.push({
            row: rowIndex + 1,
            field,
            value: cellValue,
            message: validation.message || 'Valor inválido',
            severity: 'error',
            suggestion: validation.suggestion
          })
        } else {
          // Add warnings for potential issues
          if (validation.warning) {
            rowWarnings.push({
              row: rowIndex + 1,
              field,
              value: cellValue,
              message: validation.warning,
              suggestion: validation.suggestion
            })
          }

          // Set the validated value
          (rowData as any)[field] = transformedValue
        }
      }

      // Add row-level validations
      this.validateRowLevel(rowData, rowIndex + 1, rowErrors, rowWarnings)

      // Add errors and warnings to the main arrays
      errors.push(...rowErrors)
      warnings.push(...rowWarnings)

      // Add row data if it has at least the required fields
      if (this.hasRequiredFields(rowData)) {
        mappedData.push(rowData)
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(csvData, mappings, errors, warnings)

    return {
      mappedData,
      errors,
      warnings,
      statistics
    }
  }

  /**
   * Validate individual field value
   */
  private validateFieldValue(
    field: keyof InventoryFieldMapping,
    value: any,
    rule?: ColumnMappingRule
  ): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    // Check if value is empty for required fields
    if (rule?.required && this.isEmpty(value)) {
      return {
        isValid: false,
        message: `El campo '${field}' es requerido`,
        suggestion: 'Proporcione un valor para este campo'
      }
    }

    // Skip validation for empty optional fields
    if (this.isEmpty(value) && !rule?.required) {
      return { isValid: true }
    }

    // Use custom validation if available
    if (rule?.validation) {
      try {
        const result = rule.validation(String(value))
        if (!result.isValid) {
          return {
            isValid: false,
            message: result.message,
            suggestion: this.getFieldSuggestion(field)
          }
        }
      } catch (error) {
        return {
          isValid: false,
          message: `Error en validación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          suggestion: 'Verifique el formato del valor'
        }
      }
    }

    // Apply field-specific validations
    return this.validateFieldSpecific(field, value)
  }

  /**
   * Field-specific validation logic
   */
  private validateFieldSpecific(
    field: keyof InventoryFieldMapping,
    value: any
  ): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    switch (field) {
      case 'sku':
        return this.validateSKU(value)
      
      case 'name':
        return this.validateName(value)
      
      case 'price':
        return this.validatePrice(value)
      
      case 'cost':
        return this.validateCost(value)
      
      case 'quantity':
        return this.validateQuantity(value)
      
      case 'minStock':
        return this.validateMinStock(value)
      
      case 'maxStock':
        return this.validateMaxStock(value)
      
      case 'status':
        return this.validateStatus(value)
      
      case 'barcode':
        return this.validateBarcode(value)
      
      case 'category':
        return this.validateCategory(value)
      
      case 'location':
        return this.validateLocation(value)
      
      default:
        return { isValid: true }
    }
  }

  /**
   * Validate SKU field
   */
  private validateSKU(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const sku = String(value).trim()
    
    if (sku.length === 0) {
      return {
        isValid: false,
        message: 'SKU es requerido',
        suggestion: 'Proporcione un código SKU único'
      }
    }

    if (sku.length > 50) {
      return {
        isValid: false,
        message: 'SKU es demasiado largo (máximo 50 caracteres)',
        suggestion: 'Use un SKU más corto'
      }
    }

    if (!/^[A-Za-z0-9\-_]+$/.test(sku)) {
      return {
        isValid: false,
        message: 'SKU contiene caracteres inválidos',
        suggestion: 'Use solo letras, números, guiones y guiones bajos'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate name field
   */
  private validateName(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const name = String(value).trim()
    
    if (name.length === 0) {
      return {
        isValid: false,
        message: 'El nombre del producto es requerido',
        suggestion: 'Proporcione un nombre descriptivo'
      }
    }

    if (name.length > 200) {
      return {
        isValid: false,
        message: 'El nombre es demasiado largo (máximo 200 caracteres)',
        suggestion: 'Use un nombre más corto'
      }
    }

    if (name.length < 2) {
      return {
        isValid: true,
        warning: 'El nombre es muy corto',
        suggestion: 'Considere usar un nombre más descriptivo'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate price field
   */
  private validatePrice(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const price = parseFloat(String(value).replace(/[,$]/g, ''))
    
    if (isNaN(price)) {
      return {
        isValid: false,
        message: 'El precio debe ser un número válido',
        suggestion: 'Use formato numérico (ej: 10.50)'
      }
    }

    if (price < 0) {
      return {
        isValid: false,
        message: 'El precio no puede ser negativo',
        suggestion: 'Use un precio mayor o igual a 0'
      }
    }

    if (price > 1000000) {
      return {
        isValid: true,
        warning: 'El precio es muy alto',
        suggestion: 'Verifique que el precio sea correcto'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate cost field
   */
  private validateCost(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const cost = parseFloat(String(value).replace(/[,$]/g, ''))
    
    if (isNaN(cost)) {
      return {
        isValid: false,
        message: 'El costo debe ser un número válido',
        suggestion: 'Use formato numérico (ej: 5.25)'
      }
    }

    if (cost < 0) {
      return {
        isValid: false,
        message: 'El costo no puede ser negativo',
        suggestion: 'Use un costo mayor o igual a 0'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate quantity field
   */
  private validateQuantity(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const quantity = parseInt(String(value), 10)
    
    if (isNaN(quantity)) {
      return {
        isValid: false,
        message: 'La cantidad debe ser un número entero',
        suggestion: 'Use un número entero (ej: 10)'
      }
    }

    if (quantity < 0) {
      return {
        isValid: false,
        message: 'La cantidad no puede ser negativa',
        suggestion: 'Use una cantidad mayor o igual a 0'
      }
    }

    if (quantity > 100000) {
      return {
        isValid: true,
        warning: 'La cantidad es muy alta',
        suggestion: 'Verifique que la cantidad sea correcta'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate minimum stock field
   */
  private validateMinStock(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const minStock = parseInt(String(value), 10)
    
    if (isNaN(minStock)) {
      return {
        isValid: false,
        message: 'El stock mínimo debe ser un número entero',
        suggestion: 'Use un número entero (ej: 5)'
      }
    }

    if (minStock < 0) {
      return {
        isValid: false,
        message: 'El stock mínimo no puede ser negativo',
        suggestion: 'Use un valor mayor o igual a 0'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate maximum stock field
   */
  private validateMaxStock(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const maxStock = parseInt(String(value), 10)
    
    if (isNaN(maxStock)) {
      return {
        isValid: false,
        message: 'El stock máximo debe ser un número entero',
        suggestion: 'Use un número entero (ej: 100)'
      }
    }

    if (maxStock < 0) {
      return {
        isValid: false,
        message: 'El stock máximo no puede ser negativo',
        suggestion: 'Use un valor mayor o igual a 0'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate status field
   */
  private validateStatus(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const status = String(value).toLowerCase().trim()
    const validStatuses = ['active', 'activo', 'inactive', 'inactivo', 'discontinued', 'descontinuado']
    
    if (!validStatuses.includes(status)) {
      return {
        isValid: false,
        message: 'Estado inválido',
        suggestion: 'Use: active, inactive, o discontinued'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate barcode field
   */
  private validateBarcode(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const barcode = String(value).trim()
    
    if (barcode.length === 0) {
      return { isValid: true } // Barcode is optional
    }

    if (!/^[0-9]+$/.test(barcode)) {
      return {
        isValid: false,
        message: 'El código de barras debe contener solo números',
        suggestion: 'Use solo dígitos numéricos'
      }
    }

    if (barcode.length < 8 || barcode.length > 14) {
      return {
        isValid: true,
        warning: 'Longitud de código de barras inusual',
        suggestion: 'Verifique que el código de barras sea correcto'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate category field
   */
  private validateCategory(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const category = String(value).trim()
    
    if (category.length === 0) {
      return { isValid: true } // Category is optional
    }

    if (category.length > 100) {
      return {
        isValid: false,
        message: 'El nombre de categoría es demasiado largo',
        suggestion: 'Use un nombre de categoría más corto'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate location field
   */
  private validateLocation(value: any): {
    isValid: boolean
    message?: string
    warning?: string
    suggestion?: string
  } {
    const location = String(value).trim()
    
    if (location.length === 0) {
      return { isValid: true } // Location is optional
    }

    if (location.length > 100) {
      return {
        isValid: false,
        message: 'El nombre de ubicación es demasiado largo',
        suggestion: 'Use un nombre de ubicación más corto'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate row-level constraints
   */
  private validateRowLevel(
    rowData: Partial<InventoryFieldMapping>,
    rowIndex: number,
    errors: ImportError[],
    warnings: ImportWarning[]
  ): void {
    // Check if cost is greater than price
    if (rowData.cost && rowData.price && rowData.cost > rowData.price) {
      warnings.push({
        row: rowIndex,
        field: 'cost',
        value: String(rowData.cost),
        message: 'El costo es mayor que el precio',
        suggestion: 'Verifique los valores de costo y precio'
      })
    }

    // Check if min stock is greater than max stock
    if (rowData.minStock && rowData.maxStock && rowData.minStock > rowData.maxStock) {
      errors.push({
        row: rowIndex,
        field: 'minStock',
        value: String(rowData.minStock),
        message: 'El stock mínimo no puede ser mayor que el stock máximo',
        severity: 'error',
        suggestion: 'Ajuste los valores de stock mínimo y máximo'
      })
    }

    // Check if quantity is less than min stock
    if (rowData.quantity !== undefined && rowData.minStock && rowData.quantity < rowData.minStock) {
      warnings.push({
        row: rowIndex,
        field: 'quantity',
        value: String(rowData.quantity),
        message: 'La cantidad actual es menor que el stock mínimo',
        suggestion: 'Considere ajustar la cantidad o el stock mínimo'
      })
    }
  }

  /**
   * Check if row has required fields
   */
  private hasRequiredFields(rowData: Partial<InventoryFieldMapping>): boolean {
    const requiredFields: (keyof InventoryFieldMapping)[] = ['sku', 'name']
    
    for (const field of requiredFields) {
      if (this.isEmpty(rowData[field])) {
        return false
      }
    }
    
    return true
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || String(value).trim() === ''
  }

  /**
   * Get field-specific suggestion
   */
  private getFieldSuggestion(field: keyof InventoryFieldMapping): string {
    const suggestions: Record<keyof InventoryFieldMapping, string> = {
      sku: 'Use un código único alfanumérico',
      name: 'Proporcione un nombre descriptivo',
      description: 'Agregue una descripción detallada',
      category: 'Seleccione una categoría existente',
      location: 'Seleccione una ubicación existente',
      price: 'Use formato numérico (ej: 10.50)',
      cost: 'Use formato numérico (ej: 5.25)',
      quantity: 'Use un número entero (ej: 10)',
      minStock: 'Use un número entero (ej: 5)',
      maxStock: 'Use un número entero (ej: 100)',
      status: 'Use: active, inactive, o discontinued',
      barcode: 'Use solo dígitos numéricos',
      tags: 'Separe múltiples etiquetas con comas',
      supplier: 'Proporcione el nombre del proveedor',
      notes: 'Agregue notas adicionales'
    }
    
    return suggestions[field] || 'Verifique el formato del valor'
  }

  /**
   * Calculate import statistics
   */
  private calculateStatistics(
    csvData: CSVImportData,
    mappings: ColumnMapping[],
    errors: ImportError[],
    warnings: ImportWarning[]
  ): {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
    mappedFields: number
    unmappedFields: number
    estimatedImportTime: number
  } {
    const totalRows = csvData.totalRows
    const errorRows = new Set(errors.map(e => e.row)).size
    const warningRows = new Set(warnings.map(w => w.row)).size
    const validRows = totalRows - errorRows
    
    const mappedFields = mappings.filter(m => m.isMapped).length
    const unmappedFields = mappings.length - mappedFields
    
    // Estimate import time (rough calculation)
    const estimatedImportTime = Math.max(1, Math.ceil(totalRows / 100))

    return {
      totalRows,
      validRows,
      errorRows,
      warningRows,
      mappedFields,
      unmappedFields,
      estimatedImportTime
    }
  }
}