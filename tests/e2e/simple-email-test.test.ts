import { test, expect } from '@playwright/test'

test.describe('Simple Email Validation Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/create')
    await page.waitForLoadState('networkidle')
  })

  test('should show any validation error for consecutive dots', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    console.log('Testing consecutive dots: test..email@domain.com')
    await emailInput.fill('test..email@domain.com')
    await emailInput.blur()
    await page.waitForTimeout(1000)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/consecutive-dots-debug.png' })
    
    // Check if ANY error message appears
    const errorElements = await page.locator('.text-destructive, .text-red-500, .text-red-600, [class*="error"], [class*="destructive"]').all()
    console.log(`Found ${errorElements.length} potential error elements`)
    
    for (let i = 0; i < errorElements.length; i++) {
      const text = await errorElements[i].textContent()
      const isVisible = await errorElements[i].isVisible()
      console.log(`Error element ${i + 1}: "${text}" (visible: ${isVisible})`)
    }
    
    // Check validation state
    const inputClasses = await emailInput.getAttribute('class')
    console.log('Input classes:', inputClasses)
    
    // Check if input has error styling
    const hasErrorStyling = inputClasses?.includes('border-destructive') || inputClasses?.includes('border-red')
    console.log('Has error styling:', hasErrorStyling)
    
    // At minimum, there should be some indication of validation
    const hasAnyValidationIndicator = errorElements.length > 0 || hasErrorStyling
    expect(hasAnyValidationIndicator).toBe(true)
  })
  
  test('should accept valid email without errors', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    console.log('Testing valid email: test@example.com')
    await emailInput.fill('test@example.com')
    await emailInput.blur()
    await page.waitForTimeout(500)
    
    // Should not have error styling
    const inputClasses = await emailInput.getAttribute('class')
    console.log('Valid email input classes:', inputClasses)
    
    const hasErrorStyling = inputClasses?.includes('border-destructive') || inputClasses?.includes('border-red')
    expect(hasErrorStyling).toBe(false)
    
    // Should not have visible error messages
    const errorElements = await page.locator('.text-destructive, .text-red-500, .text-red-600').all()
    let hasVisibleErrors = false
    for (const element of errorElements) {
      if (await element.isVisible()) {
        const text = await element.textContent()
        console.log('Visible error for valid email:', text)
        hasVisibleErrors = true
      }
    }
    expect(hasVisibleErrors).toBe(false)
  })
  
  test('should show validation for obviously invalid email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    console.log('Testing obviously invalid email: plaintext')
    await emailInput.fill('plaintext')
    await emailInput.blur()
    await page.waitForTimeout(500)
    
    // Should have some form of validation
    const inputClasses = await emailInput.getAttribute('class')
    const hasErrorStyling = inputClasses?.includes('border-destructive') || inputClasses?.includes('border-red')
    
    const errorElements = await page.locator('.text-destructive, .text-red-500, .text-red-600').all()
    let hasVisibleErrors = false
    for (const element of errorElements) {
      if (await element.isVisible()) {
        hasVisibleErrors = true
        const text = await element.textContent()
        console.log('Error for invalid email:', text)
      }
    }
    
    const hasValidation = hasErrorStyling || hasVisibleErrors
    expect(hasValidation).toBe(true)
  })
})
