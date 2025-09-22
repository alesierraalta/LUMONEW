import { test, expect } from '@playwright/test'

test.describe('Dashboard and Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  })

  test('should display dashboard with key metrics', async ({ page }) => {
    // Verify dashboard is loaded
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    await expect(page.locator('h2:has-text("Business Intelligence Dashboard")')).toBeVisible()
    
    // Verify quick tools section
    await expect(page.locator('text=Herramientas Rápidas')).toBeVisible()
    await expect(page.locator('[data-testid="quick-tools"]')).toBeVisible()
    
    // Verify metric cards
    await expect(page.locator('text=Total de Productos')).toBeVisible()
    await expect(page.locator('text=Total Items')).toBeVisible()
    await expect(page.locator('text=Total Value')).toBeVisible()
    await expect(page.locator('text=Low Stock')).toBeVisible()
    await expect(page.locator('text=Categories')).toBeVisible()
    
    // Verify metric values are displayed
    await expect(page.locator('[data-testid="total-items-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-value-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="low-stock-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="categories-count"]')).toBeVisible()
  })

  test('should navigate through sidebar menu items', async ({ page }) => {
    // Test Dashboard navigation
    await page.click('text=Dashboard')
    await expect(page).toHaveURL(/.*\/dashboard|^\/$/)
    await expect(page.locator('h2:has-text("Business Intelligence Dashboard")')).toBeVisible()
    
    // Test Projects navigation
    await page.click('text=Projects')
    await expect(page).toHaveURL(/.*\/projects/)
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible()
    
    // Test Inventory section
    await page.click('text=Stock')
    await expect(page).toHaveURL(/.*\/inventory/)
    await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible()
    
    // Test Categories
    await page.click('text=Categories')
    await expect(page).toHaveURL(/.*\/categories/)
    await expect(page.locator('h1:has-text("Categories")')).toBeVisible()
    
    // Test Locations
    await page.click('text=Locations')
    await expect(page).toHaveURL(/.*\/locations/)
    await expect(page.locator('h1:has-text("Locations")')).toBeVisible()
    
    // Test Users
    await page.click('text=Users')
    await expect(page).toHaveURL(/.*\/users/)
    await expect(page.locator('h1:has-text("Users")')).toBeVisible()
    
    // Test Deleted Items
    await page.click('text=Deleted Items')
    await expect(page).toHaveURL(/.*\/deleted-items/)
    await expect(page.locator('h1:has-text("Deleted Items")')).toBeVisible()
    
    // Test Settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/settings/)
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible()
  })

  test('should toggle sidebar collapse', async ({ page }) => {
    // Verify sidebar is expanded by default
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/expanded/)
    
    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]')
    
    // Verify sidebar is collapsed
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/collapsed/)
    
    // Expand sidebar again
    await page.click('[data-testid="sidebar-toggle"]')
    
    // Verify sidebar is expanded
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/expanded/)
  })

  test('should display user profile information', async ({ page }) => {
    // Verify user profile section
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
    
    // Verify user avatar
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()
    
    // Verify user name and email
    await expect(page.locator('text=Alejandro Sierraalta')).toBeVisible()
    await expect(page.locator('text=alesierraalta@gmail.com')).toBeVisible()
    
    // Test user profile dropdown
    await page.click('[data-testid="user-profile"]')
    
    // Verify dropdown menu appears
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('text=Logout')).toBeVisible()
    
    // Close dropdown
    await page.click('[data-testid="dashboard"]') // Click outside
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
  })

  test('should use quick action buttons', async ({ page }) => {
    // Test Add Item quick action
    await page.click('[data-testid="quick-add-item"]')
    await expect(page).toHaveURL(/.*\/inventory\/new/)
    await expect(page.locator('h1:has-text("Add New Item")')).toBeVisible()
    
    // Go back to dashboard
    await page.click('text=Dashboard')
    
    // Test New Category quick action
    await page.click('[data-testid="quick-add-category"]')
    await expect(page.locator('[data-testid="category-modal"]')).toBeVisible()
    await expect(page.locator('text=New Category')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="category-modal"]')).not.toBeVisible()
    
    // Test Add Location quick action
    await page.click('[data-testid="quick-add-location"]')
    await expect(page.locator('[data-testid="location-modal"]')).toBeVisible()
    await expect(page.locator('text=Add Location')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="location-modal"]')).not.toBeVisible()
    
    // Test Add User quick action
    await page.click('[data-testid="quick-add-user"]')
    await expect(page.locator('[data-testid="user-modal"]')).toBeVisible()
    await expect(page.locator('text=Add User')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="user-modal"]')).not.toBeVisible()
  })

  test('should display and interact with dashboard tabs', async ({ page }) => {
    // Verify tab navigation
    await expect(page.locator('[data-testid="dashboard-tabs"]')).toBeVisible()
    
    // Test Overview tab (default)
    await expect(page.locator('[data-testid="tab-overview"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="overview-content"]')).toBeVisible()
    
    // Test Inventory tab
    await page.click('[data-testid="tab-inventory"]')
    await expect(page.locator('[data-testid="tab-inventory"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="inventory-content"]')).toBeVisible()
    
    // Test Sales tab
    await page.click('[data-testid="tab-sales"]')
    await expect(page.locator('[data-testid="tab-sales"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="sales-content"]')).toBeVisible()
    
    // Test Locations tab
    await page.click('[data-testid="tab-locations"]')
    await expect(page.locator('[data-testid="tab-locations"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="locations-content"]')).toBeVisible()
    
    // Test Financial tab
    await page.click('[data-testid="tab-financial"]')
    await expect(page.locator('[data-testid="tab-financial"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="financial-content"]')).toBeVisible()
    
    // Test Alerts tab
    await page.click('[data-testid="tab-alerts"]')
    await expect(page.locator('[data-testid="tab-alerts"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="alerts-content"]')).toBeVisible()
  })

  test('should display recent activities', async ({ page }) => {
    // Verify recent activities section
    await expect(page.locator('text=Actividades Recientes')).toBeVisible()
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible()
    
    // Verify activity items are displayed
    const activityItems = page.locator('[data-testid="activity-item"]')
    if (await activityItems.count() > 0) {
      // Verify activity item structure
      await expect(activityItems.first()).toBeVisible()
      
      // Check for activity details
      await expect(activityItems.first().locator('[data-testid="activity-type"]')).toBeVisible()
      await expect(activityItems.first().locator('[data-testid="activity-description"]')).toBeVisible()
      await expect(activityItems.first().locator('[data-testid="activity-timestamp"]')).toBeVisible()
    }
    
    // Test view full history link
    const fullHistoryLink = page.locator('text=Ver historial completo')
    if (await fullHistoryLink.isVisible()) {
      await fullHistoryLink.click()
      await expect(page).toHaveURL(/.*\/audit/)
    }
  })

  test('should display inventory overview chart', async ({ page }) => {
    // Verify chart section
    await expect(page.locator('text=Inventory Overview')).toBeVisible()
    await expect(page.locator('[data-testid="inventory-chart"]')).toBeVisible()
    
    // Verify chart elements
    await expect(page.locator('[data-testid="chart-container"]')).toBeVisible()
    
    // Verify chart legend
    await expect(page.locator('[data-testid="chart-legend"]')).toBeVisible()
    await expect(page.locator('text=Equipment')).toBeVisible()
    await expect(page.locator('text=Software')).toBeVisible()
    await expect(page.locator('text=Electronics')).toBeVisible()
    await expect(page.locator('text=Furniture')).toBeVisible()
  })

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view (default)
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Verify responsive behavior
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Verify mobile layout
    const sidebar = page.locator('[data-testid="sidebar"]')
    if (await sidebar.isVisible()) {
      // Mobile sidebar might be collapsed by default
      await expect(sidebar).toHaveClass(/mobile/)
    }
    
    // Test mobile menu toggle
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]')
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    }
  })

  test('should handle loading states', async ({ page }) => {
    // Intercept API calls to add delay
    await page.route('**/api/dashboard**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      route.continue()
    })
    
    // Reload page
    await page.reload()
    
    // Verify loading indicators
    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="metrics-skeleton"]')).toBeVisible()
    
    // Wait for content to load
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 })
    
    // Verify loading indicators are hidden
    await expect(page.locator('[data-testid="dashboard-loading"]')).not.toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api/dashboard**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Reload page
    await page.reload()
    
    // Verify error message
    await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Failed to load dashboard data')).toBeVisible()
    
    // Verify retry button
    const retryButton = page.locator('[data-testid="retry-button"]')
    if (await retryButton.isVisible()) {
      // Remove error simulation
      await page.unroute('**/api/dashboard**')
      
      // Click retry
      await retryButton.click()
      
      // Verify dashboard loads successfully
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display notifications and alerts', async ({ page }) => {
    // Check for notification bell
    const notificationBell = page.locator('[data-testid="notification-bell"]')
    
    if (await notificationBell.isVisible()) {
      // Check for notification badge
      const notificationBadge = page.locator('[data-testid="notification-badge"]')
      
      if (await notificationBadge.isVisible()) {
        // Click notification bell
        await notificationBell.click()
        
        // Verify notification panel opens
        await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible()
        
        // Verify notification items
        await expect(page.locator('[data-testid="notification-item"]')).toHaveCount.toBeGreaterThan(0)
        
        // Test mark as read functionality
        const firstNotification = page.locator('[data-testid="notification-item"]').first()
        await firstNotification.locator('[data-testid="mark-read-button"]').click()
        
        // Close notification panel
        await page.click('[data-testid="close-notifications"]')
        await expect(page.locator('[data-testid="notification-panel"]')).not.toBeVisible()
      }
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test Tab navigation through quick actions
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Verify focus is on first quick action
    await expect(page.locator('[data-testid="quick-add-item"]')).toBeFocused()
    
    // Navigate to next quick action
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="quick-add-category"]')).toBeFocused()
    
    // Test Enter key activation
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="category-modal"]')).toBeVisible()
    
    // Test Escape key to close modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="category-modal"]')).not.toBeVisible()
  })

  test('should maintain state across page refresh', async ({ page }) => {
    // Change to inventory tab
    await page.click('[data-testid="tab-inventory"]')
    await expect(page.locator('[data-testid="tab-inventory"]')).toHaveAttribute('aria-selected', 'true')
    
    // Refresh page
    await page.reload()
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
    
    // Verify state is maintained (should be on overview tab by default)
    await expect(page.locator('[data-testid="tab-overview"]')).toHaveAttribute('aria-selected', 'true')
  })

  test('should handle theme switching', async ({ page }) => {
    // Check if theme toggle exists
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    
    if (await themeToggle.isVisible()) {
      // Get current theme
      const currentTheme = await page.getAttribute('html', 'data-theme')
      
      // Toggle theme
      await themeToggle.click()
      
      // Verify theme changed
      const newTheme = await page.getAttribute('html', 'data-theme')
      expect(newTheme).not.toBe(currentTheme)
      
      // Toggle back
      await themeToggle.click()
      
      // Verify theme reverted
      const revertedTheme = await page.getAttribute('html', 'data-theme')
      expect(revertedTheme).toBe(currentTheme)
    }
  })

  test('should handle search functionality', async ({ page }) => {
    // Check if global search exists
    const searchInput = page.locator('[data-testid="global-search"]')
    
    if (await searchInput.isVisible()) {
      // Enter search term
      await searchInput.fill('test')
      await page.keyboard.press('Enter')
      
      // Verify search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
      
      // Clear search
      await searchInput.clear()
      await page.keyboard.press('Escape')
      
      // Verify search results are hidden
      await expect(page.locator('[data-testid="search-results"]')).not.toBeVisible()
    }
  })
})