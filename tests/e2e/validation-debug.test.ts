import { test, expect } from '@playwright/test'

test.describe('Validation Debug Test', () => {
  test('should debug validation execution', async ({ page }) => {
    // Add console logging to track validation calls
    await page.addInitScript(() => {
      // Override console.log to capture validation logs
      const originalLog = console.log
      window.validationLogs = []
      console.log = (...args) => {
        window.validationLogs.push(args.join(' '))
        originalLog(...args)
      }
    })
    
    await page.goto('/users/create')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]')
    
    console.log('=== Testing consecutive dots validation ===')
    
    // Fill with invalid email
    await emailInput.fill('test..email@domain.com')
    await page.waitForTimeout(500)
    
    // Trigger blur event
    await emailInput.blur()
    await page.waitForTimeout(1000)
    
    // Get validation logs from the page
    const logs = await page.evaluate(() => window.validationLogs || [])
    console.log('Validation logs:', logs)
    
    // Check the DOM structure around the input
    const inputContainer = emailInput.locator('..')
    const containerHTML = await inputContainer.innerHTML()
    console.log('Input container HTML:', containerHTML)
    
    // Check all elements with error-related classes
    const allErrorElements = await page.locator('[class*="error"], [class*="destructive"], [class*="red"], .text-red-500, .text-red-600, .text-destructive').all()
    console.log(`Found ${allErrorElements.length} potential error elements`)
    
    for (let i = 0; i < allErrorElements.length; i++) {
      const element = allErrorElements[i]
      const text = await element.textContent()
      const isVisible = await element.isVisible()
      const classes = await element.getAttribute('class')
      console.log(`Error element ${i + 1}: "${text}" (visible: ${isVisible}, classes: ${classes})`)
    }
    
    // Check input validation state
    const inputValidationState = await emailInput.evaluate((input: HTMLInputElement) => {
      return {
        validity: input.validity,
        validationMessage: input.validationMessage,
        checkValidity: input.checkValidity()
      }
    })
    console.log('Input validation state:', inputValidationState)
    
    // Take screenshot for visual debugging
    await page.screenshot({ path: 'test-results/validation-debug.png', fullPage: true })
    
    // The test should pass regardless - we're just debugging
    expect(true).toBe(true)
  })
  
  test('should test with obviously invalid email', async ({ page }) => {
    await page.goto('/users/create')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]')
    
    console.log('=== Testing obviously invalid email ===')
    
    await emailInput.fill('invalid')
    await page.waitForTimeout(500)
    await emailInput.blur()
    await page.waitForTimeout(1000)
    
    // Check browser validation
    const inputValidationState = await emailInput.evaluate((input: HTMLInputElement) => {
      return {
        validity: input.validity,
        validationMessage: input.validationMessage,
        checkValidity: input.checkValidity()
      }
    })
    console.log('Browser validation for "invalid":', inputValidationState)
    
    // Check custom validation elements
    const errorElements = await page.locator('.text-destructive, .text-red-500, .text-red-600').all()
    console.log(`Found ${errorElements.length} custom error elements`)
    
    for (const element of errorElements) {
      const text = await element.textContent()
      const isVisible = await element.isVisible()
      console.log(`Custom error: "${text}" (visible: ${isVisible})`)
    }
    
    expect(true).toBe(true)
  })
})
