import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CSVImportService } from '@/lib/csv-import/csv-import-service'
import { CSVParser } from '@/lib/csv-import/csv-parser'
import { ColumnMapper } from '@/lib/csv-import/column-mapper'
import { DataValidator } from '@/lib/csv-import/data-validator'
import { ImportEngine } from '@/lib/csv-import/import-engine'
import {
  CSVImportData,
  ColumnMapping,
  ImportPreview,
  ImportResult,
  ImportSession,
  CSVImportConfig,
  DEFAULT_CSV_IMPORT_CONFIG
} from '@/lib/csv-import/types'

// Mock dependencies
vi.mock('@/lib/csv-import/csv-parser')
vi.mock('@/lib/csv-import/column-mapper')
vi.mock('@/lib/csv-import/data-validator')
vi.mock('@/lib/csv-import/import-engine')

describe('CSVImportService', () => {
  let service: CSVImportService
  let mockParser: any
  let mockMapper: any
  let mockValidator: any
  let mockEngine: any

  const mockFile = new File(['name,sku,quantity\nTest Item,TEST-001,10'], 'test.csv', {
    type: 'text/csv'
  })

  const mockCSVData: CSVImportData = {
    columns: ['name', 'sku', 'quantity'],
    rows: [
      { name: 'Test Item', sku: 'TEST-001', quantity: '10' }
    ],
    totalRows: 1,
    preview: [
      { name: 'Test Item', sku: 'TEST-001', quantity: '10' }
    ]
  }

  const mockColumnMappings: ColumnMapping[] = [
    {
      csvColumn: 'name',
      inventoryField: 'name',
      confidence: 1.0,
      isRequired: true,
      transform: null
    },
    {
      csvColumn: 'sku',
      inventoryField: 'sku',
      confidence: 1.0,
      isRequired: true,
      transform: null
    },
    {
      csvColumn: 'quantity',
      inventoryField: 'quantity',
      confidence: 1.0,
      isRequired: true,
      transform: 'number'
    }
  ]

  const mockImportPreview: ImportPreview = {
    validRows: [
      {
        rowIndex: 0,
        originalData: { name: 'Test Item', sku: 'TEST-001', quantity: '10' },
        mappedData: { name: 'Test Item', sku: 'TEST-001', quantity: 10 },
        warnings: []
      }
    ],
    errorRows: [],
    statistics: {
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      warningRows: 0
    }
  }

  const mockImportResult: ImportResult = {
    success: true,
    importedCount: 1,
    errorCount: 0,
    warningCount: 0,
    duration: 1500,
    errors: [],
    warnings: [],
    failedItems: []
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup mock implementations
    mockParser = {
      validateFile: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
      parseFile: vi.fn().mockResolvedValue(mockCSVData)
    }

    mockMapper = {
      autoMapColumns: vi.fn().mockReturnValue(mockColumnMappings),
      validateMappings: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
      getMappingStatistics: vi.fn().mockReturnValue({
        totalColumns: 3,
        mappedColumns: 3,
        unmappedColumns: 0,
        averageConfidence: 1.0
      }),
      suggestMappings: vi.fn().mockReturnValue([])
    }

    mockValidator = {
      validateData: vi.fn().mockReturnValue(mockImportPreview)
    }

    mockEngine = {
      importData: vi.fn().mockResolvedValue(mockImportResult),
      cancel: vi.fn()
    }

    // Mock constructors
    vi.mocked(CSVParser).mockImplementation(() => mockParser)
    vi.mocked(ColumnMapper).mockImplementation(() => mockMapper)
    vi.mocked(DataValidator).mockImplementation(() => mockValidator)
    vi.mocked(ImportEngine).mockImplementation(() => mockEngine)

    service = new CSVImportService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create service with default configuration', () => {
      const newService = new CSVImportService()
      
      expect(CSVParser).toHaveBeenCalledWith(DEFAULT_CSV_IMPORT_CONFIG)
      expect(ColumnMapper).toHaveBeenCalled()
      expect(DataValidator).toHaveBeenCalledWith(DEFAULT_CSV_IMPORT_CONFIG.validationRules)
      expect(ImportEngine).toHaveBeenCalledWith(DEFAULT_CSV_IMPORT_CONFIG, expect.any(Function))
    })

    it('should create service with custom configuration', () => {
      const customConfig: CSVImportConfig = {
        ...DEFAULT_CSV_IMPORT_CONFIG,
        maxFileSize: 20 * 1024 * 1024, // 20MB
        batchSize: 200
      }

      const newService = new CSVImportService(customConfig)

      expect(CSVParser).toHaveBeenCalledWith(customConfig)
      expect(DataValidator).toHaveBeenCalledWith(customConfig.validationRules)
      expect(ImportEngine).toHaveBeenCalledWith(customConfig, expect.any(Function))
    })
  })

  describe('startImportSession', () => {
    it('should create new import session successfully', async () => {
      const session = await service.startImportSession(mockFile)

      expect(session).toMatchObject({
        fileName: 'test.csv',
        fileSize: mockFile.size,
        status: 'uploading',
        progress: expect.objectContaining({
          currentRow: 0,
          totalRows: 0,
          percentage: 0,
          currentOperation: 'Cargando archivo...'
        })
      })
      expect(session.id).toMatch(/^import_\d+_[a-z0-9]+$/)
      expect(mockParser.validateFile).toHaveBeenCalledWith(mockFile)
    })

    it('should reject invalid files', async () => {
      mockParser.validateFile.mockReturnValue({
        isValid: false,
        errors: ['Invalid file type']
      })

      await expect(service.startImportSession(mockFile))
        .rejects.toThrow('Archivo inválido: Invalid file type')
    })
  })

  describe('parseFile', () => {
    beforeEach(async () => {
      await service.startImportSession(mockFile)
    })

    it('should parse CSV file successfully', async () => {
      const result = await service.parseFile(mockFile)

      expect(result).toEqual(mockCSVData)
      expect(mockParser.parseFile).toHaveBeenCalledWith(mockFile)
      
      const session = service.getCurrentSession()
      expect(session?.status).toBe('mapping')
      expect(session?.data).toEqual(mockCSVData)
      expect(session?.progress.totalRows).toBe(1)
    })

    it('should handle parsing errors', async () => {
      mockParser.parseFile.mockRejectedValue(new Error('Parse error'))

      await expect(service.parseFile(mockFile))
        .rejects.toThrow('Error al analizar el archivo: Parse error')

      const session = service.getCurrentSession()
      expect(session?.status).toBe('error')
    })

    it('should require active session', async () => {
      service.resetSession()

      await expect(service.parseFile(mockFile))
        .rejects.toThrow('No hay una sesión de importación activa')
    })
  })

  describe('autoMapColumns', () => {
    beforeEach(async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
    })

    it('should auto-map columns successfully', () => {
      const mappings = service.autoMapColumns()

      expect(mappings).toEqual(mockColumnMappings)
      expect(mockMapper.autoMapColumns).toHaveBeenCalledWith(['name', 'sku', 'quantity'])
      
      const session = service.getCurrentSession()
      expect(session?.status).toBe('preview')
      expect(session?.mappings).toEqual(mockColumnMappings)
    })

    it('should require CSV data', () => {
      service.resetSession()

      expect(() => service.autoMapColumns())
        .toThrow('No hay datos CSV para mapear')
    })
  })

  describe('updateMappings', () => {
    beforeEach(async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
    })

    it('should update column mappings successfully', () => {
      const newMappings = [...mockColumnMappings]
      
      service.updateMappings(newMappings)

      expect(mockMapper.validateMappings).toHaveBeenCalledWith(newMappings)
      
      const session = service.getCurrentSession()
      expect(session?.mappings).toEqual(newMappings)
    })

    it('should reject invalid mappings', () => {
      mockMapper.validateMappings.mockReturnValue({
        isValid: false,
        errors: ['Invalid mapping']
      })

      expect(() => service.updateMappings(mockColumnMappings))
        .toThrow('Mapeos inválidos: Invalid mapping')
    })

    it('should require active session', () => {
      service.resetSession()

      expect(() => service.updateMappings(mockColumnMappings))
        .toThrow('No hay una sesión de importación activa')
    })
  })

  describe('generatePreview', () => {
    beforeEach(async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()
    })

    it('should generate import preview successfully', () => {
      const preview = service.generatePreview()

      expect(preview).toEqual(mockImportPreview)
      expect(mockValidator.validateData).toHaveBeenCalledWith(
        mockCSVData,
        mockColumnMappings,
        DEFAULT_CSV_IMPORT_CONFIG.defaultValues
      )
      
      const session = service.getCurrentSession()
      expect(session?.preview).toEqual(mockImportPreview)
    })

    it('should require data and mappings', () => {
      service.resetSession()

      expect(() => service.generatePreview())
        .toThrow('Datos o mapeos faltantes para generar vista previa')
    })
  })

  describe('startImport', () => {
    beforeEach(async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()
      service.generatePreview()
    })

    it('should start import successfully', async () => {
      const result = await service.startImport()

      expect(result).toEqual(mockImportResult)
      expect(mockEngine.importData).toHaveBeenCalledWith(
        mockImportPreview,
        DEFAULT_CSV_IMPORT_CONFIG.batchSize
      )
      
      const session = service.getCurrentSession()
      expect(session?.status).toBe('completed')
      expect(session?.result).toEqual(mockImportResult)
    })

    it('should handle import failures', async () => {
      const failedResult = { ...mockImportResult, success: false }
      mockEngine.importData.mockResolvedValue(failedResult)

      const result = await service.startImport()

      expect(result).toEqual(failedResult)
      
      const session = service.getCurrentSession()
      expect(session?.status).toBe('error')
    })

    it('should handle import errors', async () => {
      mockEngine.importData.mockRejectedValue(new Error('Import error'))

      await expect(service.startImport())
        .rejects.toThrow('Error durante la importación: Import error')

      const session = service.getCurrentSession()
      expect(session?.status).toBe('error')
    })

    it('should require preview', async () => {
      // Reset session without preview
      await service.startImportSession(mockFile)

      await expect(service.startImport())
        .rejects.toThrow('No hay vista previa para importar')
    })
  })

  describe('getCurrentSession', () => {
    it('should return null when no session exists', () => {
      expect(service.getCurrentSession()).toBeNull()
    })

    it('should return current session', async () => {
      const session = await service.startImportSession(mockFile)
      
      expect(service.getCurrentSession()).toEqual(session)
    })
  })

  describe('getSessionStatistics', () => {
    it('should return null when no session exists', () => {
      expect(service.getSessionStatistics()).toBeNull()
    })

    it('should return session statistics', async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()
      service.generatePreview()

      const stats = service.getSessionStatistics()

      expect(stats).toEqual({
        fileStats: {
          name: 'test.csv',
          size: expect.any(String),
          rows: 1,
          columns: 3
        },
        mappingStats: {
          totalColumns: 3,
          mappedColumns: 3,
          unmappedColumns: 0,
          averageConfidence: 1.0
        },
        previewStats: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          warningRows: 0
        }
      })
    })
  })

  describe('getMappingSuggestions', () => {
    it('should return empty array when no session data', () => {
      expect(service.getMappingSuggestions()).toEqual([])
    })

    it('should return mapping suggestions', async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()

      const suggestions = [
        {
          column: 'description',
          suggestions: [
            { field: 'description', confidence: 0.8, reason: 'Similar column name' }
          ]
        }
      ]
      mockMapper.suggestMappings.mockReturnValue(suggestions)

      const result = service.getMappingSuggestions()

      expect(result).toEqual(suggestions)
      expect(mockMapper.suggestMappings).toHaveBeenCalledWith(
        ['name', 'sku', 'quantity'],
        mockColumnMappings
      )
    })
  })

  describe('resetSession', () => {
    it('should reset current session', async () => {
      await service.startImportSession(mockFile)
      expect(service.getCurrentSession()).not.toBeNull()

      service.resetSession()
      expect(service.getCurrentSession()).toBeNull()
    })
  })

  describe('cancelImport', () => {
    it('should cancel import when session exists', async () => {
      await service.startImportSession(mockFile)

      service.cancelImport()

      expect(mockEngine.cancel).toHaveBeenCalled()
      
      const session = service.getCurrentSession()
      expect(session?.status).toBe('error')
    })

    it('should handle no active session gracefully', () => {
      expect(() => service.cancelImport()).not.toThrow()
    })
  })

  describe('exportResults', () => {
    beforeEach(async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()
      service.generatePreview()
      await service.startImport()
    })

    it('should export results as JSON', () => {
      const jsonResult = service.exportResults('json')
      const parsed = JSON.parse(jsonResult)

      expect(parsed).toMatchObject({
        session: expect.objectContaining({
          fileName: 'test.csv'
        }),
        summary: expect.objectContaining({
          success: true,
          importedCount: 1
        }),
        errors: [],
        warnings: []
      })
    })

    it('should export results as CSV', () => {
      const csvResult = service.exportResults('csv')

      expect(csvResult).toContain('Tipo,Fila,Campo,Valor,Mensaje,Sugerencia')
      expect(typeof csvResult).toBe('string')
    })

    it('should default to JSON format', () => {
      const defaultResult = service.exportResults()
      
      expect(() => JSON.parse(defaultResult)).not.toThrow()
    })

    it('should require import results', () => {
      service.resetSession()

      expect(() => service.exportResults())
        .toThrow('No hay resultados para exportar')
    })
  })

  describe('getSupportedFormats', () => {
    it('should return supported file formats', () => {
      const formats = service.getSupportedFormats()

      expect(formats).toEqual({
        extensions: ['.csv', '.txt', '.tsv'],
        mimeTypes: ['text/csv', 'text/plain', 'text/tab-separated-values'],
        maxSize: expect.any(String)
      })
    })
  })

  describe('getConfiguration', () => {
    it('should return current configuration', () => {
      const config = service.getConfiguration()

      expect(config).toEqual(DEFAULT_CSV_IMPORT_CONFIG)
    })

    it('should return copy of configuration', () => {
      const config1 = service.getConfiguration()
      const config2 = service.getConfiguration()

      expect(config1).not.toBe(config2) // Different object references
      expect(config1).toEqual(config2) // Same content
    })
  })

  describe('updateConfiguration', () => {
    it('should update configuration and recreate services', () => {
      const newConfig = {
        maxFileSize: 20 * 1024 * 1024,
        batchSize: 200
      }

      service.updateConfiguration(newConfig)

      const updatedConfig = service.getConfiguration()
      expect(updatedConfig.maxFileSize).toBe(20 * 1024 * 1024)
      expect(updatedConfig.batchSize).toBe(200)

      // Verify services were recreated
      expect(CSVParser).toHaveBeenCalledTimes(2) // Initial + update
      expect(DataValidator).toHaveBeenCalledTimes(2)
      expect(ImportEngine).toHaveBeenCalledTimes(2)
    })
  })

  describe('private methods', () => {
    it('should generate unique session IDs', async () => {
      const session1 = await service.startImportSession(mockFile)
      service.resetSession()
      const session2 = await service.startImportSession(mockFile)

      expect(session1.id).not.toBe(session2.id)
      expect(session1.id).toMatch(/^import_\d+_[a-z0-9]+$/)
      expect(session2.id).toMatch(/^import_\d+_[a-z0-9]+$/)
    })

    it('should format file sizes correctly', () => {
      const formats = service.getSupportedFormats()
      
      expect(formats.maxSize).toMatch(/^\d+(\.\d+)?\s+(Bytes|KB|MB|GB)$/)
    })

    it('should handle progress updates from import engine', async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()
      service.generatePreview()

      // Simulate progress callback
      const progressCallback = vi.mocked(ImportEngine).mock.calls[0][1]
      const mockProgress = {
        currentRow: 5,
        totalRows: 10,
        percentage: 50,
        currentOperation: 'Processing...',
        errors: [],
        warnings: [],
        isComplete: false,
        isError: false
      }

      progressCallback(mockProgress)

      const session = service.getCurrentSession()
      expect(session?.progress).toEqual(mockProgress)
    })
  })

  describe('error handling', () => {
    it('should handle file validation errors gracefully', async () => {
      mockParser.validateFile.mockReturnValue({
        isValid: false,
        errors: ['File too large', 'Invalid format']
      })

      await expect(service.startImportSession(mockFile))
        .rejects.toThrow('Archivo inválido: File too large, Invalid format')
    })

    it('should handle unknown errors gracefully', async () => {
      await service.startImportSession(mockFile)
      mockParser.parseFile.mockRejectedValue('Unknown error')

      await expect(service.parseFile(mockFile))
        .rejects.toThrow('Error al analizar el archivo: Error desconocido')
    })

    it('should handle import engine errors gracefully', async () => {
      await service.startImportSession(mockFile)
      await service.parseFile(mockFile)
      service.autoMapColumns()
      service.generatePreview()

      mockEngine.importData.mockRejectedValue('Engine error')

      await expect(service.startImport())
        .rejects.toThrow('Error durante la importación: Error desconocido')
    })
  })
})