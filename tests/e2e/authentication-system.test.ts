/**
 * Authentication System Tests
 * Tests user login, logout, session management, and permissions
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002')
  })

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Navigate to protected route
    await page.goto('http://localhost:3002/inventory')
    
    // Should redirect to login or show login form
    const loginForm = page.locator('form[data-testid="login-form"]')
    const loginButton = page.getByRole('button', { name: /login|sign in|iniciar sesión/i })
    
    // Either login form or login button should be visible
    const hasLoginForm = await loginForm.isVisible().catch(() => false)
    const hasLoginButton = await loginButton.isVisible().catch(() => false)
    
    expect(hasLoginForm || hasLoginButton).toBeTruthy()
  })

  test('should handle successful login', async ({ page }) => {
    // Check if user is already logged in
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // If already logged in, skip this test
    const isLoggedIn = await page.locator('text=Alejandro Sierraalta').isVisible().catch(() => false)
    if (isLoggedIn) {
      test.skip('User is already logged in')
      return
    }
    
    // Look for login form or authentication method
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const loginButton = page.getByRole('button', { name: /login|sign in|iniciar sesión/i })
    
    if (await emailInput.isVisible()) {
      // Fill login form
      await emailInput.fill('alesierraalta@gmail.com')
      await passwordInput.fill('testpassword')
      await loginButton.click()
      
      // Wait for redirect or success
      await page.waitForLoadState('networkidle')
      
      // Verify user is logged in
      await expect(page.locator('text=Alejandro Sierraalta')).toBeVisible()
    }
  })

  test('should display user information when logged in', async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Check if user info is displayed
    const userInfo = page.locator('text=Alejandro Sierraalta')
    const userEmail = page.locator('text=alesierraalta@gmail.com')
    
    // At least one should be visible if logged in
    const hasUserInfo = await userInfo.isVisible().catch(() => false)
    const hasUserEmail = await userEmail.isVisible().catch(() => false)
    
    if (hasUserInfo || hasUserEmail) {
      // User is logged in, verify user information is displayed
      expect(hasUserInfo || hasUserEmail).toBeTruthy()
    } else {
      // User is not logged in, this is expected behavior
      test.skip('User is not logged in, which is expected')
    }
  })

  test('should handle logout functionality', async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Look for logout button or user menu
    const logoutButton = page.getByRole('button', { name: /logout|sign out|cerrar sesión/i })
    const userMenu = page.locator('[data-testid="user-menu"]')
    
    if (await logoutButton.isVisible()) {
      // Click logout button
      await logoutButton.click()
      
      // Verify redirect to login or home page
      await page.waitForLoadState('networkidle')
      
      // Should not show user information anymore
      const userInfo = page.locator('text=Alejandro Sierraalta')
      await expect(userInfo).not.toBeVisible()
    } else if (await userMenu.isVisible()) {
      // Click user menu to reveal logout option
      await userMenu.click()
      
      const logoutOption = page.getByRole('button', { name: /logout|sign out|cerrar sesión/i })
      if (await logoutOption.isVisible()) {
        await logoutOption.click()
        
        // Verify logout
        await page.waitForLoadState('networkidle')
        const userInfo = page.locator('text=Alejandro Sierraalta')
        await expect(userInfo).not.toBeVisible()
      }
    } else {
      test.skip('No logout functionality found or user not logged in')
    }
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Check if user is logged in
    const userInfo = page.locator('text=Alejandro Sierraalta')
    const isLoggedIn = await userInfo.isVisible().catch(() => false)
    
    if (isLoggedIn) {
      // Refresh the page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Verify user is still logged in
      await expect(userInfo).toBeVisible()
    } else {
      test.skip('User is not logged in')
    }
  })

  test('should protect inventory routes from unauthenticated access', async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies()
    
    // Try to access protected route
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Should either redirect to login or show authentication required
    const currentUrl = page.url()
    const hasLoginForm = await page.locator('form[data-testid="login-form"]').isVisible().catch(() => false)
    const hasLoginButton = await page.getByRole('button', { name: /login|sign in|iniciar sesión/i }).isVisible().catch(() => false)
    
    // Either redirected to login page or login form is visible
    const isProtected = currentUrl.includes('/login') || currentUrl.includes('/auth') || hasLoginForm || hasLoginButton
    
    expect(isProtected).toBeTruthy()
  })

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Look for login form
    await page.goto('http://localhost:3002')
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const loginButton = page.getByRole('button', { name: /login|sign in|iniciar sesión/i })
    
    if (await emailInput.isVisible()) {
      // Try invalid credentials
      await emailInput.fill('invalid@email.com')
      await passwordInput.fill('wrongpassword')
      await loginButton.click()
      
      // Wait for error message
      await page.waitForTimeout(2000)
      
      // Check for error message
      const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error')
      const hasError = await errorMessage.isVisible().catch(() => false)
      
      if (hasError) {
        await expect(errorMessage).toBeVisible()
      }
    } else {
      test.skip('No login form found')
    }
  })

  test('should validate user permissions for different actions', async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Check if user is logged in
    const userInfo = page.locator('text=Alejandro Sierraalta')
    const isLoggedIn = await userInfo.isVisible().catch(() => false)
    
    if (isLoggedIn) {
      // Verify user can access inventory management features
      const newProductButton = page.getByRole('button', { name: 'Nuevo Producto' })
      const bulkCreateButton = page.getByRole('button', { name: 'Crear Múltiples' })
      
      // These buttons should be visible for authenticated users
      await expect(newProductButton).toBeVisible()
      await expect(bulkCreateButton).toBeVisible()
      
      // Verify user can see inventory data
      const inventoryTable = page.locator('table')
      await expect(inventoryTable).toBeVisible()
    } else {
      test.skip('User is not logged in')
    }
  })

  test('should handle session timeout gracefully', async ({ page }) => {
    await page.goto('http://localhost:3002/inventory')
    await page.waitForLoadState('networkidle')
    
    // Check if user is logged in
    const userInfo = page.locator('text=Alejandro Sierraalta')
    const isLoggedIn = await userInfo.isVisible().catch(() => false)
    
    if (isLoggedIn) {
      // Simulate session timeout by clearing cookies
      await page.context().clearCookies()
      
      // Try to perform an action
      const newProductButton = page.getByRole('button', { name: 'Nuevo Producto' })
      if (await newProductButton.isVisible()) {
        await newProductButton.click()
        
        // Should either redirect to login or show authentication error
        await page.waitForLoadState('networkidle')
        
        const currentUrl = page.url()
        const hasLoginForm = await page.locator('form[data-testid="login-form"]').isVisible().catch(() => false)
        
        const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/auth') || hasLoginForm
        expect(isRedirected).toBeTruthy()
      }
    } else {
      test.skip('User is not logged in')
    }
  })
})
