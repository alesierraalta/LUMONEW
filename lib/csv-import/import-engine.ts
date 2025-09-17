// ============================================================================
// CSV IMPORT ENGINE
// ============================================================================

import { 
  InventoryFieldMapping, 
  ImportResult, 
  ImportProgress, 
  ImportError, 
  ImportWarning,
  ImportPreview,
  CSVImportConfig
} from './types'

export class ImportEngine {
  private config: CSVImportConfig
  private onProgress?: (progress: ImportProgress) => void

  constructor(config: CSVImportConfig, onProgress?: (progress: ImportProgress) => void) {
    this.config = config
    this.onProgress = onProgress
  }

  /**
   * Import validated data to the inventory system
   */
  async importData(
    preview: ImportPreview,
    batchSize: number = 100
  ): Promise<ImportResult> {
    const startTime = Date.now()
    const { mappedData, errors: previewErrors, warnings: previewWarnings } = preview
    
    const result: ImportResult = {
      success: false,
      importedCount: 0,
      errorCount: 0,
      warningCount: previewWarnings.length,
      errors: [...previewErrors],
      warnings: [...previewWarnings],
      duration: 0,
      importedItems: [],
      failedItems: []
    }

    // Filter out items with errors
    const validItems = mappedData.filter((item, index) => {
      const hasErrors = previewErrors.some(error => error.row === index + 1)
      if (hasErrors) {
        result.failedItems.push({
          row: index + 1,
          data: item,
          error: 'Item tiene errores de validación'
        })
        result.errorCount++
      }
      return !hasErrors
    })

    if (validItems.length === 0) {
      result.duration = Date.now() - startTime
      return result
    }

    // Process items in batches
    const batches = this.createBatches(validItems, batchSize)
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const batchStartIndex = batchIndex * batchSize
      
      // Update progress
      this.updateProgress({
        currentRow: batchStartIndex,
        totalRows: validItems.length,
        percentage: Math.round((batchStartIndex / validItems.length) * 100),
        currentOperation: `Procesando lote ${batchIndex + 1} de ${batches.length}`,
        errors: result.errors,
        warnings: result.warnings,
        isComplete: false,
        isError: false
      })

      // Process batch
      const batchResult = await this.processBatch(batch, batchStartIndex + 1)
      
      // Update result
      result.importedCount += batchResult.importedCount
      result.errorCount += batchResult.errorCount
      result.errors.push(...batchResult.errors)
      result.importedItems.push(...batchResult.importedItems)
      result.failedItems.push(...batchResult.failedItems)

      // Add delay between batches to prevent overwhelming the server
      if (batchIndex < batches.length - 1) {
        await this.delay(100)
      }
    }

    // Final progress update
    this.updateProgress({
      currentRow: validItems.length,
      totalRows: validItems.length,
      percentage: 100,
      currentOperation: 'Importación completada',
      errors: result.errors,
      warnings: result.warnings,
      isComplete: true,
      isError: result.errorCount > 0
    })

    result.success = result.errorCount === 0
    result.duration = Date.now() - startTime

    return result
  }

  /**
   * Process a batch of items
   */
  private async processBatch(
    items: Partial<InventoryFieldMapping>[],
    startRowIndex: number
  ): Promise<{
    importedCount: number
    errorCount: number
    errors: ImportError[]
    importedItems: Partial<InventoryFieldMapping>[]
    failedItems: { row: number; data: Partial<InventoryFieldMapping>; error: string }[]
  }> {
    const batchResult = {
      importedCount: 0,
      errorCount: 0,
      errors: [] as ImportError[],
      importedItems: [] as Partial<InventoryFieldMapping>[],
      failedItems: [] as { row: number; data: Partial<InventoryFieldMapping>; error: string }[]
    }

    // Process items in parallel (with concurrency limit)
    const concurrencyLimit = 5
    const chunks = this.createChunks(items, concurrencyLimit)

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (item, chunkIndex) => {
        const rowIndex = startRowIndex + chunkIndex
        return this.importItem(item, rowIndex)
      })

      const chunkResults = await Promise.allSettled(chunkPromises)

      for (let i = 0; i < chunkResults.length; i++) {
        const result = chunkResults[i]
        const item = chunk[i]
        const rowIndex = startRowIndex + i

        if (result.status === 'fulfilled') {
          if (result.value.success) {
            batchResult.importedCount++
            batchResult.importedItems.push(item)
          } else {
            batchResult.errorCount++
            if (result.value.error) {
              batchResult.errors.push(result.value.error)
            }
            batchResult.failedItems.push({
              row: rowIndex,
              data: item,
              error: result.value.error?.message || 'Unknown error'
            })
          }
        } else {
          batchResult.errorCount++
          const error: ImportError = {
            row: rowIndex,
            field: 'sku',
            value: String(item.sku || ''),
            message: `Error inesperado: ${result.reason}`,
            severity: 'error'
          }
          batchResult.errors.push(error)
          batchResult.failedItems.push({
            row: rowIndex,
            data: item,
            error: result.reason
          })
        }
      }
    }

    return batchResult
  }

  /**
   * Import a single item
   */
  private async importItem(
    item: Partial<InventoryFieldMapping>,
    rowIndex: number
  ): Promise<{
    success: boolean
    error?: ImportError
  }> {
    try {
      // Prepare the item data for the API
      const itemData = await this.prepareItemData(item)

      // Call the inventory API
      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Error desconocido'
        
        return {
          success: false,
          error: {
            row: rowIndex,
            field: 'sku',
            value: String(item.sku || ''),
            message: `Error del servidor: ${errorMessage}`,
            severity: 'error'
          }
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: {
          row: rowIndex,
          field: 'sku',
          value: String(item.sku || ''),
          message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          severity: 'error'
        }
      }
    }
  }

  /**
   * Prepare item data for API submission
   */
  private async prepareItemData(item: Partial<InventoryFieldMapping>): Promise<any> {
    // Map the inventory field mapping to the API format
    return {
      sku: item.sku || '',
      name: item.name || '',
      description: item.description || '',
      category_id: await this.resolveCategoryId(item.category),
      location_id: await this.resolveLocationId(item.location),
      unit_price: item.price || 0,
      cost: item.cost || 0,
      quantity: item.quantity || 0,
      min_stock: item.minStock || 0,
      max_stock: item.maxStock || 1000,
      status: item.status || 'active',
      barcode: item.barcode || null,
      tags: item.tags || [],
      supplier: item.supplier || null,
      notes: item.notes || null
    }
  }

  /**
   * Resolve category name to category ID
   */
  private async resolveCategoryId(categoryName?: string): Promise<string> {
    if (!categoryName) {
      return await this.getDefaultCategoryId()
    }

    try {
      const response = await fetch('/api/categories/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: categoryName })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.category) {
          return data.category.id
        }
      }

      // If category doesn't exist, create it
      return await this.createCategory(categoryName)
    } catch (error) {
      console.warn('Error resolving category:', error)
      return await this.getDefaultCategoryId()
    }
  }

  /**
   * Resolve location name to location ID
   */
  private async resolveLocationId(locationName?: string): Promise<string> {
    if (!locationName) {
      return await this.getDefaultLocationId()
    }

    try {
      const response = await fetch('/api/locations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: locationName })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.location) {
          return data.location.id
        }
      }

      // If location doesn't exist, create it
      return await this.createLocation(locationName)
    } catch (error) {
      console.warn('Error resolving location:', error)
      return await this.getDefaultLocationId()
    }
  }

  /**
   * Create a new category
   */
  private async createCategory(name: string): Promise<string> {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: `Categoría creada automáticamente desde importación CSV`,
          color: this.generateRandomColor(),
          isActive: true,
          sortOrder: 999
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.category.id
      }
    } catch (error) {
      console.warn('Error creating category:', error)
    }

    return await this.getDefaultCategoryId()
  }

  /**
   * Create a new location
   */
  private async createLocation(name: string): Promise<string> {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: `Ubicación creada automáticamente desde importación CSV`,
          type: 'storage'
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.location.id
      }
    } catch (error) {
      console.warn('Error creating location:', error)
    }

    return await this.getDefaultLocationId()
  }

  /**
   * Get default category ID
   */
  private async getDefaultCategoryId(): Promise<string> {
    try {
      const response = await fetch('/api/categories/items')
      if (response.ok) {
        const categories = await response.json()
        const defaultCategory = categories.find((cat: any) => 
          cat.name.toLowerCase().includes('general') || 
          cat.name.toLowerCase().includes('sin categoría')
        )
        return defaultCategory?.id || categories[0]?.id || ''
      }
    } catch (error) {
      console.warn('Error getting default category:', error)
    }
    return ''
  }

  /**
   * Get default location ID
   */
  private async getDefaultLocationId(): Promise<string> {
    try {
      const response = await fetch('/api/locations/items')
      if (response.ok) {
        const locations = await response.json()
        const defaultLocation = locations.find((loc: any) => 
          loc.name.toLowerCase().includes('general') || 
          loc.name.toLowerCase().includes('sin ubicación')
        )
        return defaultLocation?.id || locations[0]?.id || ''
      }
    } catch (error) {
      console.warn('Error getting default location:', error)
    }
    return ''
  }

  /**
   * Generate random color for new categories
   */
  private generateRandomColor(): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Create batches from items array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Create chunks for parallel processing
   */
  private createChunks<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: ImportProgress): void {
    if (this.onProgress) {
      this.onProgress(progress)
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cancel import operation
   */
  cancel(): void {
    // Implementation for canceling import
    // This would require a more complex state management system
    console.log('Import cancelled')
  }

  /**
   * Get import statistics
   */
  getImportStatistics(result: ImportResult): {
    successRate: number
    averageTimePerItem: number
    errorRate: number
    warningRate: number
  } {
    const totalItems = result.importedCount + result.errorCount
    const successRate = totalItems > 0 ? (result.importedCount / totalItems) * 100 : 0
    const averageTimePerItem = totalItems > 0 ? result.duration / totalItems : 0
    const errorRate = totalItems > 0 ? (result.errorCount / totalItems) * 100 : 0
    const warningRate = totalItems > 0 ? (result.warningCount / totalItems) * 100 : 0

    return {
      successRate,
      averageTimePerItem,
      errorRate,
      warningRate
    }
  }
}