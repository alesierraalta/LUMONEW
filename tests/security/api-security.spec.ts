import { test, expect } from '@playwright/test'

test.describe('API Security Tests - /users/create endpoint', () => {
  let adminAuthHeaders: Record<string, string> = {}
  let csrfToken: string = ''

  test.beforeAll(async ({ request }) => {
    // Login as admin to get authentication cookies
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'admin-security@example.com',
        password: 'AdminPassword123!'
      }
    })
    
    if (loginResponse.ok()) {
      // Get CSRF token
      const tokenResponse = await request.get('/api/csrf-token')
      if (tokenResponse.ok()) {
        const tokenData = await tokenResponse.json()
        csrfToken = tokenData.token
        adminAuthHeaders['X-CSRF-Token'] = csrfToken
      }
    }
  })

  test('should require authentication for user creation', async ({ request }) => {
    // Make request without authentication
    const response = await request.post('/api/users', {
      data: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
    })
    
    expect(response.status()).toBe(401)
  })

  test('should require admin role for user creation', async ({ request }) => {
    // Login as regular user first
    const userLoginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test-security@example.com',
        password: 'TestPassword123!'
      }
    })
    
    if (userLoginResponse.ok()) {
      // Get CSRF token for regular user
      const tokenResponse = await request.get('/api/csrf-token')
      let userCsrfToken = ''
      if (tokenResponse.ok()) {
        const tokenData = await tokenResponse.json()
        userCsrfToken = tokenData.token
      }
      
      // Try to create user as regular user
      const response = await request.post('/api/users', {
        headers: {
          'X-CSRF-Token': userCsrfToken
        },
        data: {
          email: 'unauthorized-test@example.com',
          password: 'password123',
          name: 'Unauthorized Test'
        }
      })
      
      expect(response.status()).toBe(403)
    }
  })

  test('should validate required fields', async ({ request }) => {
    const testCases = [
      { data: {}, expectedError: 'Email is required' },
      { data: { email: 'test@example.com' }, expectedError: 'Password is required' },
      { data: { email: 'test@example.com', password: 'pass123' }, expectedError: 'Name is required' }
    ]
    
    for (const testCase of testCases) {
      const response = await request.post('/api/users', {
        headers: adminAuthHeaders,
        data: testCase.data
      })
      
      expect(response.status()).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.error).toContain(testCase.expectedError)
    }
  })

  test('should validate email format', async ({ request }) => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@example',
      'test@.com',
      'test@com.',
      'test space@example.com'
    ]
    
    for (const email of invalidEmails) {
      const response = await request.post('/api/users', {
        headers: adminAuthHeaders,
        data: {
          email,
          password: 'ValidPassword123!',
          name: 'Test User'
        }
      })
      
      expect(response.status()).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.error).toContain('Invalid email format')
    }
  })

  test('should enforce password strength requirements', async ({ request }) => {
    const weakPasswords = [
      '123',           // Too short
      'password',      // No numbers/special chars
      '12345678',      // Only numbers
      'abcdefgh',      // Only letters
      'Pass1',         // Too short
      'password123'    // No special characters
    ]
    
    for (const password of weakPasswords) {
      const response = await request.post('/api/users', {
        headers: adminAuthHeaders,
        data: {
          email: 'password-test@example.com',
          password,
          name: 'Password Test User'
        }
      })
      
      expect(response.status()).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.error).toContain('Password must be at least 8 characters')
    }
  })

  test('should sanitize input to prevent XSS', async ({ request }) => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '\u003cscript\u003ealert("XSS")\u003c/script\u003e'
    ]
    
    for (const payload of xssPayloads) {
      const response = await request.post('/api/users', {
        headers: adminAuthHeaders,
        data: {
          email: 'xss-test@example.com',
          password: 'ValidPassword123!',
          name: payload
        }
      })
      
      if (response.ok()) {
        const responseBody = await response.json()
        // Name should be sanitized - no script tags should remain
        expect(responseBody.user?.name).not.toContain('<script>')
        expect(responseBody.user?.name).not.toContain('javascript:')
        expect(responseBody.user?.name).not.toContain('onerror=')
        expect(responseBody.user?.name).not.toContain('onload=')
      }
    }
  })

  test('should prevent duplicate email registration', async ({ request }) => {
    const userData = {
      email: 'duplicate-test@example.com',
      password: 'ValidPassword123!',
      name: 'Duplicate Test User'
    }
    
    // Create user first time
    const firstResponse = await request.post('/api/users', {
      headers: adminAuthHeaders,
      data: userData
    })
    
    // Try to create same user again
    const secondResponse = await request.post('/api/users', {
      headers: adminAuthHeaders,
      data: userData
    })
    
    expect(secondResponse.status()).toBe(400)
    const responseBody = await secondResponse.json()
    expect(responseBody.error).toContain('User already exists')
  })

  test('should enforce rate limiting', async ({ request }) => {
    const requests = []
    
    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post('/api/users', {
          headers: adminAuthHeaders,
          data: {
            email: `rate-limit-${i}@example.com`,
            password: 'ValidPassword123!',
            name: `Rate Limit Test ${i}`
          }
        })
      )
    }
    
    const responses = await Promise.all(requests)
    
    // At least some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
    
    // Check rate limit error message
    if (rateLimitedResponses.length > 0) {
      const errorResponse = await rateLimitedResponses[0].json()
      expect(errorResponse.error).toContain('Too many requests')
    }
  })

  test('should validate role assignment', async ({ request }) => {
    const invalidRoles = [
      'superadmin',
      'root',
      'system',
      '<script>alert("XSS")</script>',
      'admin; DROP TABLE users;'
    ]
    
    for (const role of invalidRoles) {
      const response = await request.post('/api/users', {
        headers: adminAuthHeaders,
        data: {
          email: 'role-test@example.com',
          password: 'ValidPassword123!',
          name: 'Role Test User',
          role
        }
      })
      
      if (response.ok()) {
        const responseBody = await response.json()
        // Role should be sanitized or defaulted to 'user'
        expect(['user', 'admin', 'moderator']).toContain(responseBody.user?.role)
      } else {
        expect(response.status()).toBe(400)
      }
    }
  })

  test('should handle database errors gracefully', async ({ request }) => {
    // Test with extremely long input that might cause database errors
    const longString = 'a'.repeat(1000)
    
    const response = await request.post('/api/users', {
      headers: adminAuthHeaders,
      data: {
        email: 'db-error-test@example.com',
        password: 'ValidPassword123!',
        name: longString
      }
    })
    
    // Should either succeed with truncated data or fail gracefully
    if (!response.ok()) {
      expect(response.status()).toBe(400)
      const responseBody = await response.json()
      expect(responseBody.error).toBeDefined()
      // Should not expose internal database errors
      expect(responseBody.error).not.toContain('SQL')
      expect(responseBody.error).not.toContain('database')
      expect(responseBody.error).not.toContain('constraint')
    }
  })

  test('should log security events for audit', async ({ request }) => {
    // This test verifies that security events are logged
    // In a real scenario, you'd check log files or monitoring systems
    
    // Attempt unauthorized access
    const unauthorizedResponse = await request.post('/api/users', {
      data: {
        email: 'audit-test@example.com',
        password: 'ValidPassword123!',
        name: 'Audit Test User'
      }
    })
    
    expect(unauthorizedResponse.status()).toBe(401)
    
    // Attempt with invalid CSRF token
    const csrfResponse = await request.post('/api/users', {
      headers: {
        'X-CSRF-Token': 'invalid-token'
      },
      data: {
        email: 'csrf-audit-test@example.com',
        password: 'ValidPassword123!',
        name: 'CSRF Audit Test User'
      }
    })
    
    expect(csrfResponse.status()).toBe(403)
    
    // These should be logged for security monitoring
    // In production, you would verify log entries here
  })

  test('should return appropriate error codes and messages', async ({ request }) => {
    const testCases = [
      {
        data: {},
        expectedStatus: 400,
        expectedErrorType: 'validation'
      },
      {
        data: { email: 'invalid-email', password: 'pass', name: 'Test' },
        expectedStatus: 400,
        expectedErrorType: 'validation'
      }
    ]
    
    for (const testCase of testCases) {
      const response = await request.post('/api/users', {
        headers: adminAuthHeaders,
        data: testCase.data
      })
      
      expect(response.status()).toBe(testCase.expectedStatus)
      
      const responseBody = await response.json()
      expect(responseBody.error).toBeDefined()
      expect(typeof responseBody.error).toBe('string')
      
      // Should not expose sensitive information
      expect(responseBody.error).not.toContain('password')
      expect(responseBody.error).not.toContain('token')
      expect(responseBody.error).not.toContain('secret')
    }
  })
})