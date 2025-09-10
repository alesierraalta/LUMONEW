import { test, expect } from '@playwright/test'

test.describe('Direct Validation Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/es/users/create')
    await page.waitForLoadState('networkidle')
  })

  test('should show validation error for consecutive dots', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Fill with invalid email
    await emailInput.fill('test..email@example.com')
    
    // Click somewhere else to trigger blur
    await page.locator('input[type="text"]').first().click()
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check for any error indicators
    const errorMessage = page.locator('text="El email no puede contener puntos consecutivos"')
    const hasSpecificError = await errorMessage.count() > 0
    
    const anyErrorMessage = page.locator('p.text-destructive')
    const hasAnyError = await anyErrorMessage.count() > 0
    
    const inputClasses = await emailInput.getAttribute('class')
    const hasErrorClass = inputClasses?.includes('border-destructive')
    
    console.log('Specific error message found:', hasSpecificError)
    console.log('Any error message found:', hasAnyError)
    console.log('Input has error class:', hasErrorClass)
    console.log('Input classes:', inputClasses)
    
    if (hasAnyError) {
      const errorText = await anyErrorMessage.textContent()
      console.log('Error text found:', errorText)
    }
    
    // At least one validation indicator should be present
    expect(hasSpecificError || hasAnyError || hasErrorClass).toBe(true)
  })

  test('should accept valid email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    
    // Fill with valid email
    await emailInput.fill('test@example.com')
    
    // Click somewhere else to trigger blur
    await page.locator('input[type="text"]').first().click()
    
    // Wait for validation
    await page.waitForTimeout(1000)
    
    // Check for success indicators
    const errorMessage = page.locator('p.text-destructive')
    const hasError = await errorMessage.count() > 0
    
    const inputClasses = await emailInput.getAttribute('class')
    const hasErrorClass = inputClasses?.includes('border-destructive')
    const hasSuccessClass = inputClasses?.includes('border-green')
    
    console.log('Valid email - has error:', hasError)
    console.log('Valid email - has error class:', hasErrorClass)
    console.log('Valid email - has success class:', hasSuccessClass)
    console.log('Valid email - input classes:', inputClasses)
    
    // Should not have error indicators
    expect(hasError).toBe(false)
    expect(hasErrorClass).toBe(false)
  })
})