import { Page, expect } from '@playwright/test'
import { AuthPage } from './auth-page'

export class AuthenticationFlow {
  private page: Page
  private authPage: AuthPage

  constructor(page: Page) {
    this.page = page
    this.authPage = new AuthPage(page)
  }

  async loginAsTestUser(email: string = 'test@example.com', password: string = 'password123') {
    await this.authPage.goto()
    await this.authPage.login(email, password)
    
    // Wait for successful login redirect
    await this.page.waitForURL('**/dashboard**', { timeout: 10000 })
  }

  async loginAsAdmin(email: string = 'admin@example.com', password: string = 'admin123') {
    await this.authPage.goto()
    await this.authPage.login(email, password)
    
    // Wait for successful login redirect
    await this.page.waitForURL('**/dashboard**', { timeout: 10000 })
  }

  async logout() {
    // Look for logout button or menu
    const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign Out")')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    }
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/login**', { timeout: 10000 })
  }

  async ensureLoggedOut() {
    // Go to a protected route to check if we're logged in
    await this.page.goto('/dashboard')
    
    // If we're redirected to login, we're already logged out
    try {
      await this.page.waitForURL('**/login**', { timeout: 5000 })
    } catch {
      // If we're not redirected, we need to logout
      await this.logout()
    }
  }

  async ensureLoggedIn(email?: string, password?: string) {
    // Try to go to dashboard
    await this.page.goto('/dashboard')
    
    try {
      // If we're redirected to login, we need to login
      await this.page.waitForURL('**/login**', { timeout: 5000 })
      await this.loginAsTestUser(email, password)
    } catch {
      // If we're not redirected, we're already logged in
      // Verify we're on dashboard
      await expect(this.page).toHaveURL(/.*dashboard.*/, { timeout: 5000 })
    }
  }

  async verifyAuthenticationState(shouldBeLoggedIn: boolean) {
    await this.page.goto('/dashboard')
    
    if (shouldBeLoggedIn) {
      // Should stay on dashboard or be redirected there
      await expect(this.page).toHaveURL(/.*dashboard.*/, { timeout: 10000 })
    } else {
      // Should be redirected to login
      await this.page.waitForURL('**/login**', { timeout: 10000 })
    }
  }

  async handleAuthErrors() {
    // Check for common auth error messages
    const errorSelectors = [
      'text=/invalid.*credentials/i',
      'text=/authentication.*failed/i',
      'text=/login.*failed/i',
      '[role="alert"]',
      '.error-message',
      '.alert-error'
    ]

    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector)
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent()
        console.log(`Auth error detected: ${errorText}`)
        return errorText
      }
    }

    return null
  }
}
