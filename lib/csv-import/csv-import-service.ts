// ============================================================================
// CSV IMPORT SERVICE - MAIN ORCHESTRATOR
// ============================================================================

import { CSVParser } from './csv-parser'
import { ColumnMapper } from './column-mapper'
import { DataValidator } from './data-validator'
import { ImportEngine } from './import-engine'
import {
  CSVImportData,
  ColumnMapping,
  ImportPreview,
  ImportResult,
  ImportProgress,
  ImportSession,
  CSVImportConfig,
  DEFAULT_CSV_IMPORT_CONFIG
} from './types'

export class CSVImportService {
  private parser: CSVParser
  private mapper: ColumnMapper
  private validator: DataValidator
  private engine: ImportEngine
  private config: CSVImportConfig
  private currentSession: ImportSession | null = null

  constructor(config: CSVImportConfig = DEFAULT_CSV_IMPORT_CONFIG) {
    this.config = config
    this.parser = new CSVParser(config)
    this.mapper = new ColumnMapper()
    this.validator = new DataValidator(config.validationRules)
    this.engine = new ImportEngine(config, this.handleProgress.bind(this))
  }

  /**
   * Start a new import session
   */
  async startImportSession(file: File): Promise<ImportSession> {
    // Validate file
    const fileValidation = this.parser.validateFile(file)
    if (!fileValidation.isValid) {
      throw new Error(`Archivo inválido: ${fileValidation.errors.join(', ')}`)
    }

    // Create session
    const session: ImportSession = {
      id: this.generateSessionId(),
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      progress: {
        currentRow: 0,
        totalRows: 0,
        percentage: 0,
        currentOperation: 'Cargando archivo...',
        errors: [],
        warnings: [],
        isComplete: false,
        isError: false
      },
      config: this.config,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.currentSession = session
    return session
  }

  /**
   * Parse CSV file
   */
  async parseFile(file: File): Promise<CSVImportData> {
    if (!this.currentSession) {
      throw new Error('No hay una sesión de importación activa')
    }

    this.updateSessionStatus('parsing')
    this.updateProgress('Analizando archivo CSV...', 0)

    try {
      const data = await this.parser.parseFile(file)
      
      this.currentSession.data = data
      this.currentSession.progress.totalRows = data.totalRows
      this.updateSessionStatus('mapping')
      this.updateProgress('Archivo analizado correctamente', 25)

      return data
    } catch (error) {
      this.updateSessionStatus('error')
      throw new Error(`Error al analizar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Auto-map columns to inventory fields
   */
  autoMapColumns(): ColumnMapping[] {
    if (!this.currentSession?.data) {
      throw new Error('No hay datos CSV para mapear')
    }

    this.updateProgress('Mapeando columnas automáticamente...', 30)

    const mappings = this.mapper.autoMapColumns(this.currentSession.data.columns)
    
    this.currentSession.mappings = mappings
    this.updateSessionStatus('preview')
    this.updateProgress('Columnas mapeadas correctamente', 50)

    return mappings
  }

  /**
   * Update column mappings
   */
  updateMappings(mappings: ColumnMapping[]): void {
    if (!this.currentSession) {
      throw new Error('No hay una sesión de importación activa')
    }

    // Validate mappings
    const validation = this.mapper.validateMappings(mappings)
    if (!validation.isValid) {
      throw new Error(`Mapeos inválidos: ${validation.errors.join(', ')}`)
    }

    this.currentSession.mappings = mappings
    this.updateProgress('Mapeos actualizados', 50)
  }

  /**
   * Generate import preview
   */
  generatePreview(): ImportPreview {
    if (!this.currentSession?.data || !this.currentSession?.mappings) {
      throw new Error('Datos o mapeos faltantes para generar vista previa')
    }

    this.updateProgress('Generando vista previa...', 60)

    const preview = this.validator.validateData(
      this.currentSession.data,
      this.currentSession.mappings,
      this.config.defaultValues
    )

    this.currentSession.preview = preview
    this.updateProgress('Vista previa generada', 70)

    return preview
  }

  /**
   * Start import process
   */
  async startImport(): Promise<ImportResult> {
    if (!this.currentSession?.preview) {
      throw new Error('No hay vista previa para importar')
    }

    this.updateSessionStatus('importing')
    this.updateProgress('Iniciando importación...', 75)

    try {
      const result = await this.engine.importData(
        this.currentSession.preview,
        this.config.batchSize
      )

      this.currentSession.result = result
      this.currentSession.status = result.success ? 'completed' : 'error'
      this.updateProgress('Importación completada', 100)

      return result
    } catch (error) {
      this.currentSession.status = 'error'
      throw new Error(`Error durante la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): ImportSession | null {
    return this.currentSession
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(): {
    fileStats: {
      name: string
      size: string
      rows: number
      columns: number
    }
    mappingStats: {
      totalColumns: number
      mappedColumns: number
      unmappedColumns: number
      averageConfidence: number
    }
    previewStats: {
      totalRows: number
      validRows: number
      errorRows: number
      warningRows: number
    }
  } | null {
    if (!this.currentSession) return null

    const fileStats = {
      name: this.currentSession.fileName,
      size: this.formatFileSize(this.currentSession.fileSize),
      rows: this.currentSession.data?.totalRows || 0,
      columns: this.currentSession.data?.columns.length || 0
    }

    const mappingStats = this.currentSession.mappings
      ? this.mapper.getMappingStatistics(this.currentSession.mappings)
      : {
          totalColumns: 0,
          mappedColumns: 0,
          unmappedColumns: 0,
          averageConfidence: 0
        }

    const previewStats = this.currentSession.preview?.statistics || {
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      warningRows: 0
    }

    return {
      fileStats,
      mappingStats,
      previewStats
    }
  }

  /**
   * Get column mapping suggestions
   */
  getMappingSuggestions(): {
    column: string
    suggestions: {
      field: string
      confidence: number
      reason: string
    }[]
  }[] {
    if (!this.currentSession?.data || !this.currentSession?.mappings) {
      return []
    }

    return this.mapper.suggestMappings(
      this.currentSession.data.columns,
      this.currentSession.mappings
    )
  }

  /**
   * Reset current session
   */
  resetSession(): void {
    this.currentSession = null
  }

  /**
   * Cancel current import
   */
  cancelImport(): void {
    if (this.currentSession) {
      this.currentSession.status = 'error'
      this.engine.cancel()
      this.updateProgress('Importación cancelada', 0)
    }
  }

  /**
   * Export import results
   */
  exportResults(format: 'csv' | 'json' = 'json'): string {
    if (!this.currentSession?.result) {
      throw new Error('No hay resultados para exportar')
    }

    const result = this.currentSession.result

    if (format === 'json') {
      return JSON.stringify({
        session: {
          id: this.currentSession.id,
          fileName: this.currentSession.fileName,
          createdAt: this.currentSession.createdAt,
          completedAt: new Date()
        },
        summary: {
          success: result.success,
          importedCount: result.importedCount,
          errorCount: result.errorCount,
          warningCount: result.warningCount,
          duration: result.duration
        },
        errors: result.errors,
        warnings: result.warnings,
        failedItems: result.failedItems
      }, null, 2)
    } else {
      // CSV format for errors
      const csvRows = [
        ['Tipo', 'Fila', 'Campo', 'Valor', 'Mensaje', 'Sugerencia'],
        ...result.errors.map(error => [
          'Error',
          error.row,
          error.field,
          error.value,
          error.message,
          error.suggestion || ''
        ]),
        ...result.warnings.map(warning => [
          'Advertencia',
          warning.row,
          warning.field,
          warning.value,
          warning.message,
          warning.suggestion || ''
        ])
      ]

      return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    }
  }

  /**
   * Update session status
   */
  private updateSessionStatus(status: ImportSession['status']): void {
    if (this.currentSession) {
      this.currentSession.status = status
      this.currentSession.updatedAt = new Date()
    }
  }

  /**
   * Update progress
   */
  private updateProgress(operation: string, percentage: number): void {
    if (this.currentSession) {
      this.currentSession.progress = {
        ...this.currentSession.progress,
        currentOperation: operation,
        percentage,
        isComplete: percentage >= 100
      }
    }
  }

  /**
   * Handle progress updates from import engine
   */
  private handleProgress(progress: ImportProgress): void {
    if (this.currentSession) {
      this.currentSession.progress = progress
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): {
    extensions: string[]
    mimeTypes: string[]
    maxSize: string
  } {
    return {
      extensions: ['.csv', '.txt', '.tsv'],
      mimeTypes: ['text/csv', 'text/plain', 'text/tab-separated-values'],
      maxSize: this.formatFileSize(this.config.maxFileSize)
    }
  }

  /**
   * Get import configuration
   */
  getConfiguration(): CSVImportConfig {
    return { ...this.config }
  }

  /**
   * Update import configuration
   */
  updateConfiguration(newConfig: Partial<CSVImportConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Recreate services with new config
    this.parser = new CSVParser(this.config)
    this.validator = new DataValidator(this.config.validationRules)
    this.engine = new ImportEngine(this.config, this.handleProgress.bind(this))
  }
}