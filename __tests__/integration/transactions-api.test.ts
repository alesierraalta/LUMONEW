import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import handler from '@/app/api/transactions/route'
import { auditedTransactionService } from '@/lib/database-with-audit'

// Mock the database service
vi.mock('@/lib/database-with-audit', () => ({
  auditedTransactionService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getByType: vi.fn(),
    getByDateRange: vi.fn(),
    getByUser: vi.fn(),
    getAnalytics: vi.fn(),
    getTransactionItems: vi.fn(),
    addTransactionItem: vi.fn(),
    updateTransactionItem: vi.fn(),
    removeTransactionItem: vi.fn(),
  }
}))

describe('/api/transactions - Integration Tests', () => {
  const mockTransactions = [
    {
      id: 'trans-1',
      type: 'sale',
      status: 'completed',
      subtotal: 100.00,
      tax: 8.50,
      tax_rate: 0.085,
      total: 108.50,
      notes: 'Customer purchase',
      user_id: 'user-1',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      line_items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
          product_sku: 'TEST-001',
          product_name: 'Test Product 1',
          quantity: 2,
          unit_price: 50.00,
          total_price: 100.00,
          notes: ''
        }
      ]
    },
    {
      id: 'trans-2',
      type: 'stock_addition',
      status: 'completed',
      subtotal: 75.00,
      tax: 0.00,
      tax_rate: 0.00,
      total: 75.00,
      notes: 'Stock replenishment',
      user_id: 'user-1',
      created_at: '2024-01-02T14:30:00Z',
      updated_at: '2024-01-02T14:30:00Z',
      line_items: [
        {
          id: 'item-2',
          product_id: 'prod-2',
          product_sku: 'TEST-002',
          product_name: 'Test Product 2',
          quantity: 5,
          unit_price: 15.00,
          total_price: 75.00,
          notes: ''
        }
      ]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/transactions', () => {
    it('should return all transactions with default pagination', async () => {
      auditedTransactionService.getAll.mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.transactions).toEqual(mockTransactions)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
      expect(auditedTransactionService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
    })

    it('should handle custom pagination parameters', async () => {
      auditedTransactionService.getAll.mockResolvedValue({
        transactions: [mockTransactions[0]],
        total: 1,
        page: 2,
        limit: 1,
        totalPages: 2
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?page=2&limit=1&sortBy=total&sortOrder=asc',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(2)
      expect(data.limit).toBe(1)
      expect(auditedTransactionService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 1,
        sortBy: 'total',
        sortOrder: 'asc'
      })
    })

    it('should filter by transaction type', async () => {
      auditedTransactionService.getByType.mockResolvedValue({
        transactions: [mockTransactions[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?type=sale',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedTransactionService.getByType).toHaveBeenCalledWith('sale', {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
    })

    it('should filter by date range', async () => {
      auditedTransactionService.getByDateRange.mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?startDate=2024-01-01&endDate=2024-01-31',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedTransactionService.getByDateRange).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31',
        {
          page: 1,
          limit: 10,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      )
    })

    it('should filter by user', async () => {
      auditedTransactionService.getByUser.mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?userId=user-1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedTransactionService.getByUser).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
    })

    it('should handle server errors', async () => {
      auditedTransactionService.getAll.mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Database connection failed')
    })

    it('should validate pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?page=0&limit=0',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Page must be greater than 0')
    })

    it('should validate sort parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?sortBy=invalid_field',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid sort field')
    })

    it('should validate date format', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?startDate=invalid-date',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid date format')
    })
  })

  describe('POST /api/transactions', () => {
    const validTransaction = {
      type: 'sale',
      notes: 'Customer purchase',
      subtotal: 100.00,
      tax: 8.50,
      tax_rate: 0.085,
      total: 108.50,
      line_items: [
        {
          product_id: 'prod-1',
          product_sku: 'TEST-001',
          product_name: 'Test Product 1',
          quantity: 2,
          unit_price: 50.00,
          total_price: 100.00,
          notes: ''
        }
      ]
    }

    it('should create a new transaction successfully', async () => {
      const createdTransaction = {
        id: 'trans-3',
        ...validTransaction,
        status: 'completed',
        user_id: 'user-1',
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T10:00:00Z'
      }
      auditedTransactionService.create.mockResolvedValue(createdTransaction)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: validTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(validTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdTransaction)
      expect(auditedTransactionService.create).toHaveBeenCalledWith(validTransaction)
    })

    it('should validate required fields', async () => {
      const invalidTransaction = {
        // Missing required fields: type, line_items
        notes: 'Test transaction'
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Transaction type is required')
    })

    it('should validate transaction type', async () => {
      const invalidTransaction = {
        ...validTransaction,
        type: 'invalid_type'
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid transaction type')
    })

    it('should validate line items', async () => {
      const invalidTransaction = {
        ...validTransaction,
        line_items: [] // Empty line items
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('At least one line item is required')
    })

    it('should validate line item data', async () => {
      const invalidTransaction = {
        ...validTransaction,
        line_items: [
          {
            // Missing required fields
            quantity: 1
          }
        ]
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Product ID is required')
    })

    it('should validate numeric fields', async () => {
      const invalidTransaction = {
        ...validTransaction,
        subtotal: 'invalid',
        tax: 'not-a-number'
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Subtotal must be a number')
    })

    it('should validate price calculations', async () => {
      const invalidTransaction = {
        ...validTransaction,
        subtotal: 100.00,
        tax: 10.00,
        total: 95.00 // Incorrect total
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: invalidTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Total does not match subtotal + tax')
    })

    it('should handle creation errors', async () => {
      auditedTransactionService.create.mockRejectedValue(new Error('Inventory insufficient'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: validTransaction,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(validTransaction),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('Inventory insufficient')
    })
  })

  describe('PUT /api/transactions', () => {
    const updateData = {
      notes: 'Updated transaction notes',
      status: 'cancelled'
    }

    it('should update a transaction successfully', async () => {
      const updatedTransaction = {
        ...mockTransactions[0],
        ...updateData,
        updated_at: '2024-01-03T10:00:00Z'
      }
      auditedTransactionService.update.mockResolvedValue(updatedTransaction)

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/transactions?id=trans-1',
        body: updateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedTransaction)
      expect(auditedTransactionService.update).toHaveBeenCalledWith('trans-1', updateData)
    })

    it('should require transaction ID for updates', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/transactions',
        body: updateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Transaction ID is required for updates')
    })

    it('should validate status values', async () => {
      const invalidUpdate = {
        status: 'invalid_status'
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/transactions?id=trans-1',
        body: invalidUpdate,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(invalidUpdate),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid status value')
    })

    it('should handle transaction not found', async () => {
      auditedTransactionService.update.mockRejectedValue(new Error('Transaction not found'))

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/transactions?id=nonexistent',
        body: updateData,
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
      expect(data.message).toBe('Transaction not found')
    })
  })

  describe('DELETE /api/transactions', () => {
    it('should delete a transaction successfully', async () => {
      auditedTransactionService.delete.mockResolvedValue(true)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions?id=trans-1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Transaction deleted successfully')
      expect(auditedTransactionService.delete).toHaveBeenCalledWith('trans-1')
    })

    it('should require transaction ID for deletion', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Transaction ID is required for deletion')
    })

    it('should handle deletion restrictions', async () => {
      auditedTransactionService.delete.mockRejectedValue(new Error('Cannot delete completed transaction'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/transactions?id=trans-1',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('Cannot delete completed transaction')
    })
  })

  describe('GET /api/transactions - Analytics', () => {
    it('should return transaction analytics', async () => {
      const mockAnalytics = {
        totalTransactions: 150,
        totalValue: 25000.00,
        averageTransactionValue: 166.67,
        transactionsByType: [
          { type: 'sale', count: 100, value: 20000.00 },
          { type: 'stock_addition', count: 50, value: 5000.00 }
        ],
        transactionsByDay: [
          { date: '2024-01-01', count: 5, value: 1000.00 },
          { date: '2024-01-02', count: 8, value: 1500.00 }
        ]
      }
      auditedTransactionService.getAnalytics.mockResolvedValue(mockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?analytics=true',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalytics)
      expect(auditedTransactionService.getAnalytics).toHaveBeenCalledWith({})
    })

    it('should return analytics with date range', async () => {
      const mockAnalytics = {
        totalTransactions: 50,
        totalValue: 10000.00,
        averageTransactionValue: 200.00,
        transactionsByType: [
          { type: 'sale', count: 30, value: 8000.00 },
          { type: 'stock_addition', count: 20, value: 2000.00 }
        ]
      }
      auditedTransactionService.getAnalytics.mockResolvedValue(mockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/transactions?analytics=true&startDate=2024-01-01&endDate=2024-01-31',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedTransactionService.getAnalytics).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      })
    })
  })

  describe('Method Not Allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req } = createMocks({
        method: 'PATCH',
        url: '/api/transactions',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('Method PATCH not allowed')
    })
  })

  describe('Content-Type Validation', () => {
    it('should validate JSON content type for POST requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: 'invalid json',
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid JSON')
    })

    it('should handle missing content type for POST requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/transactions',
        body: '{}',
      })

      const request = new NextRequest(req.url, {
        method: req.method,
        body: '{}'
      })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Content-Type must be application/json')
    })
  })
})