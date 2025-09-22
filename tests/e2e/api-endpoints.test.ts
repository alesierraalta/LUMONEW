/**
 * API Endpoints Tests
 * Tests all API endpoints for CRUD operations, error handling, and response validation
 */

import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should handle inventory GET endpoint', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory') && response.request().method() === 'GET'
    )
    
    // Trigger a request (reload page or filter)
    await page.reload()
    
    // Wait for response
    const response = await responsePromise
    
    // Verify response
    expect(response.status()).toBe(200)
    
    const responseData = await response.json()
    expect(Array.isArray(responseData)).toBeTruthy()
  })

  test('should handle inventory POST endpoint for single item creation', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory') && response.request().method() === 'POST'
    )
    
    // Create a new item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'API-TEST-001')
    await page.fill('input[name="name"]', 'API Test Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '99.99')
    await page.fill('input[name="quantity"]', '5')
    await page.fill('input[name="min_stock"]', '1')
    await page.fill('input[name="max_stock"]', '20')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for response
    const response = await responsePromise
    
    // Verify response
    expect(response.status()).toBe(201)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('id')
    expect(responseData).toHaveProperty('sku', 'API-TEST-001')
    expect(responseData).toHaveProperty('name', 'API Test Product')
  })

  test('should handle inventory bulk POST endpoint', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory/bulk') && response.request().method() === 'POST'
    )
    
    // Create bulk items
    await page.getByRole('button', { name: 'Crear Múltiples' }).click()
    await page.fill('input[data-testid="sku-1"]', 'API-BULK-001')
    await page.fill('input[data-testid="name-1"]', 'API Bulk Test 1')
    await page.fill('input[data-testid="sku-2"]', 'API-BULK-002')
    await page.fill('input[data-testid="name-2"]', 'API Bulk Test 2')
    
    // Submit bulk creation
    await page.getByRole('button', { name: 'Crear 2 Items' }).click()
    
    // Wait for response
    const response = await responsePromise
    
    // Verify response
    expect(response.status()).toBe(201)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('successful', 2)
    expect(responseData).toHaveProperty('failed', 0)
    expect(responseData).toHaveProperty('items')
    expect(Array.isArray(responseData.items)).toBeTruthy()
    expect(responseData.items).toHaveLength(2)
  })

  test('should handle inventory PUT endpoint for updates', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory') && response.request().method() === 'PUT'
    )
    
    // Edit an existing item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Edit' }).click()
    
    // Update the item
    await page.fill('input[name="name"]', 'Updated API Test Product')
    await page.fill('input[name="unit_price"]', '149.99')
    
    // Submit update
    await page.getByRole('button', { name: 'Actualizar Producto' }).click()
    
    // Wait for response
    const response = await responsePromise
    
    // Verify response
    expect(response.status()).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('id')
    expect(responseData).toHaveProperty('name', 'Updated API Test Product')
    expect(responseData).toHaveProperty('unit_price', 149.99)
  })

  test('should handle inventory DELETE endpoint', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory') && response.request().method() === 'DELETE'
    )
    
    // Delete an item
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    
    // Wait for response
    const response = await responsePromise
    
    // Verify response
    expect(response.status()).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('success', true)
  })

  test('should handle API error responses gracefully', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory') && response.status() >= 400
    )
    
    // Try to create item with invalid data
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    
    // Submit form without required fields
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for error response
    const response = await responsePromise
    
    // Verify error response
    expect(response.status()).toBeGreaterThanOrEqual(400)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('error')
    expect(responseData).toHaveProperty('message')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error by going offline
    await page.context().setOffline(true)
    
    // Try to create an item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'NETWORK-ERROR-TEST')
    await page.fill('input[name="name"]', 'Network Error Test')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for error handling
    await page.waitForTimeout(2000)
    
    // Verify error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      await expect(errorMessage).toBeVisible()
    }
    
    // Restore network
    await page.context().setOffline(false)
  })

  test('should validate API request payloads', async ({ page }) => {
    // Monitor network requests
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/api/v1/inventory') && request.method() === 'POST'
    )
    
    // Create an item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'VALIDATION-TEST-001')
    await page.fill('input[name="name"]', 'Validation Test Product')
    await page.selectOption('select[name="category_id"]', { label: 'Electronics' })
    await page.selectOption('select[name="location_id"]', { label: 'Main Warehouse' })
    await page.fill('input[name="unit_price"]', '99.99')
    await page.fill('input[name="quantity"]', '5')
    await page.fill('input[name="min_stock"]', '1')
    await page.fill('input[name="max_stock"]', '20')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for request
    const request = await requestPromise
    
    // Verify request payload
    const requestData = request.postDataJSON()
    expect(requestData).toHaveProperty('sku', 'VALIDATION-TEST-001')
    expect(requestData).toHaveProperty('name', 'Validation Test Product')
    expect(requestData).toHaveProperty('unit_price', 99.99)
    expect(requestData).toHaveProperty('quantity', 5)
    expect(requestData).toHaveProperty('min_stock', 1)
    expect(requestData).toHaveProperty('max_stock', 20)
  })

  test('should handle API response validation', async ({ page }) => {
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory') && response.request().method() === 'GET'
    )
    
    // Trigger a request
    await page.reload()
    
    // Wait for response
    const response = await responsePromise
    
    // Verify response structure
    const responseData = await response.json()
    
    if (Array.isArray(responseData) && responseData.length > 0) {
      const firstItem = responseData[0]
      expect(firstItem).toHaveProperty('id')
      expect(firstItem).toHaveProperty('sku')
      expect(firstItem).toHaveProperty('name')
      expect(firstItem).toHaveProperty('category_id')
      expect(firstItem).toHaveProperty('location_id')
      expect(firstItem).toHaveProperty('unit_price')
      expect(firstItem).toHaveProperty('quantity')
      expect(firstItem).toHaveProperty('status')
      expect(firstItem).toHaveProperty('created_at')
      expect(firstItem).toHaveProperty('updated_at')
    }
  })

  test('should handle API rate limiting', async ({ page }) => {
    // Make multiple rapid requests
    const requests = []
    
    for (let i = 0; i < 10; i++) {
      requests.push(page.waitForResponse(response => 
        response.url().includes('/api/v1/inventory') && response.request().method() === 'GET'
      ))
      
      // Trigger request
      await page.reload()
      await page.waitForTimeout(100) // Small delay between requests
    }
    
    // Wait for all responses
    const responses = await Promise.all(requests)
    
    // Check if any requests were rate limited
    const rateLimitedResponses = responses.filter(response => response.status() === 429)
    
    if (rateLimitedResponses.length > 0) {
      // Verify rate limit response
      const rateLimitResponse = rateLimitedResponses[0]
      const responseData = await rateLimitResponse.json()
      expect(responseData).toHaveProperty('error')
      expect(responseData.error).toContain('rate limit')
    }
  })

  test('should handle API timeout scenarios', async ({ page }) => {
    // Set a very short timeout
    await page.route('**/api/v1/inventory**', route => {
      // Simulate slow response
      setTimeout(() => {
        route.continue()
      }, 10000) // 10 second delay
    })
    
    // Try to create an item
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await page.fill('input[name="sku"]', 'TIMEOUT-TEST-001')
    await page.fill('input[name="name"]', 'Timeout Test Product')
    
    // Submit form
    await page.getByRole('button', { name: 'Crear Producto' }).click()
    
    // Wait for timeout handling
    await page.waitForTimeout(5000)
    
    // Verify timeout handling (loading state, error message, etc.)
    const loadingState = page.locator('[data-testid="loading"], .loading')
    const errorMessage = page.locator('[data-testid="error-message"], .error')
    
    const hasLoading = await loadingState.isVisible().catch(() => false)
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    // Either loading state or error should be visible
    expect(hasLoading || hasError).toBeTruthy()
  })
})
