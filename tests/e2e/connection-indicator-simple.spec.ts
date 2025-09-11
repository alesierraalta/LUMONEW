import { test, expect } from '@playwright/test'

test.describe('Connection Indicator Simple Test', () => {
  test('should render connection indicator component', async ({ page }) => {
    // Go to the login page first
    await page.goto('/auth/login')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/connection-indicator-debug.png', fullPage: true })
    
    // Check if any connection indicator elements are present
    const indicators = [
      '[data-testid="connection-indicator"]',
      '.connection-indicator',
      'svg.text-green-500',
      'svg.text-red-500',
      'svg.text-yellow-500',
      '[title*="Connected"]',
      '[title*="Disconnected"]',
      '[title*="Checking"]',
      'text=Connected',
      'text=Disconnected',
      'text=Checking'
    ]
    
    console.log('Checking for connection indicators...')
    
    for (const selector of indicators) {
      const element = page.locator(selector)
      const count = await element.count()
      console.log(`Selector "${selector}": ${count} elements found`)
      
      if (count > 0) {
        const isVisible = await element.first().isVisible()
        console.log(`First element visible: ${isVisible}`)
        
        if (isVisible) {
          console.log(`Found visible connection indicator with selector: ${selector}`)
          expect(true).toBe(true) // Test passes if we find any visible indicator
          return
        }
      }
    }
    
    // If we get here, no indicators were found
    console.log('No connection indicators found')
    
    // Check page content for debugging
    const pageContent = await page.content()
    console.log('Page contains "ConnectionIndicator":', pageContent.includes('ConnectionIndicator'))
    console.log('Page contains "connection":', pageContent.includes('connection'))
    console.log('Page contains "lucide":', pageContent.includes('lucide'))
    
    expect(false).toBe(true) // Force failure to see debug output
  })
})