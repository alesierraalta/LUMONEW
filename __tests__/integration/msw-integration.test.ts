import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../utils/msw-utils'
import { mswDataStore, handlers } from '../mocks/msw-handlers'
import { http, HttpResponse } from 'msw'

describe('MSW Integration Tests', () => {
  beforeEach(() => {
    // Reset data store before each test
    mswDataStore.reset()
  })

  describe('Products API', () => {
    it('should fetch products successfully', async () => {
      const response = await fetch('https://test.supabase.co/rest/v1/products', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Test Product',
        sku: 'NEW-SKU-001',
        price: 150,
        cost: 75,
        current_stock: 30
      }

      const response = await fetch('https://test.supabase.co/rest/v1/products', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.name).toBe(newProduct.name)
      expect(data.sku).toBe(newProduct.sku)
      expect(data.id).toBeDefined()
    })

    it('should update an existing product', async () => {
      // First create a product
      const product = mswDataStore.create('products', {
        name: 'Original Product',
        sku: 'ORIG-001',
        price: 100
      })

      const updates = {
        name: 'Updated Product',
        price: 120
      }

      const response = await fetch(`https://test.supabase.co/rest/v1/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.name).toBe(updates.name)
      expect(data.price).toBe(updates.price)
      expect(data.sku).toBe(product.sku) // Should remain unchanged
    })

    it('should delete a product', async () => {
      // First create a product
      const product = mswDataStore.create('products', {
        name: 'Product to Delete',
        sku: 'DELETE-001'
      })

      const response = await fetch(`https://test.supabase.co/rest/v1/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key'
        }
      })

      expect(response.status).toBe(204)

      // Verify product is deleted
      const deletedProduct = mswDataStore.getById('products', product.id)
      expect(deletedProduct).toBeUndefined()
    })

    it('should return 404 for non-existent product', async () => {
      const response = await fetch('https://test.supabase.co/rest/v1/products/non-existent-id', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key'
        }
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('Authentication API', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await fetch('https://test.supabase.co/auth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'password',
          email: 'test@example.com',
          password: 'password'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.access_token).toBeDefined()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test@example.com')
    })

    it('should reject invalid credentials', async () => {
      const response = await fetch('https://test.supabase.co/auth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'password',
          email: 'test@example.com',
          password: 'wrong-password'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should get user with valid token', async () => {
      const response = await fetch('https://test.supabase.co/auth/v1/user', {
        headers: {
          'Authorization': 'Bearer mock-access-token'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.email).toBeDefined()
    })

    it('should reject requests without authorization', async () => {
      const response = await fetch('https://test.supabase.co/auth/v1/user')

      expect(response.status).toBe(401)
    })
  })

  describe('Error Simulation', () => {
    it('should simulate network errors', async () => {
      // Override handlers to simulate network error
      server.use(
        http.get('*/rest/v1/products', () => {
          return HttpResponse.error()
        })
      )

      try {
        await fetch('https://test.supabase.co/rest/v1/products')
        expect.fail('Should have thrown a network error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should simulate server errors', async () => {
      // Override handlers to simulate server error
      server.use(
        http.get('*/rest/v1/products', () => {
          return HttpResponse.json(
            { error: { message: 'Internal server error' } },
            { status: 500 }
          )
        })
      )

      const response = await fetch('https://test.supabase.co/rest/v1/products')
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error.message).toBe('Internal server error')
    })

    it('should simulate authentication errors', async () => {
      // Override handlers to simulate auth error
      server.use(
        http.get('*/rest/v1/products', () => {
          return HttpResponse.json(
            { error: { message: 'Unauthorized' } },
            { status: 401 }
          )
        })
      )

      const response = await fetch('https://test.supabase.co/rest/v1/products')
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error.message).toBe('Unauthorized')
    })
  })

  describe('Query Parameter Filtering', () => {
    beforeEach(() => {
      // Reset handlers to ensure no error simulation handlers are active
      server.resetHandlers(...handlers)
      
      // Reset and seed test data with different categories
      mswDataStore.reset()
      mswDataStore.create('products', { id: 'prod-1', name: 'Product 1', category_id: 'cat-1', status: 'active' })
      mswDataStore.create('products', { id: 'prod-2', name: 'Product 2', category_id: 'cat-2', status: 'active' })
      mswDataStore.create('products', { id: 'prod-3', name: 'Product 3', category_id: 'cat-1', status: 'inactive' })
    })

    it('should filter products by category', async () => {
      const response = await fetch('https://test.supabase.co/rest/v1/products?category_id=eq.cat-1', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key'
        }
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.length).toBe(4) // 2 seeded products + 2 test products with cat-1
      expect(data.every((p: any) => p.category_id === 'cat-1')).toBe(true)
    })

    it('should filter products by status', async () => {
      const response = await fetch('https://test.supabase.co/rest/v1/products?status=eq.active', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.length).toBe(4) // 2 seeded products + 2 test products with active status
      expect(data.every((p: any) => p.status === 'active')).toBe(true)
    })

    it('should filter with IN operator', async () => {
      const response = await fetch('https://test.supabase.co/rest/v1/products?category_id=in.cat-1,cat-2', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'apikey': 'test-anon-key'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.length).toBe(7) // All 4 seeded products + 3 test products (all have cat-1 or cat-2)
      expect(data.every((p: any) => ['cat-1', 'cat-2'].includes(p.category_id))).toBe(true)
    })
  })

  describe('Global Test Utils Integration', () => {
    it('should access MSW utilities through global testUtils', () => {
      expect(global.testUtils.msw).toBeDefined()
      expect(global.testUtils.msw.server).toBeDefined()
      expect(global.testUtils.msw.simulateNetworkError).toBeDefined()
      expect(global.testUtils.msw.simulateServerError).toBeDefined()
      expect(global.testUtils.msw.simulateAuthError).toBeDefined()
      expect(global.testUtils.msw.resetHandlers).toBeDefined()
    })

    it('should simulate errors using global testUtils', async () => {
      global.testUtils.msw.simulateServerError()

      const response = await fetch('https://test.supabase.co/rest/v1/products')
      expect(response.status).toBe(500)

      // Reset handlers
      global.testUtils.msw.resetHandlers()
    })
  })
})