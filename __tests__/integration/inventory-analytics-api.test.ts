import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import handler from '@/app/api/v1/inventory/analytics/route'
import { inventoryService } from '@/lib/database'
import { auditedInventoryService } from '@/lib/database-with-audit'

// Mock the database services
vi.mock('@/lib/database', () => ({
  inventoryService: {
    getAnalytics: vi.fn(),
    getCategoryAnalytics: vi.fn(),
    getLocationAnalytics: vi.fn(),
    getLowStockAnalytics: vi.fn(),
    getValueAnalytics: vi.fn(),
    getTrendAnalytics: vi.fn(),
    getPerformanceMetrics: vi.fn(),
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    getAnalytics: vi.fn(),
    getCategoryAnalytics: vi.fn(),
    getLocationAnalytics: vi.fn(),
    getLowStockAnalytics: vi.fn(),
    getValueAnalytics: vi.fn(),
    getTrendAnalytics: vi.fn(),
    getPerformanceMetrics: vi.fn(),
  }
}))

describe('/api/v1/inventory/analytics - Integration Tests', () => {
  const mockAnalytics = {
    totalItems: 150,
    totalValue: 45000.50,
    lowStockItems: 12,
    outOfStockItems: 3,
    averageValue: 300.00,
    categoryDistribution: [
      { category: 'Electronics', count: 45, value: 18000.00 },
      { category: 'Clothing', count: 60, value: 12000.00 },
      { category: 'Books', count: 45, value: 15000.50 }
    ],
    locationDistribution: [
      { location: 'Warehouse A', count: 80, value: 25000.00 },
      { location: 'Warehouse B', count: 70, value: 20000.50 }
    ],
    monthlyTrends: [
      { month: '2024-01', itemsAdded: 25, itemsRemoved: 5, netChange: 20 },
      { month: '2024-02', itemsAdded: 30, itemsRemoved: 8, netChange: 22 },
      { month: '2024-03', itemsAdded: 20, itemsRemoved: 3, netChange: 17 }
    ],
    performanceMetrics: {
      turnoverRate: 4.2,
      accuracyRate: 98.5,
      fulfillmentTime: 2.3,
      stockoutRate: 5.8
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/inventory/analytics - General Analytics', () => {
    it('should return general inventory analytics', async () => {
      auditedInventoryService.getAnalytics.mockResolvedValue(mockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalytics)
      expect(auditedInventoryService.getAnalytics).toHaveBeenCalledWith({})
    })

    it('should return analytics with date range filter', async () => {
      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      }
      auditedInventoryService.getAnalytics.mockResolvedValue(mockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: `/api/v1/inventory/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getAnalytics).toHaveBeenCalledWith({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
    })

    it('should return analytics with category filter', async () => {
      auditedInventoryService.getAnalytics.mockResolvedValue({
        ...mockAnalytics,
        categoryDistribution: [mockAnalytics.categoryDistribution[0]]
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?category=Electronics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getAnalytics).toHaveBeenCalledWith({
        category: 'Electronics'
      })
    })

    it('should return analytics with location filter', async () => {
      auditedInventoryService.getAnalytics.mockResolvedValue({
        ...mockAnalytics,
        locationDistribution: [mockAnalytics.locationDistribution[0]]
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?location=Warehouse A',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getAnalytics).toHaveBeenCalledWith({
        location: 'Warehouse A'
      })
    })

    it('should handle analytics service errors', async () => {
      auditedInventoryService.getAnalytics.mockRejectedValue(new Error('Analytics service unavailable'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Analytics service unavailable')
    })

    it('should validate date range format', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?startDate=invalid-date&endDate=2024-03-31',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid date format')
    })

    it('should validate date range order', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?startDate=2024-03-31&endDate=2024-01-01',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Start date must be before end date')
    })
  })

  describe('GET /api/v1/inventory/analytics - Category Analytics', () => {
    it('should return category-specific analytics', async () => {
      const categoryAnalytics = {
        category: 'Electronics',
        totalItems: 45,
        totalValue: 18000.00,
        averageValue: 400.00,
        lowStockItems: 5,
        topItems: [
          { name: 'Laptop', sku: 'LAP-001', quantity: 10, value: 8000.00 },
          { name: 'Phone', sku: 'PHN-001', quantity: 15, value: 6000.00 }
        ]
      }
      auditedInventoryService.getCategoryAnalytics.mockResolvedValue(categoryAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=category&category=Electronics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(categoryAnalytics)
      expect(auditedInventoryService.getCategoryAnalytics).toHaveBeenCalledWith('Electronics')
    })

    it('should require category parameter for category analytics', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=category',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Category is required for category analytics')
    })
  })

  describe('GET /api/v1/inventory/analytics - Location Analytics', () => {
    it('should return location-specific analytics', async () => {
      const locationAnalytics = {
        location: 'Warehouse A',
        totalItems: 80,
        totalValue: 25000.00,
        averageValue: 312.50,
        lowStockItems: 8,
        topCategories: [
          { category: 'Electronics', count: 30, value: 15000.00 },
          { category: 'Clothing', count: 50, value: 10000.00 }
        ]
      }
      auditedInventoryService.getLocationAnalytics.mockResolvedValue(locationAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=location&location=Warehouse A',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(locationAnalytics)
      expect(auditedInventoryService.getLocationAnalytics).toHaveBeenCalledWith('Warehouse A')
    })

    it('should require location parameter for location analytics', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=location',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Location is required for location analytics')
    })
  })

  describe('GET /api/v1/inventory/analytics - Low Stock Analytics', () => {
    it('should return low stock analytics', async () => {
      const lowStockAnalytics = {
        totalLowStockItems: 12,
        criticalItems: 3,
        warningItems: 9,
        lowStockValue: 5000.00,
        items: [
          {
            id: '1',
            name: 'Critical Item 1',
            sku: 'CRIT-001',
            quantity: 1,
            min_quantity: 5,
            unit_price: 100.00,
            category: 'Electronics',
            location: 'Warehouse A'
          },
          {
            id: '2',
            name: 'Warning Item 1',
            sku: 'WARN-001',
            quantity: 3,
            min_quantity: 5,
            unit_price: 50.00,
            category: 'Clothing',
            location: 'Warehouse B'
          }
        ]
      }
      auditedInventoryService.getLowStockAnalytics.mockResolvedValue(lowStockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=lowStock',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(lowStockAnalytics)
      expect(auditedInventoryService.getLowStockAnalytics).toHaveBeenCalledWith({})
    })

    it('should return low stock analytics with threshold filter', async () => {
      const lowStockAnalytics = {
        totalLowStockItems: 8,
        criticalItems: 2,
        warningItems: 6,
        lowStockValue: 3000.00,
        items: []
      }
      auditedInventoryService.getLowStockAnalytics.mockResolvedValue(lowStockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=lowStock&threshold=10',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(auditedInventoryService.getLowStockAnalytics).toHaveBeenCalledWith({
        threshold: 10
      })
    })
  })

  describe('GET /api/v1/inventory/analytics - Value Analytics', () => {
    it('should return value analytics', async () => {
      const valueAnalytics = {
        totalValue: 45000.50,
        averageValue: 300.00,
        medianValue: 250.00,
        highestValueItems: [
          { name: 'Expensive Item 1', sku: 'EXP-001', unit_price: 1000.00, quantity: 5 },
          { name: 'Expensive Item 2', sku: 'EXP-002', unit_price: 800.00, quantity: 3 }
        ],
        lowestValueItems: [
          { name: 'Cheap Item 1', sku: 'CHP-001', unit_price: 5.99, quantity: 100 },
          { name: 'Cheap Item 2', sku: 'CHP-002', unit_price: 10.00, quantity: 50 }
        ],
        valueDistribution: [
          { range: '0-50', count: 60, percentage: 40 },
          { range: '51-200', count: 45, percentage: 30 },
          { range: '201-500', count: 30, percentage: 20 },
          { range: '501+', count: 15, percentage: 10 }
        ]
      }
      auditedInventoryService.getValueAnalytics.mockResolvedValue(valueAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=value',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(valueAnalytics)
      expect(auditedInventoryService.getValueAnalytics).toHaveBeenCalledWith({})
    })
  })

  describe('GET /api/v1/inventory/analytics - Trend Analytics', () => {
    it('should return trend analytics', async () => {
      const trendAnalytics = {
        period: 'monthly',
        trends: [
          { period: '2024-01', itemsAdded: 25, itemsRemoved: 5, netChange: 20 },
          { period: '2024-02', itemsAdded: 30, itemsRemoved: 8, netChange: 22 },
          { period: '2024-03', itemsAdded: 20, itemsRemoved: 3, netChange: 17 }
        ],
        summary: {
          totalAdded: 75,
          totalRemoved: 16,
          netGrowth: 59,
          growthRate: 12.5
        }
      }
      auditedInventoryService.getTrendAnalytics.mockResolvedValue(trendAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=trend&period=monthly',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(trendAnalytics)
      expect(auditedInventoryService.getTrendAnalytics).toHaveBeenCalledWith({
        period: 'monthly'
      })
    })

    it('should validate trend period parameter', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=trend&period=invalid',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Invalid period value')
    })
  })

  describe('GET /api/v1/inventory/analytics - Performance Metrics', () => {
    it('should return performance metrics', async () => {
      const performanceMetrics = {
        turnoverRate: 4.2,
        accuracyRate: 98.5,
        fulfillmentTime: 2.3,
        stockoutRate: 5.8,
        cycleCountAccuracy: 97.2,
        receivingAccuracy: 99.1,
        shippingAccuracy: 98.8,
        kpis: {
          onTimeDelivery: 95.5,
          orderAccuracy: 98.2,
          inventoryAccuracy: 97.8,
          costPerTransaction: 12.50
        }
      }
      auditedInventoryService.getPerformanceMetrics.mockResolvedValue(performanceMetrics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=performance',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(performanceMetrics)
      expect(auditedInventoryService.getPerformanceMetrics).toHaveBeenCalledWith({})
    })
  })

  describe('Error Handling', () => {
    it('should handle unsupported analytics type', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics?type=unsupported',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Unsupported analytics type')
    })

    it('should return 405 for non-GET methods', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/v1/inventory/analytics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('Only GET method is allowed')
    })

    it('should handle database connection errors', async () => {
      auditedInventoryService.getAnalytics.mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Database connection failed')
    })

    it('should handle analytics timeout', async () => {
      auditedInventoryService.getAnalytics.mockRejectedValue(new Error('Analytics query timeout'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Analytics query timeout')
    })
  })

  describe('Caching and Performance', () => {
    it('should include cache headers for analytics responses', async () => {
      auditedInventoryService.getAnalytics.mockResolvedValue(mockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics',
      })

      const request = new NextRequest(req.url, { method: req.method })
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toContain('max-age=300') // 5 minutes cache
      expect(response.headers.get('ETag')).toBeTruthy()
    })

    it('should handle conditional requests with ETag', async () => {
      auditedInventoryService.getAnalytics.mockResolvedValue(mockAnalytics)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/v1/inventory/analytics',
        headers: {
          'If-None-Match': '"analytics-v1"'
        }
      })

      const request = new NextRequest(req.url, { 
        method: req.method,
        headers: req.headers
      })
      const response = await handler(request)

      // Should return 304 Not Modified if ETag matches
      expect(response.status).toBe(304)
    })
  })
})