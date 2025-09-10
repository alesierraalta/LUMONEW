import { test, expect } from '@playwright/test'

test.describe('Debug Email Validation', () => {
  test('should debug email validation behavior', async ({ page }) => {
    await page.goto('/users/create')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]')
    
    console.log('=== Testing invalid email: test..email@domain.com ===')
    
    // Fill with invalid email (consecutive dots)
    await emailInput.fill('test..email@domain.com')
    await emailInput.blur()
    await page.waitForTimeout(1000) // Wait for validation
    
    // Debug: Check what elements exist
    const allErrorElements = await page.locator('.text-destructive, .text-red-500, [class*="error"], [class*="invalid"]').all()
    console.log(`Found ${allErrorElements.length} potential error elements`)
    
    for (let i = 0; i < allErrorElements.length; i++) {
      const text = await allErrorElements[i].textContent()
      const classes = await allErrorElements[i].getAttribute('class')
      console.log(`Error element ${i}: "${text}" (classes: ${classes})`)
    }
    
    // Check input state
    const inputClasses = await emailInput.getAttribute('class')
    const inputValue = await emailInput.inputValue()
    const inputValidity = await emailInput.evaluate((el: HTMLInputElement) => {
      return {
        valid: el.validity.valid,
        valueMissing: el.validity.valueMissing,
        typeMismatch: el.validity.typeMismatch,
        patternMismatch: el.validity.patternMismatch,
        customError: el.validity.customError,
        validationMessage: el.validationMessage
      }
    })
    
    console.log('Input state:')
    console.log('- Value:', inputValue)
    console.log('- Classes:', inputClasses)
    console.log('- Validity:', inputValidity)
    
    // Check parent container for error states
    const parentContainer = emailInput.locator('..')
    const parentClasses = await parentContainer.getAttribute('class')
    console.log('- Parent classes:', parentClasses)
    
    // Look for any text that might contain error messages
    const allText = await page.locator('text=/.*error.*|.*inválido.*|.*consecutivos.*|.*válidos.*/i').all()
    console.log(`Found ${allText.length} elements with error-related text`)
    
    for (let i = 0; i < allText.length; i++) {
      const text = await allText[i].textContent()
      console.log(`Error text ${i}: "${text}"`)
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-email-validation.png', fullPage: true })
    console.log('Screenshot saved as debug-email-validation.png')
    
    // Test with a clearly valid email
    console.log('\n=== Testing valid email: test@example.com ===')
    await emailInput.fill('test@example.com')
    await emailInput.blur()
    await page.waitForTimeout(1000)
    
    const validInputValidity = await emailInput.evaluate((el: HTMLInputElement) => {
      return {
        valid: el.validity.valid,
        validationMessage: el.validationMessage
      }
    })
    
    console.log('Valid email input state:')
    console.log('- Validity:', validInputValidity)
    
    // Look for success indicators
    const successElements = await page.locator('.text-green-600, .text-green-500, .text-green-400, [class*="success"]').all()
    console.log(`Found ${successElements.length} potential success elements`)
    
    for (let i = 0; i < successElements.length; i++) {
      const text = await successElements[i].textContent()
      const classes = await successElements[i].getAttribute('class')
      console.log(`Success element ${i}: "${text}" (classes: ${classes})`)
    }
  })
})
