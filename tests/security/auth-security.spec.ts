import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const TEST_USER = {
  email: 'test-security@example.com',
  password: 'TestPassword123!',
  name: 'Security Test User'
}

const ADMIN_USER = {
  email: 'alesierraalta@gmail.com',
  password: 'admin123',
  name: 'Security Admin User'
}

test.describe('Authentication Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should prevent access to admin routes for non-admin users', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', TEST_USER.email)
    await page.fill('[data-testid="password"]', TEST_USER.password)
    await page.click('[data-testid="login-button"]')
    
    // Wait for successful login
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Try to access admin route
    await page.goto('/admin/users')
    
    // Should be redirected to unauthorized page
    await expect(page).toHaveURL(/.*\/unauthorized/)
    await expect(page.locator('text=Access Denied')).toBeVisible()
  })

  test('should allow admin users to access admin routes', async ({ page }) => {
    // Login as admin user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', ADMIN_USER.email)
    await page.fill('[data-testid="password"]', ADMIN_USER.password)
    await page.click('[data-testid="login-button"]')
    
    // Wait for successful login
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Access admin route
    await page.goto('/admin/users')
    
    // Should be able to access admin page
    await expect(page).not.toHaveURL(/.*\/unauthorized/)
  })

  test('should handle session expiration gracefully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email"]', TEST_USER.email)
    await page.fill('[data-testid="password"]', TEST_USER.password)
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies()
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should prevent brute force login attempts', async ({ page }) => {
    await page.goto('/login')
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="email"]', 'wrong@example.com')
      await page.fill('[data-testid="password"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      
      // Wait for response
      await page.waitForTimeout(1000)
    }
    
    // Should show rate limiting message
    await expect(page.locator('text=Too many attempts')).toBeVisible()
  })
})

test.describe('CSRF Protection Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin to test protected endpoints
    await page.goto('/login')
    await page.fill('[data-testid="email"]', ADMIN_USER.email)
    await page.fill('[data-testid="password"]', ADMIN_USER.password)
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should reject API requests without CSRF token', async ({ page }) => {
    // Make API request without CSRF token
    const response = await page.request.post('/api/users', {
      data: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
    })
    
    expect(response.status()).toBe(403)
    const responseBody = await response.json()
    expect(responseBody.code).toBe('CSRF_INVALID')
  })

  test('should accept API requests with valid CSRF token', async ({ page }) => {
    // Get CSRF token first
    const tokenResponse = await page.request.get('/api/csrf-token')
    expect(tokenResponse.ok()).toBeTruthy()
    
    const tokenData = await tokenResponse.json()
    expect(tokenData.token).toBeDefined()
    
    // Make API request with CSRF token
    const response = await page.request.post('/api/users', {
      headers: {
        'X-CSRF-Token': tokenData.token
      },
      data: {
        email: 'csrf-test@example.com',
        password: 'password123',
        name: 'CSRF Test User',
        role: 'user'
      }
    })
    
    // Should not be rejected due to CSRF (may fail for other reasons like validation)
    expect(response.status()).not.toBe(403)
  })

  test('should reject requests with invalid CSRF token', async ({ page }) => {
    // Make API request with invalid CSRF token
    const response = await page.request.post('/api/users', {
      headers: {
        'X-CSRF-Token': 'invalid-token-12345'
      },
      data: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
    })
    
    expect(response.status()).toBe(403)
    const responseBody = await response.json()
    expect(responseBody.code).toBe('CSRF_INVALID')
  })
})

test.describe('Input Validation Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', ADMIN_USER.email)
    await page.fill('[data-testid="password"]', ADMIN_USER.password)
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should reject XSS attempts in user creation', async ({ page }) => {
    // Get CSRF token
    const tokenResponse = await page.request.get('/api/csrf-token')
    const tokenData = await tokenResponse.json()
    
    // Attempt XSS in name field
    const response = await page.request.post('/api/users', {
      headers: {
        'X-CSRF-Token': tokenData.token
      },
      data: {
        email: 'xss-test@example.com',
        password: 'password123',
        name: '<script>alert("XSS")</script>',
        role: 'user'
      }
    })
    
    if (response.ok()) {
      const responseBody = await response.json()
      // Name should be sanitized
      expect(responseBody.user?.name).not.toContain('<script>')
    }
  })

  test('should reject SQL injection attempts', async ({ page }) => {
    // Get CSRF token
    const tokenResponse = await page.request.get('/api/csrf-token')
    const tokenData = await tokenResponse.json()
    
    // Attempt SQL injection in email field
    const response = await page.request.post('/api/users', {
      headers: {
        'X-CSRF-Token': tokenData.token
      },
      data: {
        email: "'; DROP TABLE users; --",
        password: 'password123',
        name: 'SQL Injection Test',
        role: 'user'
      }
    })
    
    // Should be rejected due to invalid email format
    expect(response.status()).toBe(400)
  })

  test('should validate email format strictly', async ({ page }) => {
    // Get CSRF token
    const tokenResponse = await page.request.get('/api/csrf-token')
    const tokenData = await tokenResponse.json()
    
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@example'
    ]
    
    for (const email of invalidEmails) {
      const response = await page.request.post('/api/users', {
        headers: {
          'X-CSRF-Token': tokenData.token
        },
        data: {
          email,
          password: 'password123',
          name: 'Test User',
          role: 'user'
        }
      })
      
      expect(response.status()).toBe(400)
    }
  })

  test('should enforce password strength requirements', async ({ page }) => {
    // Get CSRF token
    const tokenResponse = await page.request.get('/api/csrf-token')
    const tokenData = await tokenResponse.json()
    
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'abcdefgh'
    ]
    
    for (const password of weakPasswords) {
      const response = await page.request.post('/api/users', {
        headers: {
          'X-CSRF-Token': tokenData.token
        },
        data: {
          email: 'test@example.com',
          password,
          name: 'Test User',
          role: 'user'
        }
      })
      
      expect(response.status()).toBe(400)
    }
  })
})

test.describe('Rate Limiting Tests', () => {
  test('should enforce rate limits on user creation endpoint', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', ADMIN_USER.email)
    await page.fill('[data-testid="password"]', ADMIN_USER.password)
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Get CSRF token
    const tokenResponse = await page.request.get('/api/csrf-token')
    const tokenData = await tokenResponse.json()
    
    // Make multiple requests quickly
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.post('/api/users', {
          headers: {
            'X-CSRF-Token': tokenData.token
          },
          data: {
            email: `rate-limit-test-${i}@example.com`,
            password: 'password123',
            name: `Rate Limit Test ${i}`,
            role: 'user'
          }
        })
      )
    }
    
    const responses = await Promise.all(requests)
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })
})

test.describe('Security Headers Tests', () => {
  test('should include security headers in responses', async ({ page }) => {
    const response = await page.goto('/')
    
    const headers = response?.headers() || {}
    
    // Check for security headers
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['content-security-policy']).toContain("default-src 'self'")
  })
})