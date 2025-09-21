import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import handler from '@/app/api/inventory/import/route'
import { CSVImportService } from '@/lib/csv-import/csv-import-service'
import { auditedInventoryService } from '@/lib/database-with-audit'

// Mock the CSV import service
vi.mock('@/lib/csv-import/csv-import-service', () => ({
  CSVImportService: {
    validateFile: vi.fn(),
    parseCSV: vi.fn(),
    validateData: vi.fn(),
    importData: vi.fn(),
    getImportStatus: vi.fn(),
    cancelImport: vi.fn(),
  }
}))

// Mock the database service
vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    bulkCreate: vi.fn(),
    bulkUpdate: vi.fn(),
  }
}))

describe('/api/inventory/import - CSV Import Integration Tests', () => {
  const mockCSVData = [
    {
      name: 'Test Item 1',
      sku: 'TEST-001',
      description: 'Test description 1',
      category: 'Electronics',
      location: 'Warehouse A',
      quantity: '10',
      min_quantity: '5',
      max_quantity: '100',
      unit_price: '25.99',
      status: 'active'
    },
    {
      name: 'Test Item 2',
      sku: 'TEST-002',
      description: 'Test description 2',
      category: 'Clothing',
      location: 'Warehouse B',
      quantity: '15',
      min_quantity: '3',
      max_quantity: '50',
      unit_price: '15.50',
      status: 'active'
    }
  ]

  const mockValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      duplicateRows: 0
    }
  }

  const mockImportResult = {
    success: true,
    imported: 2,
    errors: [],
    warnings: [],
    importId: 'import-123',
    stats: {
      created: 2,
      updated: 0,
      skipped: 0,
      failed: 0
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/inventory/import - File Upload and Validation', () => {
    it('should validate and parse CSV file successfully', async () => {
      const mockFile = new File(['name,sku,quantity\nTest Item,TEST-001,10'], 'test.csv', {
        type: 'text/csv'
      })

      CSVImportService.validateFile.mockResolvedValue({
        valid: true,
        errors: []
      })

      CSVImportService.parseCSV.mockResolvedValue({
        data: mockCSVData,
        headers: Object.keys(mockCSVData[0])
      })

      CSVImportService.validateData.mockResolvedValue(mockValidationResult)

      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.validation).toEqual(mockValidationResult)
      expect(data.data).toEqual(mockCSVData)
      expect(CSVImportService.validateFile).toHaveBeenCalledWith(mockFile)
      expect(CSVImportService.parseCSV).toHaveBeenCalledWith(mockFile)
      expect(CSVImportService.validateData).toHaveBeenCalledWith(mockCSVData)
    })

    it('should handle file validation errors', async () => {
      const mockFile = new File(['invalid content'], 'test.txt', {
        type: 'text/plain'
      })

      CSVImportService.validateFile.mockResolvedValue({
        valid: false,
        errors: ['Invalid file type. Please upload a CSV file.']
      })

      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Invalid file type. Please upload a CSV file.')
    })

    it('should handle CSV parsing errors', async () => {
      const mockFile = new File(['invalid,csv,content\nmalformed,row'], 'test.csv', {
        type: 'text/csv'
      })

      CSVImportService.validateFile.mockResolvedValue({
        valid: true,
        errors: []
      })

      CSVImportService.parseCSV.mockRejectedValue(new Error('Failed to parse CSV'))

      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Failed to parse CSV')
    })

    it('should handle data validation errors', async () => {
      const mockFile = new File(['name,sku,quantity\nTest Item,,10'], 'test.csv', {
        type: 'text/csv'
      })

      const invalidData = [
        {
          name: 'Test Item',
          sku: '', // Invalid: empty SKU
          quantity: '10'
        }
      ]

      CSVImportService.validateFile.mockResolvedValue({
        valid: true,
        errors: []
      })

      CSVImportService.parseCSV.mockResolvedValue({
        data: invalidData,
        headers: ['name', 'sku', 'quantity']
      })

      CSVImportService.validateData.mockResolvedValue({
        valid: false,
        errors: [
          {
            row: 1,
            field: 'sku',
            message: 'SKU is required'
          }
        ],
        warnings: [],
        stats: {
          totalRows: 1,
          validRows: 0,
          invalidRows: 1,
          duplicateRows: 0
        }
      })

      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.validation.errors).toHaveLength(1)
      expect(data.validation.errors[0].message).toBe('SKU is required')
    })

    it('should require file parameter', async () => {
      const formData = new FormData()
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('File is required')
    })
  })

  describe('POST /api/inventory/import - Data Import', () => {
    it('should import valid data successfully', async () => {
      CSVImportService.importData.mockResolvedValue(mockImportResult)

      const importRequest = {
        mode: 'import',
        data: mockCSVData,
        options: {
          skipDuplicates: true,
          updateExisting: false,
          categoryMapping: {},
          locationMapping: {}
        }
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        body: importRequest,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(importRequest),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.importId).toBe('import-123')
      expect(data.stats).toEqual(mockImportResult.stats)
      expect(CSVImportService.importData).toHaveBeenCalledWith(
        mockCSVData,
        importRequest.options
      )
    })

    it('should handle import with warnings', async () => {
      const importResultWithWarnings = {
        ...mockImportResult,
        warnings: [
          {
            row: 1,
            field: 'category',
            message: 'Category "Unknown" not found, using default'
          }
        ]
      }

      CSVImportService.importData.mockResolvedValue(importResultWithWarnings)

      const importRequest = {
        mode: 'import',
        data: mockCSVData,
        options: {
          skipDuplicates: true,
          updateExisting: false,
          categoryMapping: {},
          locationMapping: {}
        }
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        body: importRequest,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(importRequest),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.warnings).toHaveLength(1)
      expect(data.warnings[0].message).toContain('Category "Unknown" not found')
    })

    it('should handle partial import success', async () => {
      const partialImportResult = {
        success: true,
        imported: 1,
        errors: [
          {
            row: 1,
            field: 'sku',
            message: 'SKU already exists'
          }
        ],
        warnings: [],
        importId: 'import-124',
        stats: {
          created: 1,
          updated: 0,
          skipped: 0,
          failed: 1
        }
      }

      CSVImportService.importData.mockResolvedValue(partialImportResult)

      const importRequest = {
        mode: 'import',
        data: mockCSVData,
        options: {
          skipDuplicates: false,
          updateExisting: false,
          categoryMapping: {},
          locationMapping: {}
        }
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        body: importRequest,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(importRequest),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(207) // Multi-Status
      expect(data.success).toBe(true)
      expect(data.errors).toHaveLength(1)
      expect(data.stats.failed).toBe(1)
    })

    it('should handle import failures', async () => {
      CSVImportService.importData.mockRejectedValue(new Error('Database connection failed'))

      const importRequest = {
        mode: 'import',
        data: mockCSVData,
        options: {
          skipDuplicates: true,
          updateExisting: false,
          categoryMapping: {},
          locationMapping: {}
        }
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        body: importRequest,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(importRequest),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Database connection failed')
    })

    it('should validate import request data', async () => {
      const invalidImportRequest = {
        mode: 'import',
        data: [], // Empty data
        options: {
          skipDuplicates: true,
          updateExisting: false,
          categoryMapping: {},
          locationMapping: {}
        }
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        body: invalidImportRequest,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidImportRequest),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Data array cannot be empty')
    })
  })

  describe('GET /api/inventory/import - Import Status', () => {
    it('should return import status', async () => {
      const mockStatus = {
        importId: 'import-123',
        status: 'completed',
        progress: 100,
        stats: {
          created: 2,
          updated: 0,
          skipped: 0,
          failed: 0
        },
        errors: [],
        warnings: [],
        startedAt: '2024-01-01T10:00:00Z',
        completedAt: '2024-01-01T10:05:00Z'
      }

      CSVImportService.getImportStatus.mockResolvedValue(mockStatus)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory/import?importId=import-123',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockStatus)
      expect(CSVImportService.getImportStatus).toHaveBeenCalledWith('import-123')
    })

    it('should require importId parameter', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory/import',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Import ID is required')
    })

    it('should handle import not found', async () => {
      CSVImportService.getImportStatus.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/inventory/import?importId=nonexistent',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Import not found')
    })
  })

  describe('DELETE /api/inventory/import - Cancel Import', () => {
    it('should cancel import successfully', async () => {
      CSVImportService.cancelImport.mockResolvedValue(true)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/inventory/import?importId=import-123',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Import cancelled successfully')
      expect(CSVImportService.cancelImport).toHaveBeenCalledWith('import-123')
    })

    it('should require importId parameter for cancellation', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/inventory/import',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Import ID is required')
    })

    it('should handle cancellation failure', async () => {
      CSVImportService.cancelImport.mockResolvedValue(false)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/inventory/import?importId=import-123',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Unable to cancel import')
    })
  })

  describe('Error Handling', () => {
    it('should handle unsupported HTTP methods', async () => {
      const { req } = createMocks({
        method: 'PATCH',
        url: '/api/inventory/import',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Method PATCH not allowed')
    })

    it('should handle missing mode parameter', async () => {
      const formData = new FormData()
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' })
      formData.append('file', mockFile)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Mode is required')
    })

    it('should handle invalid mode parameter', async () => {
      const formData = new FormData()
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' })
      formData.append('file', mockFile)
      formData.append('mode', 'invalid')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Invalid mode')
    })

    it('should handle service errors gracefully', async () => {
      CSVImportService.validateFile.mockRejectedValue(new Error('Service unavailable'))

      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Service unavailable')
    })
  })

  describe('File Size and Type Validation', () => {
    it('should validate file size limits', async () => {
      // Create a large file (simulate > 10MB)
      const largeContent = 'a'.repeat(11 * 1024 * 1024) // 11MB
      const mockFile = new File([largeContent], 'large.csv', { type: 'text/csv' })

      CSVImportService.validateFile.mockResolvedValue({
        valid: false,
        errors: ['File size exceeds maximum limit of 10MB']
      })

      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('File size exceeds maximum limit of 10MB')
    })

    it('should validate file type', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      CSVImportService.validateFile.mockResolvedValue({
        valid: false,
        errors: ['Invalid file type. Only CSV files are allowed.']
      })

      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('mode', 'validate')

      const { req } = createMocks({
        method: 'POST',
        url: '/api/inventory/import',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: formData
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Invalid file type. Only CSV files are allowed.')
    })
  })
})