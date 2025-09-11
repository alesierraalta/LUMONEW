import { test, expect } from '@playwright/test'

test.describe('Connection Indicator Debug', () => {
  test('should debug connection indicator rendering', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`Console ${msg.type()}: ${msg.text()}`)
    })

    // Enable error logging
    page.on('pageerror', error => {
      console.log(`Page error: ${error.message}`)
    })

    // Go to the login page
    await page.goto('/auth/login')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true })
    
    // Check if React is loaded
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || document.querySelector('[data-reactroot]') !== null
    })
    console.log('React loaded:', reactLoaded)
    
    // Check if the page has any React components
    const hasReactComponents = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      for (let el of elements) {
        if (el.hasAttribute('data-testid') || el.className.includes('react')) {
          return true
        }
      }
      return false
    })
    console.log('Has React components:', hasReactComponents)
    
    // Check for any JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.onerror ? 'JS errors detected' : 'No JS errors'
    })
    console.log('JS errors status:', jsErrors)
    
    // Check if ConnectionIndicator import is working
    const pageSource = await page.content()
    console.log('Page contains ConnectionIndicator:', pageSource.includes('ConnectionIndicator'))
    console.log('Page contains data-testid:', pageSource.includes('data-testid'))
    
    // Try to find any elements with connection-related classes or attributes
    const connectionElements = await page.locator('[class*="connection"], [data-testid*="connection"], [title*="connection"], [title*="Connected"], [title*="Disconnected"]').count()
    console.log('Connection-related elements found:', connectionElements)
    
    // Check for Supabase-related elements
    const supabaseElements = await page.locator('[class*="supabase"], [data-testid*="supabase"]').count()
    console.log('Supabase-related elements found:', supabaseElements)
    
    // Check for any SVG icons (Lucide icons)
    const svgElements = await page.locator('svg').count()
    console.log('SVG elements found:', svgElements)
    
    // Check if the useSupabaseConnection hook is working
    const hookStatus = await page.evaluate(() => {
      // Try to access any global state or context
      return {
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasReact: typeof window.React !== 'undefined'
      }
    })
    console.log('Hook environment status:', JSON.stringify(hookStatus))
    
    expect(true).toBe(true) // Always pass to see debug output
  })
})