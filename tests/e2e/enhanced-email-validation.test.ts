import { test, expect } from '@playwright/test'

test.describe('Enhanced Email Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/create')
    await page.waitForLoadState('networkidle')
  })

  test('should validate basic email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Test invalid formats
    const invalidEmails = [
      'invalid',
      'invalid@',
      '@invalid.com',
      'invalid@.com',
      'invalid@com',
      'invalid.@com',
      'invalid..email@test.com',
      'invalid@test..com'
    ]
    
    for (const email of invalidEmails) {
      await emailInput.fill(email)
      await emailInput.blur()
      
      // Check for error state
      const hasError = await page.locator('.text-destructive, .text-red-500').count() > 0
      expect(hasError).toBe(true)
      
      console.log(`✓ Invalid email rejected: ${email}`)
    }
  })

  test('should validate email length limits', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Test local part too long (>64 characters)
    const longLocalPart = 'a'.repeat(65) + '@test.com'
    await emailInput.fill(longLocalPart)
    await emailInput.blur()
    
    let errorText = await page.locator('.text-destructive, .text-red-500').textContent()
    expect(errorText).toContain('parte local')
    
    // Test email too long (>254 characters)
    const longEmail = 'test@' + 'a'.repeat(250) + '.com'
    await emailInput.fill(longEmail)
    await emailInput.blur()
    
    errorText = await page.locator('.text-destructive, .text-red-500').textContent()
    expect(errorText).toContain('demasiado largo')
    
    console.log('✓ Email length limits validated')
  })

  test('should validate domain format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Test invalid domain formats
    const invalidDomains = [
      'test@domain',
      'test@domain.',
      'test@.domain.com',
      'test@domain-.com',
      'test@-domain.com',
      'test@domain.c'
    ]
    
    for (const email of invalidDomains) {
      await emailInput.fill(email)
      await emailInput.blur()
      
      const hasError = await page.locator('.text-destructive, .text-red-500').count() > 0
      expect(hasError).toBe(true)
      
      console.log(`✓ Invalid domain rejected: ${email}`)
    }
  })

  test('should accept valid emails', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test123@test-domain.org',
      'valid_email@subdomain.example.com',
      'a@b.co'
    ]
    
    for (const email of validEmails) {
      await emailInput.fill(email)
      await emailInput.blur()
      
      // Should not have error state
      const hasError = await page.locator('.text-destructive, .text-red-500').count() > 0
      expect(hasError).toBe(false)
      
      // Should show success state or no error
      const hasSuccess = await page.locator('.text-green-600, .text-green-500').count() > 0
      const isValid = hasSuccess || !hasError
      expect(isValid).toBe(true)
      
      console.log(`✓ Valid email accepted: ${email}`)
    }
  })

  test('should show specific error messages', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Test consecutive dots
    await emailInput.fill('test..email@domain.com')
    await emailInput.blur()
    let errorText = await page.locator('.text-destructive, .text-red-500').textContent()
    expect(errorText).toContain('puntos consecutivos')
    
    // Test invalid characters
    await emailInput.fill('test@domain@.com')
    await emailInput.blur()
    errorText = await page.locator('.text-destructive, .text-red-500').textContent()
    expect(errorText).toContain('caracteres no válidos')
    
    // Test short TLD
    await emailInput.fill('test@domain.c')
    await emailInput.blur()
    errorText = await page.locator('.text-destructive, .text-red-500').textContent()
    expect(errorText).toContain('nivel superior')
    
    console.log('✓ Specific error messages displayed correctly')
  })

  test('should validate email in real-time', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Start typing an invalid email
    await emailInput.type('invalid')
    await page.waitForTimeout(500)
    
    // Should show error state while typing
    let hasError = await page.locator('.text-destructive, .text-red-500').count() > 0
    expect(hasError).toBe(true)
    
    // Complete to valid email
    await emailInput.fill('invalid@test.com')
    await emailInput.blur()
    
    // Should show success or no error
    hasError = await page.locator('.text-destructive, .text-red-500').count() > 0
    expect(hasError).toBe(false)
    
    console.log('✓ Real-time validation working')
  })
})
