import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST, DELETE } from '@/app/api/transactions/route'
import { transactionService } from '@/lib/database'

// Mock the database services
vi.mock('@/lib/database', () => ({
  transactionService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteAll: vi.fn(),
    getByDateRange: vi.fn(),
    getByType: vi.fn(),
    getByUser: vi.fn()
  }
}))

describe('/api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/transactions', () => {
    it('should return all transactions successfully', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'sale',
          subtotal: 100.00,
          tax: 8.00,
          tax_rate: 0.08,
          total: 108.00,
          notes: 'Test sale transaction',
          created_by: 'user1',
          status: 'completed',
          created_at: new Date().toISOString(),
          transaction_items: [
            {
              id: 'item1',
              product_id: 'prod1',
              product_sku: 'SKU-001',
              product_name: 'Test Product',
              quantity: 2,
              unit_price: 50.00,
              total_price: 100.00,
              notes: null
            }
          ]
        },
        {
          id: '2',
          type: 'stock_addition',
          subtotal: 200.00,
          tax: 0.00,
          tax_rate: 0.00,
          total: 200.00,
          notes: 'Stock replenishment',
          created_by: 'user2',
          status: 'completed',
          created_at: new Date().toISOString(),
          transaction_items: [
            {
              id: 'item2',
              product_id: 'prod2',
              product_sku: 'SKU-002',
              product_name: 'Another Product',
              quantity: 4,
              unit_price: 50.00,
              total_price: 200.00,
              notes: 'Bulk purchase'
            }
          ]
        }
      ]

      vi.mocked(transactionService.getAll).mockResolvedValue(mockTransactions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(transactionService.getAll).toHaveBeenCalledWith(50) // Default limit
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockTransactions)
    })

    it('should respect custom limit parameter', async () => {
      const mockTransactions: any[] = []
      vi.mocked(transactionService.getAll).mockResolvedValue(mockTransactions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?limit=25'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(transactionService.getAll).toHaveBeenCalledWith(25)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockTransactions)
    })

    it('should filter by transaction type', async () => {
      const mockSaleTransactions = [
        {
          id: '1',
          type: 'sale',
          subtotal: 100.00,
          tax: 8.00,
          tax_rate: 0.08,
          total: 108.00,
          status: 'completed',
          transaction_items: []
        }
      ]

      vi.mocked(transactionService.getByType).mockResolvedValue(mockSaleTransactions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?type=sale'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(transactionService.getByType).toHaveBeenCalledWith('sale', 50)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSaleTransactions)
    })

    it('should filter by user', async () => {
      const mockUserTransactions = [
        {
          id: '1',
          type: 'sale',
          created_by: 'user123',
          status: 'completed',
          transaction_items: []
        }
      ]

      vi.mocked(transactionService.getByUser).mockResolvedValue(mockUserTransactions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?user=user123'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(transactionService.getByUser).toHaveBeenCalledWith('user123', 50)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUserTransactions)
    })

    it('should filter by date range', async () => {
      const mockDateRangeTransactions = [
        {
          id: '1',
          type: 'sale',
          created_at: '2024-01-15T10:00:00Z',
          status: 'completed',
          transaction_items: []
        }
      ]

      vi.mocked(transactionService.getByDateRange).mockResolvedValue(mockDateRangeTransactions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?startDate=2024-01-01&endDate=2024-01-31'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(transactionService.getByDateRange).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      )
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockDateRangeTransactions)
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(transactionService.getAll).mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch transactions')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/transactions', () => {
    it('should create a new transaction successfully', async () => {
      const newTransaction = {
        type: 'sale',
        subtotal: 150.00,
        tax: 12.00,
        tax_rate: 0.08,
        total: 162.00,
        notes: 'New sale transaction',
        created_by: 'user1',
        status: 'completed',
        line_items: [
          {
            product_id: 'prod1',
            product_sku: 'SKU-001',
            product_name: 'Test Product',
            quantity: 3,
            unit_price: 50.00,
            total_price: 150.00,
            notes: 'Bulk discount applied'
          }
        ]
      }

      const createdTransaction = {
        id: '123',
        ...newTransaction,
        created_at: new Date().toISOString(),
        transaction_items: newTransaction.line_items.map(item => ({
          id: 'item123',
          transaction_id: '123',
          ...item
        }))
      }

      vi.mocked(transactionService.create).mockResolvedValue(createdTransaction)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: newTransaction
      })

      const response = await POST(req)
      const data = await response.json()

      expect(transactionService.create).toHaveBeenCalledWith(newTransaction)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdTransaction)
    })

    it('should validate required fields', async () => {
      const incompleteTransaction = {
        type: 'sale',
        subtotal: 100.00
        // Missing required fields: tax, tax_rate, total, created_by, line_items
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: incompleteTransaction
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
      expect(data.message).toContain('tax')
      expect(data.message).toContain('tax_rate')
      expect(data.message).toContain('total')
      expect(data.message).toContain('created_by')
      expect(data.message).toContain('line_items')
    })

    it('should validate transaction type', async () => {
      const invalidTransaction = {
        type: 'invalid_type',
        subtotal: 100.00,
        tax: 8.00,
        tax_rate: 0.08,
        total: 108.00,
        created_by: 'user1',
        line_items: []
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid transaction type')
    })

    it('should validate numeric fields', async () => {
      const invalidTransaction = {
        type: 'sale',
        subtotal: -100.00, // Invalid negative subtotal
        tax: 8.00,
        tax_rate: 0.08,
        total: 108.00,
        created_by: 'user1',
        line_items: []
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Subtotal must be a non-negative number')
    })

    it('should validate line items', async () => {
      const invalidTransaction = {
        type: 'sale',
        subtotal: 100.00,
        tax: 8.00,
        tax_rate: 0.08,
        total: 108.00,
        created_by: 'user1',
        line_items: [] // Empty line items
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('At least one line item is required')
    })

    it('should handle creation errors', async () => {
      const newTransaction = {
        type: 'sale',
        subtotal: 100.00,
        tax: 8.00,
        tax_rate: 0.08,
        total: 108.00,
        created_by: 'user1',
        line_items: [
          {
            product_id: 'prod1',
            product_sku: 'SKU-001',
            product_name: 'Test Product',
            quantity: 2,
            unit_price: 50.00,
            total_price: 100.00
          }
        ]
      }

      vi.mocked(transactionService.create).mockRejectedValue(new Error('Insufficient inventory'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: newTransaction
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create transaction')
      expect(data.message).toBe('Insufficient inventory')
    })
  })

  describe('DELETE /api/transactions', () => {
    it('should delete a specific transaction successfully', async () => {
      vi.mocked(transactionService.delete).mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(transactionService.delete).toHaveBeenCalledWith('123')
      expect(data.success).toBe(true)
      expect(data.message).toBe('Transaction deleted successfully')
    })

    it('should delete all transactions when deleteAll=true', async () => {
      vi.mocked(transactionService.deleteAll).mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions?deleteAll=true'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(transactionService.deleteAll).toHaveBeenCalledOnce()
      expect(data.success).toBe(true)
      expect(data.message).toBe('All transactions deleted successfully')
    })

    it('should require transaction ID when not deleting all', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Transaction ID is required')
    })

    it('should handle deletion errors', async () => {
      vi.mocked(transactionService.delete).mockRejectedValue(new Error('Transaction not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete transaction')
      expect(data.message).toBe('Transaction not found')
    })

    it('should handle delete all errors', async () => {
      vi.mocked(transactionService.deleteAll).mockRejectedValue(new Error('Database constraint violation'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions?deleteAll=true'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete all transactions')
      expect(data.message).toBe('Database constraint violation')
    })
  })
})