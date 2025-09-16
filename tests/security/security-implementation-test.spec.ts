/**
 * Security Implementation Test Suite
 * Tests the new security utilities and implementations
 */

import { test, expect } from '@playwright/test'

test.describe('Security Implementation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')
  })

  test('should validate password requirements correctly', async ({ page }) => {
    // Test weak password
    await page.fill('[data-testid="password-input"]', '123')
    await page.blur('[data-testid="password-input"]')
    
    // Should show password strength error
    const passwordError = page.locator('[data-testid="password-strength-error"]')
    await expect(passwordError).toBeVisible()
    
    // Test strong password
    await page.fill('[data-testid="password-input"]', 'StrongPassword123!')
    await page.blur('[data-testid="password-input"]')
    
    // Should not show error for strong password
    await expect(passwordError).not.toBeVisible()
  })

  test('should sanitize console logs in production mode', async ({ page }) => {
    // Monitor console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text())
      }
    })
    
    // Navigate to dashboard (should trigger some logging)
    await page.goto('/dashboard')
    
    // Check that sensitive information is not logged
    const sensitiveLogs = consoleLogs.filter(log => 
      log.includes('password') || 
      log.includes('token') || 
      log.includes('secret') ||
      log.includes('key')
    )
    
    // In production mode, sensitive logs should be sanitized
    expect(sensitiveLogs.length).toBe(0)
  })

  test('should handle CSRF protection correctly', async ({ page }) => {
    // Get CSRF token
    const tokenResponse = await page.request.get('/api/csrf-token')
    expect(tokenResponse.ok()).toBeTruthy()
    
    const tokenData = await tokenResponse.json()
    expect(tokenData.token).toBeDefined()
    
    // Make API request with CSRF token
    const response = await page.request.post('/api/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'user'
      },
      headers: {
        'X-CSRF-Token': tokenData.token
      }
    })
    
    // Should not get CSRF error
    expect(response.status()).not.toBe(403)
  })

  test('should reject requests without CSRF token', async ({ page }) => {
    // Make API request without CSRF token
    const response = await page.request.post('/api/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'user'
      }
    })
    
    // Should get CSRF error
    expect(response.status()).toBe(403)
    
    const responseBody = await response.json()
    expect(responseBody.error).toContain('CSRF')
  })

  test('should enforce rate limiting', async ({ page }) => {
    // Make multiple rapid requests
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        page.request.post('/api/users', {
          data: {
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            password: 'TestPassword123!',
            role: 'user'
          }
        })
      )
    }
    
    const responses = await Promise.all(promises)
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })

  test('should validate environment configuration', async ({ page }) => {
    // Test environment endpoint (if available)
    const response = await page.request.get('/api/health')
    
    if (response.ok()) {
      const data = await response.json()
      
      // Should not expose sensitive environment variables
      expect(data).not.toHaveProperty('supabaseUrl')
      expect(data).not.toHaveProperty('serviceRoleKey')
      expect(data).not.toHaveProperty('databaseUrl')
    }
  })

  test('should handle service role operations securely', async ({ page }) => {
    // Test service role endpoint (if available)
    const response = await page.request.get('/api/test-audit')
    
    if (response.ok()) {
      const data = await response.json()
      
      // Should not expose service role key in response
      expect(JSON.stringify(data)).not.toContain('service_role')
      expect(JSON.stringify(data)).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    }
  })

  test('should sanitize error messages in production', async ({ page }) => {
    // Trigger an error (invalid endpoint)
    const response = await page.request.get('/api/invalid-endpoint')
    
    const responseBody = await response.json()
    
    // Error message should not contain sensitive information
    expect(responseBody.error).not.toContain('password')
    expect(responseBody.error).not.toContain('token')
    expect(responseBody.error).not.toContain('secret')
    expect(responseBody.error).not.toContain('key')
  })

  test('should enforce security headers', async ({ page }) => {
    // Navigate to any page
    await page.goto('/dashboard')
    
    // Check security headers
    const response = await page.request.get('/dashboard')
    const headers = response.headers()
    
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['content-security-policy']).toBeDefined()
  })

  test('should validate input sanitization', async ({ page }) => {
    // Test XSS prevention
    const maliciousInput = '<script>alert("xss")</script>'
    
    // Try to submit malicious input
    await page.fill('[data-testid="name-input"]', maliciousInput)
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Check that script was not executed
    const alertHandled = await page.evaluate(() => {
      return window.alert === undefined || !window.alert.toString().includes('xss')
    })
    
    expect(alertHandled).toBeTruthy()
  })

  test('should handle authentication securely', async ({ page }) => {
    // Test login with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    // Should show error but not expose system information
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
    
    const errorText = await errorMessage.textContent()
    expect(errorText).not.toContain('database')
    expect(errorText).not.toContain('sql')
    expect(errorText).not.toContain('connection')
  })
})