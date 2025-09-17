// ============================================================================
// CSV PARSER WITH INTELLIGENT COLUMN DETECTION
// ============================================================================

import * as Papa from 'papaparse'
import { CSVImportData, CSVColumn, CSVImportConfig } from './types'

export class CSVParser {
  private config: CSVImportConfig

  constructor(config: CSVImportConfig) {
    this.config = config
  }

  /**
   * Parse CSV file with intelligent detection
   */
  async parseFile(file: File): Promise<CSVImportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const parsedData = this.parseText(text, file.name)
          resolve(parsedData)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      
      reader.readAsText(file, this.detectEncoding(file))
    })
  }

  /**
   * Parse CSV text with intelligent detection
   */
  parseText(text: string, fileName?: string): CSVImportData {
    // Detect delimiter
    const delimiter = this.detectDelimiter(text)
    
    // Parse CSV - Temporary workaround for build
    const parseResult = (Papa as any).parse(text, {
      delimiter: delimiter,
      header: false,
      skipEmptyLines: this.config.skipEmptyRows,
      transform: (value: string) => this.config.trimWhitespace ? value.trim() : value,
      encoding: this.detectEncoding({ name: fileName || '' } as File)
    })

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors)
    }

    const rows = parseResult.data as string[][]
    
    if (rows.length === 0) {
      throw new Error('El archivo CSV está vacío')
    }

    // Detect if first row contains headers
    const hasHeaders = this.detectHeaders(rows[0])
    const dataRows = hasHeaders ? rows.slice(1) : rows
    const headerRow = hasHeaders ? rows[0] : null

    // Analyze columns
    const columns = this.analyzeColumns(rows, hasHeaders)

    return {
      columns,
      rows: dataRows,
      totalRows: dataRows.length,
      hasHeaders,
      delimiter,
      encoding: this.detectEncoding({ name: fileName || '' } as File)
    }
  }

  /**
   * Detect CSV delimiter
   */
  private detectDelimiter(text: string): string {
    if (!this.config.autoDetectDelimiter) {
      return this.config.allowedDelimiters[0]
    }

    const sample = text.substring(0, Math.min(1000, text.length))
    const delimiterCounts: Record<string, number> = {}

    for (const delimiter of this.config.allowedDelimiters) {
      const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
      delimiterCounts[delimiter] = count
    }

    // Find delimiter with highest count
    const bestDelimiter = Object.entries(delimiterCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]

    return bestDelimiter || ','
  }

  /**
   * Detect if first row contains headers
   */
  private detectHeaders(firstRow: string[]): boolean {
    if (!firstRow || firstRow.length === 0) return false

    // Check if all values in first row are strings (likely headers)
    const allStrings = firstRow.every(cell => 
      typeof cell === 'string' && 
      !this.isNumeric(cell) && 
      !this.isDate(cell)
    )

    // Check if first row has more descriptive text than data rows
    const avgLength = firstRow.reduce((sum, cell) => sum + cell.length, 0) / firstRow.length
    const hasDescriptiveText = avgLength > 5

    return allStrings && hasDescriptiveText
  }

  /**
   * Analyze columns to determine data types and characteristics
   */
  private analyzeColumns(rows: string[][], hasHeaders: boolean): CSVColumn[] {
    const dataRows = hasHeaders ? rows.slice(1) : rows
    const headerRow = hasHeaders ? rows[0] : null

    if (dataRows.length === 0) return []

    const columnCount = Math.max(...rows.map(row => row.length))
    const columns: CSVColumn[] = []

    for (let i = 0; i < columnCount; i++) {
      const header = headerRow?.[i] || `Columna ${i + 1}`
      const columnData = dataRows.map(row => row[i] || '').filter(value => value !== '')
      
      const dataType = this.detectDataType(columnData)
      const sampleValues = this.getSampleValues(columnData, 5)
      const confidence = this.calculateDataTypeConfidence(columnData, dataType)

      columns.push({
        index: i,
        header: header.trim(),
        sampleValues,
        dataType,
        confidence
      })
    }

    return columns
  }

  /**
   * Detect data type of a column
   */
  private detectDataType(values: string[]): 'string' | 'number' | 'boolean' | 'date' | 'unknown' {
    if (values.length === 0) return 'unknown'

    const typeScores = {
      string: 0,
      number: 0,
      boolean: 0,
      date: 0
    }

    for (const value of values) {
      if (this.isNumeric(value)) {
        typeScores.number++
      } else if (this.isBoolean(value)) {
        typeScores.boolean++
      } else if (this.isDate(value)) {
        typeScores.date++
      } else {
        typeScores.string++
      }
    }

    // Return type with highest score
    const bestType = Object.entries(typeScores)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as keyof typeof typeScores

    return bestType || 'string'
  }

  /**
   * Calculate confidence in data type detection
   */
  private calculateDataTypeConfidence(values: string[], dataType: string): number {
    if (values.length === 0) return 0

    let correctCount = 0

    for (const value of values) {
      switch (dataType) {
        case 'number':
          if (this.isNumeric(value)) correctCount++
          break
        case 'boolean':
          if (this.isBoolean(value)) correctCount++
          break
        case 'date':
          if (this.isDate(value)) correctCount++
          break
        case 'string':
          if (!this.isNumeric(value) && !this.isBoolean(value) && !this.isDate(value)) {
            correctCount++
          }
          break
      }
    }

    return correctCount / values.length
  }

  /**
   * Get sample values from column data
   */
  private getSampleValues(values: string[], count: number): string[] {
    const uniqueValues = Array.from(new Set(values))
    return uniqueValues.slice(0, count)
  }

  /**
   * Check if value is numeric
   */
  private isNumeric(value: string): boolean {
    if (typeof value !== 'string') return false
    
    // Remove common currency symbols and thousands separators
    const cleaned = value.replace(/[$,\s]/g, '')
    
    // Check for various numeric formats
    return !isNaN(Number(cleaned)) && 
           !isNaN(parseFloat(cleaned)) && 
           isFinite(Number(cleaned))
  }

  /**
   * Check if value is boolean
   */
  private isBoolean(value: string): boolean {
    if (typeof value !== 'string') return false
    
    const normalized = value.toLowerCase().trim()
    const booleanValues = [
      'true', 'false', 'yes', 'no', 'y', 'n', '1', '0',
      'verdadero', 'falso', 'sí', 'si', 'no', 'activo', 'inactivo'
    ]
    
    return booleanValues.includes(normalized)
  }

  /**
   * Check if value is a date
   */
  private isDate(value: string): boolean {
    if (typeof value !== 'string') return false
    
    // Try various date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      /^\d{2}\/\d{2}\/\d{2}$/, // MM/DD/YY
    ]
    
    const isDateFormat = dateFormats.some(format => format.test(value))
    
    if (isDateFormat) {
      const date = new Date(value)
      return !isNaN(date.getTime())
    }
    
    return false
  }

  /**
   * Detect file encoding
   */
  private detectEncoding(file: File): string {
    if (!this.config.autoDetectEncoding) {
      return this.config.allowedEncodings[0]
    }

    // Simple encoding detection based on file name and common patterns
    const fileName = file.name.toLowerCase()
    
    if (fileName.includes('utf8') || fileName.includes('utf-8')) {
      return 'utf-8'
    }
    
    if (fileName.includes('latin') || fileName.includes('iso')) {
      return 'latin1'
    }
    
    // Default to UTF-8 for most cases
    return 'utf-8'
  }

  /**
   * Validate CSV file before parsing
   */
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`El archivo es demasiado grande. Máximo permitido: ${this.config.maxFileSize / (1024 * 1024)}MB`)
    }

    // Check file type
    const allowedTypes = ['.csv', '.txt', '.tsv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(fileExtension)) {
      errors.push('Tipo de archivo no soportado. Use archivos CSV, TXT o TSV')
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('El archivo está vacío')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get file statistics
   */
  getFileStats(file: File): {
    name: string
    size: number
    sizeFormatted: string
    type: string
    lastModified: Date
  } {
    return {
      name: file.name,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      type: file.type || 'text/csv',
      lastModified: new Date(file.lastModified)
    }
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}