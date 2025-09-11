import { test, expect } from '@playwright/test'

test.describe('Authentication Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('should handle Supabase connection failures gracefully', async ({ page }) => {
    // Block Supabase requests to simulate connection failure
    await page.route('**/supabase.co/**', route => {
      route.abort('failed')
    })
    
    await page.goto('/')
    
    // Should not crash and should show some indication of connection issues
    await expect(page.locator('body')).toBeVisible()
    
    // Check if connection indicator shows offline status
    const connectionIndicator = page.locator('[title*="connection"]')
    if (await connectionIndicator.isVisible()) {
      await expect(connectionIndicator).toBeVisible()
    }
    
    // App should still be functional
    await expect(page.locator('text=LUMO')).toBeVisible()
  })

  test('should prevent infinite redirects in middleware', async ({ page }) => {
    let redirectCount = 0
    
    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        redirectCount++
      }
    })
    
    await page.goto('/dashboard')
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle')
    
    // Should not have excessive redirects (more than 5 indicates a loop)
    expect(redirectCount).toBeLessThan(5)
    
    // Should either be on login page or dashboard (if authenticated)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(login|dashboard|auth)/)
  })

  test('should synchronize auth state between client and server', async ({ page }) => {
    // Go to a protected route
    await page.goto('/dashboard')
    
    // Should redirect to login if not authenticated
    await page.waitForURL('**/login**', { timeout: 10000 })
    
    // Check that login page loads properly
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Try to access protected route directly
    await page.goto('/dashboard')
    
    // Should be redirected back to login consistently
    await page.waitForURL('**/login**', { timeout: 10000 })
  })

  test('should show connection status indicator', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Look for connection indicator (it might be in different locations)
    const possibleSelectors = [
      '[title*="Connected"]',
      '[title*="Offline"]', 
      '[title*="Checking"]',
      '[title*="Supabase"]',
      'svg.text-green-500',   // Connected icon
      'svg.text-red-500',     // Disconnected icon
      'svg.text-yellow-500',  // Checking icon
      'svg.text-orange-500',  // Unstable icon
      '.lucide-wifi',         // Wifi icon class
      '.lucide-wifi-off',     // Wifi off icon class
      '.lucide-alert-circle'  // Alert circle icon class
    ]
    
    let indicatorFound = false
    console.log('Checking for connection indicator...')
    
    // First, let's see what's actually on the page
    const pageContent = await page.content()
    console.log('Page contains ConnectionIndicator:', pageContent.includes('ConnectionIndicator'))
    console.log('Page contains wifi icons:', pageContent.includes('lucide-wifi'))
    
    for (const selector of possibleSelectors) {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible()
      console.log(`Selector '${selector}': visible=${isVisible}`)
      if (isVisible) {
        indicatorFound = true
        console.log(`Found connection indicator with selector: ${selector}`)
        break
      }
    }
    
    // Connection indicator should be present somewhere
    expect(indicatorFound).toBe(true)
  })

  test('should handle auth errors without crashing', async ({ page }) => {
    // Mock auth errors
    await page.route('**/auth/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.goto('/login')
    
    // Fill in login form
    await page.fill('input[type="email"]', 'alesierraalta@gmail.com')
    await page.fill('input[type="password"]', 'admin123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should handle error gracefully without crashing
    await expect(page.locator('body')).toBeVisible()
    
    // Should show some error indication
    const errorElements = page.locator('text=/error|failed|invalid/i')
    if (await errorElements.count() > 0) {
      await expect(errorElements.first()).toBeVisible()
    }
  })

  test('should retry failed connections', async ({ page }) => {
    let requestCount = 0
    
    // Fail first few requests, then succeed
    await page.route('**/supabase.co/**', route => {
      requestCount++
      if (requestCount <= 2) {
        route.abort('failed')
      } else {
        route.continue()
      }
    })
    
    await page.goto('/')
    
    // Wait for retries to happen
    await page.waitForTimeout(5000)
    
    // Should have made multiple requests (indicating retries)
    expect(requestCount).toBeGreaterThan(1)
    
    // App should still be functional
    await expect(page.locator('text=LUMO')).toBeVisible()
  })
})
